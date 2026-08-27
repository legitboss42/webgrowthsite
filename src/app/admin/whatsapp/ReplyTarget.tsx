"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import { buildWhatsAppReplyQuote, type WhatsAppQuotableMessage, type WhatsAppReplyQuote } from "./composerModel";

/**
 * Reply mode: which stored message the next send should quote.
 *
 * The thread is server-rendered and the composer is a client island, so the two need a
 * shared client boundary to agree on the target. This is that boundary — deliberately
 * separate from the outbound queue, which has nothing to do with quoting.
 *
 * The chosen id is a hint, not an authority: the reply route re-checks that the WhatsApp
 * message id belongs to this conversation before it reaches Meta's `context`.
 */
type WhatsAppReplyTargetApi = {
  target: WhatsAppReplyQuote | null;
  setReplyTarget(quote: WhatsAppReplyQuote): void;
  clearReplyTarget(): void;
};

const NOOP_TARGET: WhatsAppReplyTargetApi = {
  target: null,
  setReplyTarget: () => {},
  clearReplyTarget: () => {},
};

const ReplyTargetContext = createContext<WhatsAppReplyTargetApi>(NOOP_TARGET);

/** Falls back to "no target", so a composer outside the provider still sends normally. */
export function useWhatsAppReplyTarget() {
  return useContext(ReplyTargetContext);
}

export default function ReplyTargetProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<WhatsAppReplyQuote | null>(null);

  const setReplyTarget = useCallback((quote: WhatsAppReplyQuote) => {
    setTarget(quote);
    // Reply mode is only useful with the editor focused, and the operator's next action is
    // always typing. Guarded because the composer is absent once the window has closed.
    document.getElementById("whatsapp-composer-editor")?.focus();
  }, []);

  const clearReplyTarget = useCallback(() => setTarget(null), []);

  const value = useMemo(
    () => ({ target, setReplyTarget, clearReplyTarget }),
    [clearReplyTarget, setReplyTarget, target],
  );

  return <ReplyTargetContext.Provider value={value}>{children}</ReplyTargetContext.Provider>;
}

/**
 * The per-bubble Reply affordance. Renders nothing for a message that has no WhatsApp id,
 * because there would be nothing for Meta to quote.
 */
export function ReplyToButton({
  message,
  contactLabel,
  onDark = false,
}: {
  message: WhatsAppQuotableMessage;
  contactLabel: string;
  onDark?: boolean;
}) {
  const { setReplyTarget } = useWhatsAppReplyTarget();
  const quote = buildWhatsAppReplyQuote(message, contactLabel);
  if (!quote) return null;

  return (
    <button
      type="button"
      onClick={() => setReplyTarget(quote)}
      aria-label={`Reply to this message from ${quote.authorLabel}`}
      title="Reply"
      className={`grid h-7 w-7 flex-none place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 ${
        onDark
          ? "text-white/70 hover:bg-white/15 hover:text-white focus-visible:ring-white/50"
          : "text-ink-faint hover:bg-paper-sunk hover:text-ledger focus-visible:ring-ledger-bright/40"
      }`}
    >
      <WhatsAppIcon name="reply" className="h-[0.9rem] w-[0.9rem]" />
    </button>
  );
}
