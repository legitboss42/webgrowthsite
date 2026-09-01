import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getWhatsAppWorkspaceAccess,
  type WhatsAppWorkspaceAccess,
} from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import {
  canUseWhatsAppQuickReply,
  normalizeWhatsAppQuickReplyRow,
  type WhatsAppQuickReply,
} from "@/app/admin/whatsapp/quickRepliesModel";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import {
  deleteWhatsAppSavedReplyMedia,
  downloadWhatsAppSavedReplyMedia,
  uploadWhatsAppSavedReplyMedia,
} from "@/lib/whatsapp/savedReplyMedia";
import { validateWhatsAppMediaFile } from "@/lib/whatsapp/media";

export const runtime = "nodejs";

const TABLE = "whatsapp_quick_replies";
const SELECT = "id,shortcut,title,body,scope,category,owner_member_id,created_by_member_id,media_kind,media_path,media_filename,media_mime_type,media_size,created_at,updated_at";

function readId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function getReply(id: string) {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `${TABLE}?id=eq.${encodeURIComponent(id)}&select=${SELECT}&limit=1`,
  );
  if (rows === null) return { ready: false, reply: null as WhatsAppQuickReply | null };
  return { ready: true, reply: rows[0] ? normalizeWhatsAppQuickReplyRow(rows[0]) : null };
}

function canEditReply(access: WhatsAppWorkspaceAccess, reply: WhatsAppQuickReply) {
  if (reply.scope === "TEAM") return canWhatsAppRoleSuperviseTeam(access.role);
  return Boolean(access.memberId && reply.owner_member_id === access.memberId);
}

function safeDownloadName(value: string | undefined) {
  return (value || "attachment").replace(/[\r\n"\\]/g, "_");
}

export async function GET(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const id = readId(new URL(request.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "A saved reply is required." }, { status: 400 });

  const existing = await getReply(id);
  if (!existing.ready) return NextResponse.json({ error: "Saved-reply media is waiting for the Stage 4 media migration." }, { status: 503 });
  if (!existing.reply) return NextResponse.json({ error: "That saved reply no longer exists." }, { status: 404 });
  if (!canUseWhatsAppQuickReply(existing.reply, access.memberId)) {
    return NextResponse.json({ error: "You do not have access to that saved reply." }, { status: 403 });
  }
  if (!existing.reply.media_path || !existing.reply.media_mime_type) {
    return NextResponse.json({ error: "That saved reply has no attachment." }, { status: 404 });
  }

  const loaded = await downloadWhatsAppSavedReplyMedia(existing.reply.media_path);
  if (!loaded.ok) return NextResponse.json({ error: loaded.error }, { status: 502 });

  return new NextResponse(loaded.blob, {
    headers: {
      "Content-Type": existing.reply.media_mime_type,
      "Content-Disposition": `inline; filename="${safeDownloadName(existing.reply.media_filename)}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid attachment upload." }, { status: 400 });
  }

  const id = readId(formData.get("id"));
  const file = formData.get("file");
  if (!id || !(file instanceof File)) {
    return NextResponse.json({ error: "A saved reply and attachment are required." }, { status: 400 });
  }

  const existing = await getReply(id);
  if (!existing.ready) return NextResponse.json({ error: "Saved-reply media is waiting for the Stage 4 media migration." }, { status: 503 });
  if (!existing.reply) return NextResponse.json({ error: "That saved reply no longer exists." }, { status: 404 });
  if (!canEditReply(access, existing.reply)) {
    return NextResponse.json({ error: "You do not have permission to change that attachment." }, { status: 403 });
  }

  const validation = validateWhatsAppMediaFile({ mimeType: file.type, size: file.size, name: file.name });
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const uploaded = await uploadWhatsAppSavedReplyMedia({ replyId: id, file });
  if (!uploaded.ok) return NextResponse.json({ error: uploaded.error }, { status: 502 });

  const changed = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`,
    body: {
      media_kind: validation.kind,
      media_path: uploaded.path,
      media_filename: file.name || `saved-reply-${validation.kind}`,
      media_mime_type: file.type,
      media_size: file.size,
      updated_at: new Date().toISOString(),
    },
  });

  if (!changed.ok || changed.rows.length === 0) {
    await deleteWhatsAppSavedReplyMedia(uploaded.path);
    return NextResponse.json({ error: changed.ok ? "That saved reply no longer exists." : changed.message }, { status: changed.ok ? 404 : changed.status });
  }

  if (existing.reply.media_path && existing.reply.media_path !== uploaded.path) {
    await deleteWhatsAppSavedReplyMedia(existing.reply.media_path);
  }

  return NextResponse.json({ ok: true, quickReply: normalizeWhatsAppQuickReplyRow(changed.rows[0]) });
}

export async function DELETE(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // handled below
  }
  const id = readId(body?.id);
  if (!id) return NextResponse.json({ error: "A saved reply is required." }, { status: 400 });

  const existing = await getReply(id);
  if (!existing.ready) return NextResponse.json({ error: "Saved-reply media is waiting for the Stage 4 media migration." }, { status: 503 });
  if (!existing.reply) return NextResponse.json({ error: "That saved reply no longer exists." }, { status: 404 });
  if (!canEditReply(access, existing.reply)) {
    return NextResponse.json({ error: "You do not have permission to change that attachment." }, { status: 403 });
  }
  if (!existing.reply.media_path) return NextResponse.json({ ok: true });

  const pathToDelete = existing.reply.media_path;
  const changed = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`,
    body: {
      media_kind: null,
      media_path: null,
      media_filename: null,
      media_mime_type: null,
      media_size: null,
      updated_at: new Date().toISOString(),
    },
  });
  if (!changed.ok) return NextResponse.json({ error: changed.message }, { status: changed.status });

  const removed = await deleteWhatsAppSavedReplyMedia(pathToDelete);
  return NextResponse.json({ ok: true, storageCleaned: removed.ok });
}
