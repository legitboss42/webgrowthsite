import assert from "node:assert/strict";
import test from "node:test";
import { extractWhatsAppCallEvents } from "./callHistory";

test("message delivery statuses are never treated as calls", () => {
  const events = extractWhatsAppCallEvents({
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [
                {
                  id: "wamid.message-1",
                  recipient_id: "2348067089087",
                  status: "delivered",
                  timestamp: "1788200000",
                },
                {
                  id: "wamid.message-2",
                  recipient_id: "2348067089087",
                  status: "failed",
                  timestamp: "1788200010",
                },
              ],
            },
          },
        ],
      },
    ],
  });

  assert.deepEqual(events, []);
});

test("only entries in Meta's calls array become call history events", () => {
  const events = extractWhatsAppCallEvents({
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [{ wa_id: "2348067089087", profile: { name: "Victorious" } }],
              calls: [
                {
                  id: "call-123",
                  from: "2348067089087",
                  to: "2348066706336",
                  direction: "USER_INITIATED",
                  event: "connect",
                  timestamp: "1788200020",
                },
              ],
              statuses: [
                {
                  id: "wamid.voice-note",
                  recipient_id: "2348067089087",
                  status: "delivered",
                  timestamp: "1788200021",
                },
              ],
            },
          },
        ],
      },
    ],
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.call_id, "call-123");
  assert.equal(events[0]?.direction, "inbound");
  assert.equal(events[0]?.status, "ringing");
  assert.equal(events[0]?.customer_wa_id, "2348067089087");
  assert.equal(events[0]?.customer_name, "Victorious");
});
