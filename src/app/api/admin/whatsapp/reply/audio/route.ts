import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { isSupportedWhatsAppRecordingMimeType } from "@/lib/whatsapp/audio";
import { sendInboxWhatsAppAudioReply } from "@/lib/whatsapp/inboxReply";
import { createSupabaseWhatsAppStore, getSupabaseWhatsAppReplyContext } from "@/lib/whatsapp/store";
import { normalizeRecordedVoiceNote } from "@/lib/whatsapp/voiceTranscode";

export const runtime = "nodejs";

const maxAudioBytes = 16 * 1024 * 1024;

function getStringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid audio upload." }, { status: 400 });
  }

  const conversationId = getStringField(formData, "conversationId");
  const waId = getStringField(formData, "waId");
  const audio = formData.get("audio");
  if (!conversationId || !waId || !(audio instanceof File)) {
    return NextResponse.json({ error: "Invalid audio upload." }, { status: 400 });
  }

  const browserMimeType = audio.type || "";
  if (!isSupportedWhatsAppRecordingMimeType(browserMimeType)) {
    return NextResponse.json(
      { error: `This browser produced an unsupported recording format (${browserMimeType || "unknown"}).` },
      { status: 400 },
    );
  }

  if (audio.size <= 0 || audio.size > maxAudioBytes) {
    return NextResponse.json({ error: "Audio must be larger than 0 bytes and no more than 16 MB." }, { status: 400 });
  }

  let voiceNote: Awaited<ReturnType<typeof normalizeRecordedVoiceNote>>;
  try {
    voiceNote = await normalizeRecordedVoiceNote(audio);
  } catch (error) {
    console.error("WhatsApp voice-note conversion failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { error: "The recording could not be converted into a WhatsApp voice note. Please record it again." },
      { status: 422 },
    );
  }

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

  const result = await sendInboxWhatsAppAudioReply(
    {
      conversationId: replyContext.conversationId,
      waId: replyContext.waId,
      audio: voiceNote.file,
      filename: voiceNote.filename,
      mimeType: voiceNote.mimeType,
      customerMessageTimestamp: replyContext.customerMessageTimestamp,
      replyToMessageId: replyContext.replyToMessageId,
    },
    { store: createSupabaseWhatsAppStore(storeOptions) },
  );

  if (!result.ok) {
    const errors: Record<typeof result.reason, { status: number; error: string }> = {
      NOT_CONFIGURED: { status: 503, error: "The WhatsApp sender is not configured on this deployment." },
      SERVICE_WINDOW_CLOSED: { status: 409, error: "The 24-hour customer service window is closed. An approved template is required." },
      INVALID_RECIPIENT: { status: 400, error: "This conversation has an invalid WhatsApp recipient." },
      UNSUPPORTED_MEDIA_TYPE: { status: 400, error: "WhatsApp rejected the converted OGG/Opus voice-note format." },
      TOKEN_EXPIRED: { status: 503, error: "The WhatsApp sender credential needs to be refreshed." },
      PERMISSION_DENIED: { status: 503, error: "Meta rejected the sender permission for this WhatsApp account." },
      META_SERVICE_ERROR: { status: 502, error: "Meta's WhatsApp service is temporarily unavailable. Please try again shortly." },
      API_ERROR: { status: 502, error: "Meta could not accept this WhatsApp voice note." },
    };
    const failure = errors[result.reason];
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }

  return NextResponse.json({ ok: true, messageId: result.messageId, mediaId: result.mediaId });
}
