import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { approvalFingerprint, buildApprovalSnapshot, type ApprovalInput } from "@/lib/scheduler/approval";
import { canMutateSchedulerContent, MAX_MEDIA_PER_POST } from "@/lib/scheduler/media";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  approvePostAtBoundary,
  classifyApprovalMediaRead,
  classifyApprovalPostRead,
  createPostAtBoundary,
  isSchedulerPostMutationAction,
} from "@/lib/scheduler/postMutations";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSupabaseSchedulerStore } from "@/lib/scheduler/store";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = readSchedulerSession(cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const supabase = createSchedulerSupabaseClient();

  if (isSchedulerPostMutationAction(body?.action)) {
    const { data: user, error: userError } = await supabase.from("scheduler_users")
      .select("status,suspended_at,deletion_requested_at,terms_version,privacy_version")
      .eq("id", session.userId)
      .maybeSingle();
    if (userError) return NextResponse.json({ error: "Unable to verify scheduler access." }, { status: 502 });
    const canMutate = !userError && !!user && canMutateSchedulerContent({
      status: typeof user.status === "string" ? user.status : null,
      suspendedAt: typeof user.suspended_at === "string" ? user.suspended_at : null,
      deletionRequestedAt: typeof user.deletion_requested_at === "string" ? user.deletion_requested_at : null,
      termsVersion: typeof user.terms_version === "string" ? user.terms_version : null,
      privacyVersion: typeof user.privacy_version === "string" ? user.privacy_version : null,
    });
    if (!canMutate) {
      return NextResponse.json({ error: "Active scheduler access and current legal acceptance are required." }, { status: 403 });
    }
  }

  if (body?.action === "create") {
    const mediaIds = Array.isArray(body.mediaIds) && body.mediaIds.every((value) => typeof value === "string" && value.length > 0)
      ? body.mediaIds as string[]
      : [];
    if (!mediaIds.length || mediaIds.length > MAX_MEDIA_PER_POST) {
      return NextResponse.json({ error: "Select between 1 and 10 media files." }, { status: 400 });
    }
    const distinctMediaIds = [...new Set(mediaIds)];
    if (distinctMediaIds.length !== mediaIds.length) {
      return NextResponse.json({ error: "Select distinct media files." }, { status: 400 });
    }

    const result = await createPostAtBoundary(await createSupabaseSchedulerStore(), {
      userId: session.userId,
      mediaIds,
      title: String(body.title || ""),
      caption: String(body.caption || ""),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ postId: result.postId }, { status: result.status });
  }

  if (body?.action === "approve") {
    const postId = String(body.postId || "");
    const { data: post, error: postError } = await supabase.from("scheduled_posts").select("id,title,caption")
      .eq("id", postId).eq("user_id", session.userId).maybeSingle();
    const postRead = classifyApprovalPostRead({ data: post, error: !!postError });
    if (!postRead.ok) return NextResponse.json({ error: postRead.error }, { status: postRead.status });
    const { data: media, error: mediaError } = await supabase.from("post_media")
      .select("position,media_assets!inner(id,checksum,user_id,validation_status)")
      .eq("post_id", postId).order("position");
    const mediaRead = classifyApprovalMediaRead({ data: media, error: !!mediaError });
    if (!mediaRead.ok) return NextResponse.json({ error: mediaRead.error }, { status: mediaRead.status });
    const snapshotMedia = mediaRead.data.map((row) => {
      const asset = row.media_assets as unknown as { id: string; checksum: string; user_id: string; validation_status: string };
      return { asset, position: row.position };
    });
    if (snapshotMedia.some(({ asset }) => asset.user_id !== session.userId || asset.validation_status !== "VALID")) {
      return NextResponse.json({ error: "Post media or content changed before approval." }, { status: 409 });
    }
    let snapshot: Record<string, unknown>;
    try {
      snapshot = buildApprovalSnapshot({
        ...(body.approval as Omit<ApprovalInput, "creatorOpenId" | "media" | "title" | "caption">),
        creatorOpenId: session.openId, title: postRead.data.title, caption: postRead.data.caption,
        media: snapshotMedia.map(({ asset, position }) => ({ id: asset.id, checksum: asset.checksum, position })),
      });
    } catch {
      return NextResponse.json({ error: "Approval is incomplete." }, { status: 400 });
    }
    const fingerprint = approvalFingerprint(snapshot);
    const result = await approvePostAtBoundary(await createSupabaseSchedulerStore(), {
      userId: session.userId, postId, fingerprint, snapshot,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ postId: result.postId, approvalId: result.approvalId, fingerprint: result.fingerprint });
  }

  return NextResponse.json({ error: "Unsupported post action." }, { status: 400 });
}

