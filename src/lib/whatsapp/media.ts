import { WHATSAPP_AUDIO_MIME_TYPES, isSupportedWhatsAppAudioMimeType } from "./audio";

/**
 * What the composer's `+` menu and paperclip are allowed to offer.
 *
 * Every entry here is a media kind the Cloud API actually accepts on
 * `POST /{phone-number-id}/media` followed by a `messages` send, so the menu can never
 * advertise something the backend would then refuse. The MIME lists and byte ceilings
 * mirror Meta's own documented limits — keep them in step if Meta widens them.
 *
 * Document is deliberately capped well below Meta's 100 MB: the upload travels through
 * a serverless route handler first, and a 100 MB body is far more likely to die in
 * transit than to reach Meta. 16 MB matches the audio and video ceiling, which keeps
 * one number in the operator's head instead of four.
 */
export type WhatsAppMediaKind = "image" | "video" | "document" | "audio";

export type WhatsAppMediaKindSpec = {
  kind: WhatsAppMediaKind;
  /** Sentence-case, used in menus and in operator-facing errors. */
  label: string;
  maxBytes: number;
  mimeTypes: readonly string[];
  /** Ready for a file input's `accept`, extensions included for stubborn mobile pickers. */
  accept: string;
};

export const WHATSAPP_MEDIA_KINDS: Record<WhatsAppMediaKind, WhatsAppMediaKindSpec> = {
  image: {
    kind: "image",
    label: "Image",
    maxBytes: 5 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png"],
    accept: "image/jpeg,image/png,.jpg,.jpeg,.png",
  },
  video: {
    kind: "video",
    label: "Video",
    maxBytes: 16 * 1024 * 1024,
    mimeTypes: ["video/mp4", "video/3gp", "video/3gpp"],
    accept: "video/mp4,video/3gpp,.mp4,.3gp",
  },
  document: {
    kind: "document",
    label: "Document",
    maxBytes: 16 * 1024 * 1024,
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    accept:
      "application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
  },
  audio: {
    kind: "audio",
    label: "Audio",
    maxBytes: 16 * 1024 * 1024,
    mimeTypes: WHATSAPP_AUDIO_MIME_TYPES,
    accept: "audio/ogg,audio/mpeg,audio/mp4,audio/aac,audio/amr,.ogg,.mp3,.m4a,.mp4,.aac,.amr",
  },
};

export const WHATSAPP_MEDIA_KIND_ORDER: readonly WhatsAppMediaKind[] = ["image", "video", "document", "audio"];

export function isWhatsAppMediaKind(value: unknown): value is WhatsAppMediaKind {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(WHATSAPP_MEDIA_KINDS, value);
}

/** Lowercases and drops any parameters, so `image/PNG; x=1` compares as `image/png`. */
function baseMimeType(value: string) {
  return value.split(";")[0]?.trim().toLowerCase() || "";
}

export function isSupportedWhatsAppMediaMimeType(kind: WhatsAppMediaKind, mimeType: string) {
  if (kind === "audio") return isSupportedWhatsAppAudioMimeType(mimeType);
  const normalized = baseMimeType(mimeType);
  return WHATSAPP_MEDIA_KINDS[kind].mimeTypes.some((candidate) => candidate === normalized);
}

/**
 * Which kind a picked file belongs to, or null when Meta would not take it at all.
 * Checked before the kind the operator clicked, so a document chosen from the image
 * item is still described accurately rather than as "not an image".
 */
export function resolveWhatsAppMediaKind(mimeType: string): WhatsAppMediaKind | null {
  for (const kind of WHATSAPP_MEDIA_KIND_ORDER) {
    if (isSupportedWhatsAppMediaMimeType(kind, mimeType)) return kind;
  }
  return null;
}

export function formatWhatsAppMediaSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    const megabytes = bytes / (1024 * 1024);
    return `${megabytes >= 10 ? Math.round(megabytes) : Math.round(megabytes * 10) / 10} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export type WhatsAppMediaValidation =
  | { ok: true; kind: WhatsAppMediaKind }
  | { ok: false; error: string };

/**
 * The one validation both the composer and the send route run, so the operator sees the
 * same sentence whichever side rejects the file.
 */
export function validateWhatsAppMediaFile(input: {
  mimeType: string;
  size: number;
  name?: string;
}): WhatsAppMediaValidation {
  const kind = resolveWhatsAppMediaKind(input.mimeType);
  if (!kind) {
    return {
      ok: false,
      error: `WhatsApp cannot send this file type (${baseMimeType(input.mimeType) || "unknown"}). Use a JPEG or PNG image, an MP4 video, a PDF or Office document, or OGG/MP3/M4A/AAC/AMR audio.`,
    };
  }

  const spec = WHATSAPP_MEDIA_KINDS[kind];
  if (input.size <= 0) {
    return { ok: false, error: "That file is empty, so there is nothing to send." };
  }
  if (input.size > spec.maxBytes) {
    return {
      ok: false,
      error: `${spec.label} files must be ${formatWhatsAppMediaSize(spec.maxBytes)} or smaller. This one is ${formatWhatsAppMediaSize(input.size)}.`,
    };
  }

  return { ok: true, kind };
}

/** Every accepted type at once, for the paperclip's single "any supported file" input. */
export function getWhatsAppMediaAccept() {
  return WHATSAPP_MEDIA_KIND_ORDER.map((kind) => WHATSAPP_MEDIA_KINDS[kind].accept).join(",");
}

/** Caption support is a Meta rule, not a preference: audio messages carry no caption. */
export function supportsWhatsAppMediaCaption(kind: WhatsAppMediaKind) {
  return kind === "image" || kind === "video" || kind === "document";
}

export const WHATSAPP_MEDIA_CAPTION_MAX = 1024;
