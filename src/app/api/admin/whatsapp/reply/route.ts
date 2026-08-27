import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { sendInboxWhatsAppReply } from "@/lib/whatsapp/inboxReply";
import {
  createSupabaseWhatsAppStore,
  getSupabaseWhatsAppReplyContext,
  resolveSupabaseWhatsAppQuotedMessageId,
} from "@/lib/whatsapp/store";

export const runtime = "nodejs";

type ReplyBody = {
  conversationId?: unknown;
  waId?: unknown;
  text?: unknown;
  replyToMessageId?: unknown;
};

type ValidReplyBody = {
  conversationId: string;
  waId: string;
  text: string;
  /** The message the operator chose to quote. Verified against the thread before use. */
  replyToMessageId?: string;
};

function parseReplyBody(body: ReplyBody): ValidReplyBody | null {
  if (
    typeof body.conversationId === "string" &&
    typeof body.waId === "string" &&
    typeof body.text === "string"
  ) {
    return {
      conversationId: body.conversationId,
      waId: body.waId,
      text: body.text,
      replyToMessageId:
        typeof body.replyToMessageId === "string" && body.replyToMessageId.trim()
          ? body.replyToMessageId.trim()
          : undefined,
    };
  }

  return null;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: ReplyBody;
  try {
    body = (await request.json()) as ReplyBody;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const validBody = parseReplyBody(body);
  if (!validBody || !validBody.text.trim()) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "WhatsApp storage is not configured." }, { status: 503 });
  }

  const storeOptions = { url: supabaseUrl, serviceRoleKey };
  const replyContext = await getSupabaseWhatsAppReplyContext(storeOptions, validBody.conversationId, validBody.waId);
  if (!replyContext) {
    return NextResponse.json(
      { error: "This is not an active conversation with a valid inbound customer message." },
      { status: 409 },
    );
  }

  // Reply mode is a hint from a browser, so the quoted id is only honoured once it is found
  // in this conversation. Otherwise we quote what we always quoted: their latest message.
  const quotedMessageId = await resolveSupabaseWhatsAppQuotedMessageId(
    storeOptions,
    replyContext.conversationId,
    validBody.replyToMessageId,
  );

  const result = await sendInboxWhatsAppReply(
    {
      conversationId: replyContext.conversationId,
      waId: replyContext.waId,
      text: validBody.text,
      customerMessageTimestamp: replyContext.customerMessageTimestamp,
      replyToMessageId: quotedMessageId || replyContext.replyToMessageId,
    },
    {
      store: createSupabaseWhatsAppStore(storeOptions),
    },
  );

  if (!result.ok) {
    const errors: Record<typeof result.reason, { status: number; error: string }> = {
      NOT_CONFIGURED: { status: 503, error: "The WhatsApp sender is not configured on this deployment." },
      SERVICE_WINDOW_CLOSED: { status: 409, error: "The 24-hour customer service window is closed. An approved template is required." },
      INVALID_RECIPIENT: { status: 400, error: "This conversation has an invalid WhatsApp recipient." },
      UNSUPPORTED_MEDIA_TYPE: { status: 400, error: "Unsupported WhatsApp media type." },
      TOKEN_EXPIRED: { status: 503, error: "The WhatsApp sender credential needs to be refreshed." },
      PERMISSION_DENIED: { status: 503, error: "Meta rejected the sender permission for this WhatsApp account." },
      META_SERVICE_ERROR: { status: 502, error: "Meta's WhatsApp service is temporarily unavailable. Please try again shortly." },
      API_ERROR: { status: 502, error: "Meta could not accept this WhatsApp reply." },
    };
    const failure = errors[result.reason];
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
