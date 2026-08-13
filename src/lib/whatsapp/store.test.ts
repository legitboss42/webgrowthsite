import assert from "node:assert/strict";
import test from "node:test";
import { createMemoryWhatsAppStore } from "./store";

const inbound = {
  messageId: "wamid.test-1",
  waId: "2348000000000",
  displayName: "Test Lead",
  text: "Can I see your portfolio?",
  timestamp: 1_800_000_000,
};

test("does not duplicate a retried Meta message", async () => {
  const store = createMemoryWhatsAppStore();
  await store.recordInbound(inbound);
  await store.recordInbound(inbound);

  assert.equal(store.events.length, 1);
  assert.equal(store.contacts.length, 1);
  assert.equal(store.conversations.length, 1);
  assert.equal(store.messages.length, 1);
});

test("updates an existing outbound message delivery status", async () => {
  const store = createMemoryWhatsAppStore();
  await store.recordOutbound({
    messageId: "wamid.outbound-1",
    waId: inbound.waId,
    text: "Hello",
    timestamp: inbound.timestamp,
  });
  await store.updateMessageStatus("wamid.outbound-1", "delivered");
  assert.equal(store.messages[0]?.deliveryStatus, "delivered");
});
