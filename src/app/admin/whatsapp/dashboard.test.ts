import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createInternalUtilityCookieValue, getInternalUtilityCookieName } from "@/lib/internalUtilityAuth";
import { createSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { hasWhatsAppAdminAccess } from "./auth";
import { filterWhatsAppLeads } from "./dashboard";

const leads = [
  { id: "hot", wa_id: "1", lead_temperature: "HOT" as const, intent: "PRICING_REQUEST", human_review_required: true, status: "open" },
  { id: "warm", wa_id: "2", lead_temperature: "WARM" as const, human_review_required: false, status: "open" },
];
const pagePath = new URL("./page.tsx", import.meta.url);

test("returns only hot WhatsApp leads for the HOT filter", () => {
  assert.deepEqual(filterWhatsAppLeads(leads, "HOT").map((lead) => lead.id), ["hot"]);
});

test("WhatsApp admin page allows the existing owner scheduler session as an internal access path", () => {
  const source = readFileSync(pagePath, "utf8");

  assert.match(source, /hasWhatsAppAdminAccess/);
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
