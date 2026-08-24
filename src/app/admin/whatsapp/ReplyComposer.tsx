"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { WhatsAppReplyComposerState } from "./dashboard";

type ReplyComposerProps = {
  conversationId: string;
  waId: string;
  initialText?: string;
  composerState: WhatsAppReplyComposerState;
};

const reasonCopy: Partial<Record<NonNullable<WhatsAppReplyComposerState["reason"]>, string>> = {
  NOT_CONFIGURED: "Configure the official Meta sender credentials before using this inbox to reply.",
  NO_CUSTOMER_MESSAGE: "Wait for an inbound customer message before sending a manual reply here.",
  SERVICE_WINDOW_CLOSED: "The active customer service window has closed, so a template would be required instead.",
};

export default function ReplyComposer({ conversationId, waId, initialText = "", composerState }: ReplyComposerProps) {
  const router = useRouter();
  const [message, setMessage] = useState(initialText);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const helperText = useMemo(() => {
    if (feedback) return feedback;
    return (composerState.reason ? reasonCopy[composerState.reason] : undefined) || composerState.helperText;
  }, [composerState.helperText, composerState.reason, feedback]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!composerState.enabled) return;

    setFeedback(null);
    const text = message.trim();
    if (!text) {
      setFeedback("Write a reply before sending.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/whatsapp/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            waId,
            text,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) {
          if (payload.error === "NOT_CONFIGURED") {
            setFeedback("Sender credentials are still missing in production, so the inbox cannot send yet.");
            return;
          }
          if (payload.error === "SERVICE_WINDOW_CLOSED") {
            setFeedback("The 24-hour customer service window is closed for this conversation.");
            return;
          }
          setFeedback(payload.error || "Unable to send the reply right now. Please try again in a moment.");
          return;
        }

        setMessage("");
        setFeedback("Reply sent and stored in the WhatsApp CRM thread.");
        router.refresh();
      } catch {
        setFeedback("Unable to send the reply right now. Please try again in a moment.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-white/10 bg-black/15 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[.18em] text-white/70">Reply from inbox</h3>
          <p className="mt-2 text-sm text-white/60">{helperText}</p>
        </div>
        <button
          type="submit"
          disabled={!composerState.enabled || isPending}
          className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-black transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45"
        >
          {isPending ? "Sending..." : "Send reply"}
        </button>
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        disabled={!composerState.enabled || isPending}
        rows={5}
        className="mt-4 w-full rounded-2xl border border-white/10 bg-[#07110c] px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-60"
        placeholder="Type a careful reply. Avoid pricing, scope, timeline, or contract commitments unless you are intentionally handling them yourself."
      />
    </form>
  );
}
