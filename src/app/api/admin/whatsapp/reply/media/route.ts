import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  canWhatsAppAccessConversation,
  getWhatsAppWorkspaceAccess,
} from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { sendInboxWhatsAppMediaReply } from "@/lib/whatsapp/inboxReply";
import {
  WHATSAPP_MEDIA_CAPTION_MAX,
  isWhatsAppMediaKind,
  supportsWhatsAppMediaCaption,
  validateWhatsAppMediaFile,
} from "@/lib/whatsapp/media";
import {
  createSupabaseWhatsAppStore,
  getSupabaseWhatsAppReplyContext,
  resolveSupabaseWhatsAppQuotedMessageId,
} from "@/lib/whatsapp/store";

export const runtime = "nodejs";

function getStringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid attachment upload." }, { status: 400 });
  }

  const conversationId = getStringField(formData, "conversationId");
  const waId = getStringField(formData, "waId");
  const requestedKind = getStringField(formData, "kind");
  const file = formData.get("file");
  if (!conversationId || !waId || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid attachment upload." }, { status: 400 });
  }

  if (!(await canWhatsAppAccessConversation(access, conversationId))) {
    return NextResponse.json({ error: "This conversation is not assigned to you." }, { status: 403 });
  }

  const validation = validateWhatsAppMediaFile({ mimeType: file.type, size: file.size, name: file.name });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const kind = isWhatsAppMediaKind(requestedKind) && requestedKind === validation.kind ? requestedKind : validation.kind;
  const caption = supportsWhatsAppMediaCaption(kind)
    ? getStringField(formData, "caption").slice(0, WHATSAPP_MEDIA_CAPTION_MAX)
    : "";

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "WhatsApp storage is not configured." }, { status: 503 });
  }

  const storeOptions = { url: supabaseUrl, serviceRoleKey };
  const replyContext = await getSupabaseWhatsAppReplyContext(storeOptions, conversationId, waId);
  if (!replyContext) {
    return NextResponse.json(
      { error: "This is not an active conversation with a valid inbound customer message." },
      { status: 409 },
    );
  }

  const quotedMessageId = await resolveSupabaseWhatsAppQuotedMessageId(
    storeOptions,
    replyContext.conversationId,
    getStringField(formData, "replyToMessageId") || undefined,
  );

  const result = await sendInboxWhatsAppMediaReply(
    {
      conversationId: replyContext.conversationId,
      waId: replyContext.waId,
      kind,
      file,
      filename: file.name || `webgrowth-${kind}`,
      mimeType: file.type,
      caption,
      customerMessageTimestamp: replyContext.customerMessageTimestamp,
      replyToMessageId: quotedMessageId || replyContext.replyToMessageId,
    },
    { store: createSupabaseWhatsAppStore(storeOptions) },
  );

  if (!result.ok) {
    const errors: Record<typeof result.reason, { status: number; error: string }> = {
      NOT_CONFIGURED: { status: 503, error: "The WhatsApp sender is not configured on this deployment." },
      SERVICE_WINDOW_CLOSED: { status: 409, error: "The 24-hour customer service window is closed. An approved template is required." },
      INVALID_RECIPIENT: { status: 400, error: "This conversation has an invalid WhatsApp recipient." },
      UNSUPPORTED_MEDIA_TYPE: { status: 400, error: "WhatsApp cannot send this file type." },
      TOKEN_EXPIRED: { status: 503, error: "The WhatsApp sender credential needs to be refreshed." },
      PERMISSION_DENIED: { status: 503, error: "Meta rejected the sender permission for this WhatsApp account." },
      META_SERVICE_ERROR: { status: 502, error: "Meta's WhatsApp service is temporarily unavailable. Please try again shortly." },
      API_ERROR: { status: 502, error: "Meta could not accept this attachment." },
    };
    const failure = errors[result.reason];
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }

  return NextResponse.json({ ok: true, messageId: result.messageId, mediaId: result.mediaId, kind });
}
