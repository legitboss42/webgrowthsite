import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { approvalFingerprint, buildApprovalSnapshot, type ApprovalInput } from "@/lib/scheduler/approval";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
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

  if (body?.action === "create") {
    const mediaIds = Array.isArray(body.mediaIds) ? body.mediaIds.map(String) : [];
    if (!mediaIds.length || mediaIds.length > 35) return NextResponse.json({ error: "Select valid media." }, { status: 400 });
    const { data: media } = await supabase.from("media_assets").select("id,kind")
      .eq("user_id", session.userId).eq("validation_status", "VALID").in("id", mediaIds);
    if (!media || media.length !== mediaIds.length) return NextResponse.json({ error: "Media ownership check failed." }, { status: 403 });
    const kind = media[0]!.kind;
    if (media.some((asset) => asset.kind !== kind) || (kind === "VIDEO" && media.length !== 1)) {
      return NextResponse.json({ error: "Post media cannot be mixed." }, { status: 400 });
    }
    const { data: post, error } = await supabase.from("scheduled_posts").insert({
      user_id: session.userId, kind, title: String(body.title || ""), caption: String(body.caption || ""), status: "NEEDS_APPROVAL",
    }).select().single();
    if (error || !post) return NextResponse.json({ error: "Unable to create post." }, { status: 502 });
    const ordered = mediaIds.map((mediaId, position) => ({ post_id: post.id, media_id: mediaId, position }));
    await supabase.from("post_media").insert(ordered);
    return NextResponse.json({ postId: post.id }, { status: 201 });
  }

  if (body?.action === "approve") {
    const postId = String(body.postId || "");
    const { data: post } = await supabase.from("scheduled_posts").select("id,title,caption")
      .eq("id", postId).eq("user_id", session.userId).single();
    const { data: media } = await supabase.from("post_media")
      .select("position,media_assets!inner(id,checksum)").eq("post_id", postId).order("position");
    if (!post || !media?.length) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    const snapshot = buildApprovalSnapshot({
      ...(body.approval as Omit<ApprovalInput, "creatorOpenId" | "media" | "title" | "caption">),
      creatorOpenId: session.openId, title: post.title, caption: post.caption,
      media: media.map((row) => {
        const asset = row.media_assets as unknown as { id: string; checksum: string };
        return { id: asset.id, checksum: asset.checksum, position: row.position };
      }),
    });
    const fingerprint = approvalFingerprint(snapshot);
    const { data: approval, error } = await supabase.from("post_approvals").upsert({
      post_id: postId, user_id: session.userId, fingerprint, snapshot,
    }, { onConflict: "post_id,fingerprint" }).select().single();
    if (error || !approval) return NextResponse.json({ error: "Unable to approve post." }, { status: 502 });
    await supabase.from("scheduled_posts").update({ approval_id: approval.id, status: "NEEDS_APPROVAL" })
      .eq("id", postId).eq("user_id", session.userId);
    return NextResponse.json({ postId, approvalId: approval.id, fingerprint });
  }

  return NextResponse.json({ error: "Unsupported post action." }, { status: 400 });
}

