import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createGoogleAuthSessionValue, getGoogleAuthCookieName } from "@/lib/googleAuth";
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
const pagePath = new URL("./conversations/page.tsx", import.meta.url);
const overviewPagePath = new URL("./page.tsx", import.meta.url);
const replyComposerPath = new URL("./ReplyComposer.tsx", import.meta.url);
const messageMediaPath = new URL("./MessageMedia.tsx", import.meta.url);

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

test("uses inbound audio messages to keep the free-form reply window open", () => {
  const state = buildWhatsAppReplyComposerState({
    selectedLead: leads[0],
    selectedMessages: [{
      id: "audio-1",
      whatsapp_message_id: "wamid.audio",
      conversation_id: "hot",
      direction: "inbound",
      message_type: "audio",
      media_id: "media-1",
      message_timestamp: "2026-08-23T22:54:00.000Z",
    }],
    senderConfigured: true,
    now: Date.parse("2026-08-23T23:10:00.000Z") / 1000,
  });

  assert.equal(state.enabled, true);
  assert.equal(state.replyToMessageId, "wamid.audio");
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

test("every WhatsApp console page is gated behind the same admin access check", () => {
  assert.match(readFileSync(overviewPagePath, "utf8"), /hasWhatsAppAdminAccess/);
});

test("WhatsApp admin page loads and renders protected audio messages", () => {
  const source = readFileSync(pagePath, "utf8");
  const mediaSource = readFileSync(messageMediaPath, "utf8");

  assert.match(source, /message_type,message_text,message_timestamp,delivery_status,media_id,media_mime_type,media_voice,media_filename/);
  // Every stored media kind is played back through the authenticated proxy, never through
  // a Meta URL: those need the access token, which must not reach a page.
  assert.match(mediaSource, /\/api\/admin\/whatsapp\/media\//);
  assert.doesNotMatch(mediaSource, /graph\.facebook\.com/);
  assert.match(mediaSource, /<audio/);
  assert.match(mediaSource, /<video/);
  for (const kind of ["audio", "image", "video", "document"]) {
    assert.match(mediaSource, new RegExp(`message_type === "${kind}"`), `${kind} bubble missing`);
  }
});

test("WhatsApp reply composer can post recorded audio through the protected audio reply route", () => {
  const source = readFileSync(replyComposerPath, "utf8");

  assert.match(source, /MediaRecorder/);
  assert.match(source, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(source, /\/api\/admin\/whatsapp\/reply\/audio/);
});

test("WhatsApp admin access accepts the configured Google admin session", () => {
  const originalSessionSecret = process.env.GOOGLE_AUTH_SESSION_SECRET;
  const originalAdminEmails = process.env.GOOGLE_ADMIN_EMAILS;

  process.env.GOOGLE_AUTH_SESSION_SECRET = "google-auth-secret";
  process.env.GOOGLE_ADMIN_EMAILS = "vickysaintbrown02@gmail.com";
  const cookieValue = createGoogleAuthSessionValue({
    userId: "google-admin",
    email: "Vickysaintbrown02@gmail.com",
    fullName: "Vicky Saint Brown",
  });

  assert.equal(
    hasWhatsAppAdminAccess({
      get(name) {
        return name === getGoogleAuthCookieName() ? { value: cookieValue } : undefined;
      },
    }),
    true,
  );

  process.env.GOOGLE_AUTH_SESSION_SECRET = originalSessionSecret;
  process.env.GOOGLE_ADMIN_EMAILS = originalAdminEmails;
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

test("WhatsApp admin access rejects a non-admin Google session", () => {
  const originalSessionSecret = process.env.GOOGLE_AUTH_SESSION_SECRET;
  const originalAdminEmails = process.env.GOOGLE_ADMIN_EMAILS;

  process.env.GOOGLE_AUTH_SESSION_SECRET = "google-auth-secret";
  process.env.GOOGLE_ADMIN_EMAILS = "vickysaintbrown02@gmail.com";
  const cookieValue = createGoogleAuthSessionValue({
    userId: "google-user",
    email: "someone@example.com",
    fullName: "Someone Else",
  });

  assert.equal(
    hasWhatsAppAdminAccess({
      get(name) {
        return name === getGoogleAuthCookieName() ? { value: cookieValue } : undefined;
      },
    }),
    false,
  );

  process.env.GOOGLE_AUTH_SESSION_SECRET = originalSessionSecret;
  process.env.GOOGLE_ADMIN_EMAILS = originalAdminEmails;
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
