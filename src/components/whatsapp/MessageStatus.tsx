"use client";

import { describeWhatsAppMessageStatus } from "@/lib/whatsapp/messageStatus";
import { useMessageStatusVisibility } from "@/components/whatsapp/MessageStatusVisibility";
import { WhatsAppIcon } from "./icons";

/**
 * The delivery receipt on an outbound message bubble.
 *
 * Meta's webhook status remains the source of truth. Console visibility settings
 * can hide normal delivery/read indicators, but a failed message is always visible
 * so an operator can never mistake an undelivered message for a successful one.
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
  const visibility = useMessageStatusVisibility();
  let presentation = describeWhatsAppMessageStatus({ status, direction });
  if (!presentation) return null;

  // Failure is operationally important and is never hidden by a cosmetic setting.
  if (presentation.key !== "failed") {
    if (presentation.key === "read") {
      if (!visibility.readStatusVisible) {
        if (!visibility.deliveryStatusVisible) return null;
        presentation = describeWhatsAppMessageStatus({ status: "delivered", direction });
        if (!presentation) return null;
      }
    } else if (!visibility.deliveryStatusVisible) {
      return null;
    }
  }

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

  const title = `${presentation.description}${error ? `. ${error}` : ""}`;

  return (
    <span className={`inline-flex max-w-[min(20rem,72vw)] flex-col items-end ${tone}`} title={title}>
      <span className="inline-flex items-center gap-1">
        <WhatsAppIcon name={presentation.icon} className="h-3.5 w-3.5" />
        {failed || presentation.key === "pending" ? (
          <span className="font-medium">{presentation.label}</span>
        ) : null}
      </span>
      {failed && error ? (
        <span className="mt-0.5 text-right text-[0.62rem] leading-4 opacity-95">
          {error}
        </span>
      ) : null}
      <span className="sr-only">{title}</span>
    </span>
  );
}
