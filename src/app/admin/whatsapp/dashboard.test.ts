import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createInternalUtilityCookieValue, getInternalUtilityCookieName } from "@/lib/internalUtilityAuth";
import { createSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { hasWhatsAppAdminAccess } from "./auth";
import { buildWhatsAppDashboardModel, buildWhatsAppReplyComposerState, filterWhatsAppLeads } from "./dashboard";

const leads = [
  { id: "hot", wa_id: "1", display_name: "Hot Lead", lead_temperature: "HOT" as const, intent: "PRICING_REQUEST", human_review_required: true, status: "open", last_message_at: "2026-08-23T22:55:00.000Z" },
  { id: "warm", wa_id: "2", display_name: "Warm Lead", lead_temperature: "WARM" as const, human_review_required: false, status: "open", last_message_at: "2026-08-23T22:45:00.000Z" },
  { id: "cold", wa_id: "3", display_name: "Cold Lead", lead_temperature: "COLD" as const, human_review_required: false, status: "closed", last_message_at: "2026-08-23T22:35:00.000Z" },
];
const messages = [
  { id: "m1", whatsapp_message_id: "wamid.inbound-hot", conversation_id: "hot", direction: "inbound" as const, message_text: "Can you send pricing?", message_timestamp: "2026-08-23T22:54:00.000Z" },
  { id: "m2", conversation_id: "hot", direction: "outbound" as const, message_text: "Thanks, I’ve got the details. I’m reviewing the scope so I can give you an accurate answer rather than guessing.", message_timestamp: "2026-08-23T22:55:00.000Z" },
  { id: "m3", whatsapp_message_id: "wamid.inbound-warm", conversation_id: "warm", direction: "inbound" as const, message_text: "Can I see your portfolio?", message_timestamp: "2026-08-23T22:45:00.000Z" },
];
const pagePath = new URL("./page.tsx", import.meta.url);

test("returns only hot WhatsApp leads for the HOT filter", () => {
  assert.deepEqual(filterWhatsAppLeads(leads, "HOT").map((lead) => lead.id), ["hot"]);
});

test("builds filter counts and keeps the selected conversation in view", () => {
  const model = buildWhatsAppDashboardModel({
    leads,
    messages,
    filter: "ALL",
    selectedLeadId: "warm",
  });

  assert.deepEqual(model.filterCounts, {
    ALL: 3,
    HOT: 1,
    WARM: 1,
    REVIEW: 1,
    PRICING: 1,
    MEETING: 0,
    PROPOSAL: 0,
  });
  assert.equal(model.selectedLead?.id, "warm");
  assert.deepEqual(model.selectedMessages.map((message) => message.id), ["m3"]);
});

test("falls back to the first filtered lead when the requested selection is missing", () => {
  const model = buildWhatsAppDashboardModel({
    leads,
    messages,
    filter: "HOT",
    selectedLeadId: "warm",
  });

  assert.equal(model.selectedLead?.id, "hot");
  assert.deepEqual(model.selectedMessages.map((message) => message.id), ["m1", "m2"]);
});

test("enables the reply composer when sender credentials exist and the customer service window is open", () => {
  const state = buildWhatsAppReplyComposerState({
    selectedLead: leads[0],
    selectedMessages: messages.filter((message) => message.conversation_id === "hot"),
    senderConfigured: true,
    now: Date.parse("2026-08-23T23:10:00.000Z") / 1000,
  });

  assert.equal(state.enabled, true);
  assert.equal(state.reason, undefined);
  assert.equal(state.customerMessageTimestamp, Date.parse("2026-08-23T22:54:00.000Z") / 1000);
  assert.equal(state.replyToMessageId, "wamid.inbound-hot");
});

test("disables the reply composer when sender credentials are missing", () => {
  const state = buildWhatsAppReplyComposerState({
    selectedLead: leads[1],
    selectedMessages: messages.filter((message) => message.conversation_id === "warm"),
    senderConfigured: false,
    now: Date.parse("2026-08-23T23:10:00.000Z") / 1000,
  });

  assert.equal(state.enabled, false);
  assert.equal(state.reason, "NOT_CONFIGURED");
});

test("disables the reply composer when the customer service window has expired", () => {
  const state = buildWhatsAppReplyComposerState({
    selectedLead: leads[1],
    selectedMessages: messages.filter((message) => message.conversation_id === "warm"),
    senderConfigured: true,
    now: Date.parse("2026-08-25T00:00:01.000Z") / 1000,
  });

  assert.equal(state.enabled, false);
  assert.equal(state.reason, "SERVICE_WINDOW_CLOSED");
});

test("WhatsApp admin page allows the existing owner scheduler session as an internal access path", () => {
  const source = readFileSync(pagePath, "utf8");

  assert.match(source, /hasWhatsAppAdminAccess/);
  assert.match(source, /ReplyComposer/);
});

test("WhatsApp admin access accepts the internal utility cookie", () => {
  const originalSessionSecret = process.env.INTERNAL_TOOL_SESSION_SECRET;

  process.env.INTERNAL_TOOL_SESSION_SECRET = "internal-utility-secret";
  const cookieValue = createInternalUtilityCookieValue();

  assert.equal(
    hasWhatsAppAdminAccess({
      get(name) {
        return name === getInternalUtilityCookieName() ? { value: cookieValue } : undefined;
      },
    }),
    true,
  );

  process.env.INTERNAL_TOOL_SESSION_SECRET = originalSessionSecret;
});

test("WhatsApp admin access accepts an owner scheduler session", () => {
  const originalSchedulerSecret = process.env.SCHEDULER_SESSION_SECRET;
  const originalOwnerIds = process.env.OWNER_TIKTOK_OPEN_IDS;

  process.env.SCHEDULER_SESSION_SECRET = "scheduler-secret";
  process.env.OWNER_TIKTOK_OPEN_IDS = "owner-open-id";
  const cookieValue = createSchedulerSession("user-1", "owner-open-id");

  assert.equal(
    hasWhatsAppAdminAccess({
      get(name) {
        return name === SCHEDULER_SESSION_COOKIE ? { value: cookieValue } : undefined;
      },
    }),
    true,
  );

  process.env.SCHEDULER_SESSION_SECRET = originalSchedulerSecret;
  process.env.OWNER_TIKTOK_OPEN_IDS = originalOwnerIds;
});

test("WhatsApp admin access rejects non-owner scheduler sessions", () => {
  const originalSchedulerSecret = process.env.SCHEDULER_SESSION_SECRET;
  const originalOwnerIds = process.env.OWNER_TIKTOK_OPEN_IDS;

  process.env.SCHEDULER_SESSION_SECRET = "scheduler-secret";
  process.env.OWNER_TIKTOK_OPEN_IDS = "owner-open-id";
  const cookieValue = createSchedulerSession("user-1", "someone-else");

  assert.equal(
    hasWhatsAppAdminAccess({
      get(name) {
        return name === SCHEDULER_SESSION_COOKIE ? { value: cookieValue } : undefined;
      },
    }),
    false,
  );

  process.env.SCHEDULER_SESSION_SECRET = originalSchedulerSecret;
  process.env.OWNER_TIKTOK_OPEN_IDS = originalOwnerIds;
});

test("WhatsApp admin access fails closed when the scheduler session secret is unavailable", () => {
  const originalSchedulerSecret = process.env.SCHEDULER_SESSION_SECRET;
  const originalOwnerIds = process.env.OWNER_TIKTOK_OPEN_IDS;

  process.env.SCHEDULER_SESSION_SECRET = "";
  process.env.OWNER_TIKTOK_OPEN_IDS = "owner-open-id";

  assert.equal(
    hasWhatsAppAdminAccess({
      get(name) {
        return name === SCHEDULER_SESSION_COOKIE ? { value: "not-a-real-cookie" } : undefined;
      },
    }),
    false,
  );

  process.env.SCHEDULER_SESSION_SECRET = originalSchedulerSecret;
  process.env.OWNER_TIKTOK_OPEN_IDS = originalOwnerIds;
});
