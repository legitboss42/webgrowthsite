import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { getSupabaseWhatsAppReplyContext } from "@/lib/whatsapp/store";
import { sendWhatsAppTypingIndicator } from "@/lib/whatsapp/typing";

export const runtime = "nodejs";

/**
 * Shows the WhatsApp typing indicator to the customer in a conversation.
 *
 * The browser sends a conversation id and a wa_id and nothing else. The WhatsApp
 * message id the Cloud API needs is looked up here, from the same reply context the
 * send path uses, so the client never gets to nominate which message a read receipt
 * is attached to — and the access token stays on the server.
 *
 * The composer treats every response as advisory. Nothing this route returns is
 * allowed to stop an operator from sending their message.
 */

type TypingBody = {
  conversationId?: unknown;
  waId?: unknown;
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
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

  // No open conversation, or no inbound message to attach the receipt to. Expected
  // rather than exceptional: outside a service window there is nobody to show an
  // indicator to.
  if (!replyContext?.replyToMessageId) {
    return NextResponse.json({ ok: false, reason: "NO_INBOUND_MESSAGE" }, { status: 409 });
  }

  const result = await sendWhatsAppTypingIndicator({ messageId: replyContext.replyToMessageId });

  if (!result.sent) {
    const statuses: Record<typeof result.reason, number> = {
      NOT_CONFIGURED: 503,
      INVALID_MESSAGE_ID: 409,
      TOKEN_EXPIRED: 503,
      PERMISSION_DENIED: 503,
      META_SERVICE_ERROR: 502,
      API_ERROR: 502,
    };
    // The reason code only, never Meta's response body.
    return NextResponse.json({ ok: false, reason: result.reason }, { status: statuses[result.reason] });
  }

  return NextResponse.json({ ok: true });
}
