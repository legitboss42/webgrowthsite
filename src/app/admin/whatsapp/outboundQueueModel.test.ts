import assert from "node:assert/strict";
import test from "node:test";
import { pruneStoredWhatsAppOutbound, type WhatsAppPendingOutbound } from "./outboundQueueModel";

function pending(overrides: Partial<WhatsAppPendingOutbound> = {}): WhatsAppPendingOutbound {
  return { key: "pending-1", text: "Thanks, sending that over now.", state: "sending", ...overrides };
}

test("one outgoing reply is never shown twice: the optimistic bubble drops once its row is stored", () => {
  const queue = [pending({ key: "pending-1", state: "sent", messageId: "wamid.out-1" })];

  assert.deepEqual(pruneStoredWhatsAppOutbound(queue, ["wamid.out-1"]), []);
  // Still in flight against a thread that does not have it yet: keep showing it.
  assert.equal(pruneStoredWhatsAppOutbound(queue, ["wamid.other"]).length, 1);
});

test("a bubble with no WhatsApp id yet survives a refresh", () => {
  // Mid-flight when the poll happens to refresh. There is no id to match on, so the
  // only safe thing is to leave it alone — dropping it would make the reply vanish.
  const queue = [pending()];
  assert.equal(pruneStoredWhatsAppOutbound(queue, ["wamid.out-1", "wamid.out-2"]).length, 1);
});

test("pruning keeps the unrelated bubbles and their order", () => {
  const queue = [
    pending({ key: "pending-1", state: "sent", messageId: "wamid.out-1", text: "First" }),
    pending({ key: "pending-2", state: "unconfirmed", text: "Second", note: "Not confirmed." }),
    pending({ key: "pending-3", state: "sent", messageId: "wamid.out-3", text: "Third" }),
  ];

  assert.deepEqual(
    pruneStoredWhatsAppOutbound(queue, ["wamid.out-1"]).map((item) => item.text),
    ["Second", "Third"],
  );
});

test("an unconfirmed bubble is not treated as stored and is not silently removed", () => {
  const queue = [pending({ state: "unconfirmed", note: "The connection dropped before WhatsApp confirmed it." })];
  assert.equal(pruneStoredWhatsAppOutbound(queue, []).length, 1);
});
