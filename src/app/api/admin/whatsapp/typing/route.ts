import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  canWhatsAppAccessConversation,
  getWhatsAppWorkspaceAccess,
} from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { loadWhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";
import { getSupabaseWhatsAppReplyContext } from "@/lib/whatsapp/store";
import { sendWhatsAppTypingIndicator } from "@/lib/whatsapp/typingServer";

export const runtime = "nodejs";

type TypingBody = {
  conversationId?: unknown;
  waId?: unknown;
};

export async function POST(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const quickSettings = await loadWhatsAppQuickSettings();
  if (!quickSettings.typingIndicatorEnabled) {
    return NextResponse.json({ ok: true, disabled: true });
  }

  let body: TypingBody;
  try {
    body = (await request.json()) as TypingBody;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  if (typeof body.conversationId !== "string" || typeof body.waId !== "string") {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
  if (!(await canWhatsAppAccessConversation(access, body.conversationId))) {
    return NextResponse.json({ error: "This conversation is not assigned to you." }, { status: 403 });
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "WhatsApp storage is not configured." }, { status: 503 });
  }

  const replyContext = await getSupabaseWhatsAppReplyContext(
    { url: supabaseUrl, serviceRoleKey },
    body.conversationId,
    body.waId,
  );

  if (!replyContext?.replyToMessageId) {
    return NextResponse.json({ ok: false, reason: "NO_INBOUND_MESSAGE" }, { status: 409 });
  }

  const result = await sendWhatsAppTypingIndicator(
    { messageId: replyContext.replyToMessageId },
    { workspaceId: access.workspaceId },
  );

  if (!result.sent) {
    const statuses: Record<typeof result.reason, number> = {
      NOT_CONFIGURED: 503,
      INVALID_MESSAGE_ID: 409,
      TOKEN_EXPIRED: 503,
      PERMISSION_DENIED: 503,
      META_SERVICE_ERROR: 502,
      API_ERROR: 502,
    };
    return NextResponse.json({ ok: false, reason: result.reason }, { status: statuses[result.reason] });
  }

  return NextResponse.json({ ok: true });
}
