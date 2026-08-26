/**
 * The optimistic half of an outbound reply, as data.
 *
 * A reply appears in the thread the moment the agent presses send, before the round
 * trip finishes, and is then reconciled against the stored row. The reconciliation
 * key is the WhatsApp message id the send route returns, which is the same id the
 * database row is keyed on — so one outgoing reply can only ever produce one bubble,
 * whichever arrives first.
 *
 * Deliberately three states and no more:
 *  - `sending`      the request is in flight
 *  - `sent`         the Cloud API accepted it and gave us an id; waiting for the row
 *  - `unconfirmed`  the request itself failed in a way that cannot tell us whether
 *                   Meta received it (a dropped connection). It is not called failed,
 *                   because we do not know that, and a real `failed` only ever comes
 *                   from Meta's status webhook.
 *
 * A reply the server explicitly rejected is dropped from here entirely: nothing was
 * stored, so nothing should linger in the thread. The composer keeps that draft and
 * shows the reason instead.
 *
 * This is a plain module rather than part of `OutboundQueue.tsx` so the dedup rule can
 * be tested without loading the component tree, matching the other `*Model` modules
 * in this console.
 */
export type WhatsAppPendingOutboundState = "sending" | "sent" | "unconfirmed";

export type WhatsAppPendingOutbound = {
  key: string;
  text: string;
  state: WhatsAppPendingOutboundState;
  /** Meta's message id, once the send route has handed it back. */
  messageId?: string;
  /** Operator-safe sentence for the `unconfirmed` state. Never a provider payload. */
  note?: string;
};

/**
 * Drops every optimistic bubble whose message id is now present in the thread the
 * server rendered.
 */
export function pruneStoredWhatsAppOutbound(
  pending: WhatsAppPendingOutbound[],
  storedMessageIds: Iterable<string>,
): WhatsAppPendingOutbound[] {
  const stored = new Set(storedMessageIds);
  return pending.filter((item) => !(item.messageId && stored.has(item.messageId)));
}
