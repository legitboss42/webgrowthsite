import { WhatsAppIcon, type WhatsAppIconName } from "@/components/whatsapp/icons";
import type { WhatsAppLeadMessage } from "./dashboard";

/**
 * The media half of a message bubble.
 *
 * Every source here is `/api/admin/whatsapp/media/<id>`, the authenticated proxy — Meta's
 * own media URLs need the access token, so they can never appear in a page. Returns null
 * for anything without stored media, which is how the bubble falls back to plain text.
 */
const RENDERABLE_MEDIA_TYPES = new Set(["audio", "image", "video", "document"]);

/**
 * Whether this message has media the thread can actually render.
 *
 * The bubble asks first, so a stored type nobody has built a player for (a sticker, a
 * location) still shows its text line instead of an empty bubble.
 */
export function hasRenderableWhatsAppMedia(message: WhatsAppLeadMessage) {
  return Boolean(message.media_id) && RENDERABLE_MEDIA_TYPES.has(String(message.message_type));
}

function getDocumentIcon(mimeType: string | undefined): WhatsAppIconName {
  // A spreadsheet reads better as a chart than as a page. Everything else is a page.
  return mimeType && /spreadsheet|excel|csv/i.test(mimeType) ? "analytics" : "document";
}

export default function MessageMedia({
  message,
  outbound,
}: {
  message: WhatsAppLeadMessage;
  outbound: boolean;
}) {
  if (!message.media_id) return null;

  const source = `/api/admin/whatsapp/media/${encodeURIComponent(message.media_id)}`;
  const eyebrow = `mb-2 text-[0.65rem] font-medium uppercase tracking-[.12em] ${
    outbound ? "text-white/80" : "text-ink-faint"
  }`;
  const caption = `mt-1.5 text-[0.65rem] ${outbound ? "text-white/65" : "text-ink-faint"}`;
  const details = [message.media_filename, message.media_mime_type].filter(Boolean).join(" · ");

  if (message.message_type === "audio") {
    return (
      <div>
        <p className={eyebrow}>{message.media_voice ? "Voice note" : "Audio message"}</p>
        <audio controls preload="none" src={source} className="w-full max-w-[18rem]">
          Your browser cannot play this WhatsApp audio message.
        </audio>
        {details ? <p className={caption}>{details}</p> : null}
      </div>
    );
  }

  if (message.message_type === "image") {
    return (
      <div>
        {/* Deliberately not next/image: the optimiser fetches the source server-side without
            the admin session cookie, so this proxied route would 401 during optimisation. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={source}
          alt={message.message_text || message.media_filename || "WhatsApp image message"}
          className="max-h-72 w-full max-w-[18rem] rounded-lg border border-black/5 object-cover"
        />
        <a
          href={source}
          target="_blank"
          rel="noreferrer"
          className={`mt-1.5 inline-block text-[0.65rem] underline underline-offset-2 ${
            outbound ? "text-white/75" : "text-ink-faint"
          }`}
        >
          Open full size
        </a>
      </div>
    );
  }

  if (message.message_type === "video") {
    return (
      <div>
        <video controls preload="metadata" src={source} className="max-h-72 w-full max-w-[18rem] rounded-lg">
          Your browser cannot play this WhatsApp video message.
        </video>
        {details ? <p className={caption}>{details}</p> : null}
      </div>
    );
  }

  if (message.message_type === "document") {
    return (
      <a
        href={source}
        target="_blank"
        rel="noreferrer"
        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition ${
          outbound ? "bg-white/12 hover:bg-white/20" : "bg-paper-sunk hover:bg-rule/60"
        }`}
      >
        <span
          className={`grid h-9 w-9 flex-none place-items-center rounded-lg ${
            outbound ? "bg-white/20 text-white" : "bg-ledger-tint text-ledger"
          }`}
        >
          <WhatsAppIcon name={getDocumentIcon(message.media_mime_type)} className="h-[1.1rem] w-[1.1rem]" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {message.media_filename || "Document"}
          </span>
          <span className={`block truncate text-[0.65rem] ${outbound ? "text-white/70" : "text-ink-faint"}`}>
            {message.media_mime_type || "Document"} · open
          </span>
        </span>
      </a>
    );
  }

  return null;
}
