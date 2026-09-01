import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  canWhatsAppAccessConversation,
  getWhatsAppWorkspaceAccess,
} from "@/app/admin/whatsapp/auth";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";
import {
  canUseWhatsAppQuickReply,
  normalizeWhatsAppQuickReplyRow,
} from "@/app/admin/whatsapp/quickRepliesModel";
import { recordWhatsAppConversationActivity } from "@/app/admin/whatsapp/teamActivity";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  sendInboxWhatsAppMediaReply,
  sendInboxWhatsAppReply,
} from "@/lib/whatsapp/inboxReply";
import {
  WHATSAPP_MEDIA_CAPTION_MAX,
  supportsWhatsAppMediaCaption,
  validateWhatsAppMediaFile,
} from "@/lib/whatsapp/media";
import { downloadWhatsAppSavedReplyMedia } from "@/lib/whatsapp/savedReplyMedia";
import {
  createSupabaseWhatsAppStore,
  getSupabaseWhatsAppReplyContext,
  resolveSupabaseWhatsAppQuotedMessageId,
} from "@/lib/whatsapp/store";

export const runtime = "nodejs";

const SELECT = "id,shortcut,title,body,scope,category,owner_member_id,media_kind,media_path,media_filename,media_mime_type,media_size";

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sendFailure(reason: string) {
  const errors: Record<string, { status: number; error: string }> = {
    NOT_CONFIGURED: { status: 503, error: "The WhatsApp sender is not configured on this deployment." },
    SERVICE_WINDOW_CLOSED: { status: 409, error: "The 24-hour customer service window is closed. An approved template is required." },
    INVALID_RECIPIENT: { status: 400, error: "This conversation has an invalid WhatsApp recipient." },
    UNSUPPORTED_MEDIA_TYPE: { status: 400, error: "WhatsApp cannot send this saved attachment type." },
    TOKEN_EXPIRED: { status: 503, error: "The WhatsApp sender credential needs to be refreshed." },
    PERMISSION_DENIED: { status: 503, error: "Meta rejected the sender permission for this WhatsApp account." },
    META_SERVICE_ERROR: { status: 502, error: "Meta's WhatsApp service is temporarily unavailable. Please try again shortly." },
    API_ERROR: { status: 502, error: "Meta could not accept this saved reply." },
  };
  return errors[reason] || { status: 502, error: "The saved reply could not be sent." };
}

export async function POST(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid saved reply request." }, { status: 400 });
  }

  const conversationId = readString(body.conversationId);
  const waId = readString(body.waId);
  const savedReplyId = readString(body.savedReplyId);
  const text = readString(body.text);
  const requestedReplyTo = readString(body.replyToMessageId);
  if (!conversationId || !waId || !savedReplyId) {
    return NextResponse.json({ error: "Invalid saved reply request." }, { status: 400 });
  }

  if (!(await canWhatsAppAccessConversation(access, conversationId))) {
    return NextResponse.json({ error: "This conversation is not assigned to you." }, { status: 403 });
  }

  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_quick_replies?id=eq.${encodeURIComponent(savedReplyId)}&select=${SELECT}&limit=1`,
  );
  if (rows === null) {
    return NextResponse.json({ error: "Saved-reply media is waiting for the Stage 4 media migration." }, { status: 503 });
  }
  const savedReply = rows[0] ? normalizeWhatsAppQuickReplyRow(rows[0]) : null;
  if (!savedReply) return NextResponse.json({ error: "That saved reply no longer exists." }, { status: 404 });
  if (!canUseWhatsAppQuickReply(savedReply, access.memberId)) {
    return NextResponse.json({ error: "You do not have access to that saved reply." }, { status: 403 });
  }
  if (!savedReply.media_kind || !savedReply.media_path || !savedReply.media_mime_type || !savedReply.media_filename) {
    return NextResponse.json({ error: "That saved reply has no attachment." }, { status: 409 });
  }
  if (supportsWhatsAppMediaCaption(savedReply.media_kind) && text.length > WHATSAPP_MEDIA_CAPTION_MAX) {
    return NextResponse.json({ error: `Saved-reply captions must be ${WHATSAPP_MEDIA_CAPTION_MAX} characters or fewer.` }, { status: 400 });
  }

  const loaded = await downloadWhatsAppSavedReplyMedia(savedReply.media_path);
  if (!loaded.ok) return NextResponse.json({ error: loaded.error }, { status: 502 });
  const validation = validateWhatsAppMediaFile({
    mimeType: savedReply.media_mime_type,
    size: loaded.blob.size,
    name: savedReply.media_filename,
  });
  if (!validation.ok || validation.kind !== savedReply.media_kind) {
    return NextResponse.json({ error: validation.ok ? "The stored attachment type no longer matches the saved reply." : validation.error }, { status: 409 });
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "WhatsApp storage is not configured." }, { status: 503 });
  }
  const storeOptions = { url: supabaseUrl, serviceRoleKey };
  const replyContext = await getSupabaseWhatsAppReplyContext(storeOptions, conversationId, waId);
  if (!replyContext) {
    return NextResponse.json({ error: "This is not an active conversation with a valid inbound customer message." }, { status: 409 });
  }
  const quotedMessageId = await resolveSupabaseWhatsAppQuotedMessageId(
    storeOptions,
    replyContext.conversationId,
    requestedReplyTo || undefined,
  );
  const store = createSupabaseWhatsAppStore(storeOptions);

  let textMessageId: string | undefined;
  if (savedReply.media_kind === "audio" && text) {
    const textResult = await sendInboxWhatsAppReply(
      {
        conversationId: replyContext.conversationId,
        waId: replyContext.waId,
        text,
        customerMessageTimestamp: replyContext.customerMessageTimestamp,
        replyToMessageId: quotedMessageId || replyContext.replyToMessageId,
      },
      { store },
    );
    if (!textResult.ok) {
      const failure = sendFailure(textResult.reason);
      return NextResponse.json({ error: failure.error }, { status: failure.status });
    }
    textMessageId = textResult.messageId;
    await recordWhatsAppConversationActivity({
      conversationId: replyContext.conversationId,
      actorMemberId: access.memberId,
      actorEmail: access.email,
      eventType: "conversation_reply_sent",
      metadata: { kind: "text", messageId: textMessageId, savedReplyId },
    });
  }

  const mediaResult = await sendInboxWhatsAppMediaReply(
    {
      conversationId: replyContext.conversationId,
      waId: replyContext.waId,
      kind: savedReply.media_kind,
      file: loaded.blob,
      filename: savedReply.media_filename,
      mimeType: savedReply.media_mime_type,
      caption: supportsWhatsAppMediaCaption(savedReply.media_kind) ? text : "",
      customerMessageTimestamp: replyContext.customerMessageTimestamp,
      replyToMessageId: textMessageId ? undefined : quotedMessageId || replyContext.replyToMessageId,
    },
    { store },
  );

  if (!mediaResult.ok) {
    const failure = sendFailure(mediaResult.reason);
    if (textMessageId) {
      return NextResponse.json(
        {
          error: `The text was sent, but the saved attachment failed: ${failure.error}`,
          partial: true,
          textMessageId,
        },
        { status: failure.status },
      );
    }
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }

  await recordWhatsAppConversationActivity({
    conversationId: replyContext.conversationId,
    actorMemberId: access.memberId,
    actorEmail: access.email,
    eventType: "conversation_reply_sent",
    metadata: {
      kind: savedReply.media_kind,
      messageId: mediaResult.messageId,
      mediaId: mediaResult.mediaId,
      savedReplyId,
    },
  });

  return NextResponse.json({
    ok: true,
    messageId: mediaResult.messageId,
    mediaId: mediaResult.mediaId,
    textMessageId,
    kind: savedReply.media_kind,
  });
}
