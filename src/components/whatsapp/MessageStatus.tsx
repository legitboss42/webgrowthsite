import { describeWhatsAppMessageStatus } from "@/lib/whatsapp/messageStatus";
import { WhatsAppIcon } from "./icons";

/**
 * The delivery receipt on an outbound message bubble.
 *
 * Each state has its own silhouette, a title for a pointer and a visually hidden
 * sentence for a screen reader, so the state never depends on colour alone. Failed
 * and still-sending also carry a visible word, because "not delivered" is the one
 * thing an operator must not have to squint at.
 *
 * Nothing here invents a state: what is rendered is whatever Meta's webhooks last
 * reported, and an unconfirmed message reads as sending rather than as sent.
 */

export default function MessageStatus({
  status,
  direction,
  error,
  /** True inside a dark outbound bubble, where the muted ink tones disappear. */
  onDark = false,
}: {
  status?: string | null;
  direction?: string | null;
  error?: string | null;
  onDark?: boolean;
}) {
  const presentation = describeWhatsAppMessageStatus({ status, direction });
  if (!presentation) return null;

  const failed = presentation.key === "failed";
  const tone = failed
    ? onDark
      ? "text-rose-200"
      : "text-rose-700"
    : presentation.key === "read"
      ? onDark
        ? "text-white"
        : "text-ledger-bright"
      : onDark
        ? "text-white/70"
        : "text-ink-faint";

  return (
    <span
      className={`inline-flex items-center gap-1 ${tone}`}
      title={`${presentation.description}${error ? `. ${error}` : ""}`}
    >
      <WhatsAppIcon name={presentation.icon} className="h-3.5 w-3.5" />
      {failed || presentation.key === "pending" ? (
        <span className="font-medium">{presentation.label}</span>
      ) : null}
      <span className="sr-only">
        {presentation.description}
        {error ? `. ${error}` : ""}
      </span>
    </span>
  );
}
