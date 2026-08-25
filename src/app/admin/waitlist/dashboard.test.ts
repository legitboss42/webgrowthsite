import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createInternalUtilityCookieValue,
  getInternalUtilityCookieName,
} from "@/lib/internalUtilityAuth";
import { NO_VALUE } from "@/lib/waitlist/schema";
import { hasWaitlistAdminAccess } from "./auth";
import {
  filterWaitlistSignups,
  formatSignupDate,
  getEmailStatusLabel,
  parseWaitlistFilter,
  summariseWaitlist,
  type WaitlistDashboardRow,
} from "./dashboard";

/**
 * Unit tests for the /admin/waitlist dashboard.
 *
 * The dashboard numbers are the part of this feature most likely to mislead
 * someone, so the counting rules are pinned here rather than eyeballed in the
 * browser. `summariseWaitlist` takes an injectable clock so the seven-day window
 * is tested deterministically.
 */

const pagePath = new URL("./page.tsx", import.meta.url);

function row(overrides: Partial<WaitlistDashboardRow>): WaitlistDashboardRow {
  return {
    id: "row",
    full_name: "Test Person",
    email: "test@example.com",
    business_name: null,
    interest: "whatsapp",
    business_size: null,
    status: "waitlisted",
    confirmation_email_status: "sent",
    created_at: "2026-01-10T09:00:00.000Z",
    ...overrides,
  };
}

const NOW = Date.parse("2026-01-15T12:00:00.000Z");

const signups: WaitlistDashboardRow[] = [
  row({ id: "whatsapp-recent", interest: "whatsapp", created_at: "2026-01-14T12:00:00.000Z" }),
  row({ id: "tiktok-recent", interest: "tiktok", created_at: "2026-01-13T12:00:00.000Z" }),
  row({ id: "both-recent", interest: "both", created_at: "2026-01-12T12:00:00.000Z" }),
  row({ id: "whatsapp-old", interest: "whatsapp", created_at: "2025-11-01T12:00:00.000Z" }),
];

test("an unknown or missing interest filter falls back to ALL", () => {
  assert.equal(parseWaitlistFilter(undefined), "ALL");
  assert.equal(parseWaitlistFilter(""), "ALL");
  assert.equal(parseWaitlistFilter("everyone"), "ALL");
  assert.equal(parseWaitlistFilter("<script>"), "ALL");
});

test("the interest filter accepts lower-case query values", () => {
  assert.equal(parseWaitlistFilter("whatsapp"), "WHATSAPP");
  assert.equal(parseWaitlistFilter("TikTok"), "TIKTOK");
  assert.equal(parseWaitlistFilter("both"), "BOTH");
});

test("the four filters partition the list rather than overlapping", () => {
  assert.deepEqual(filterWaitlistSignups(signups, "ALL").map((item) => item.id), [
    "whatsapp-recent",
    "tiktok-recent",
    "both-recent",
    "whatsapp-old",
  ]);
  assert.deepEqual(filterWaitlistSignups(signups, "WHATSAPP").map((item) => item.id), [
    "whatsapp-recent",
    "whatsapp-old",
  ]);
  assert.deepEqual(filterWaitlistSignups(signups, "TIKTOK").map((item) => item.id), ["tiktok-recent"]);
  assert.deepEqual(filterWaitlistSignups(signups, "BOTH").map((item) => item.id), ["both-recent"]);
});

test("product interest counts include people who chose both products", () => {
  const summary = summariseWaitlist(signups, NOW);

  assert.equal(summary.total, 4);
  assert.equal(summary.whatsappInterest, 3);
  assert.equal(summary.tiktokInterest, 2);
  assert.equal(summary.both, 1);
});

test("the seven-day count uses the injected clock and excludes older signups", () => {
  assert.equal(summariseWaitlist(signups, NOW).lastSevenDays, 3);

  const later = Date.parse("2026-02-01T12:00:00.000Z");
  assert.equal(summariseWaitlist(signups, later).lastSevenDays, 0);
});

test("an empty waitlist summarises to zeroes rather than placeholder numbers", () => {
  assert.deepEqual(summariseWaitlist([], NOW), {
    total: 0,
    whatsappInterest: 0,
    tiktokInterest: 0,
    both: 0,
    lastSevenDays: 0,
  });
});

test("unparseable timestamps are ignored instead of inflating the seven-day count", () => {
  const summary = summariseWaitlist([row({ id: "broken", created_at: "not-a-date" })], NOW);

  assert.equal(summary.total, 1);
  assert.equal(summary.lastSevenDays, 0);
});

test("confirmation email status is labelled from the stored value", () => {
  assert.equal(getEmailStatusLabel("sent"), "Sent");
  assert.equal(getEmailStatusLabel("failed"), "Failed");
  assert.equal(getEmailStatusLabel("pending"), "Pending");
  assert.equal(getEmailStatusLabel("skipped"), "Skipped");
  assert.equal(getEmailStatusLabel(""), NO_VALUE);
});

test("signup dates render without a locale so the server and client agree", () => {
  assert.equal(formatSignupDate("2026-01-14T12:34:56.000Z"), "2026-01-14 12:34");
  assert.equal(formatSignupDate("not-a-date"), NO_VALUE);
});

test("waitlist admin access accepts a valid internal utility cookie", () => {
  const originalSessionSecret = process.env.INTERNAL_TOOL_SESSION_SECRET;

  process.env.INTERNAL_TOOL_SESSION_SECRET = "waitlist-admin-secret";
  const cookieValue = createInternalUtilityCookieValue();

  assert.equal(
    hasWaitlistAdminAccess({
      get(name) {
        return name === getInternalUtilityCookieName() ? { value: cookieValue } : undefined;
      },
    }),
    true,
  );

  process.env.INTERNAL_TOOL_SESSION_SECRET = originalSessionSecret;
});

test("waitlist admin access fails closed for missing and tampered cookies", () => {
  const originalSessionSecret = process.env.INTERNAL_TOOL_SESSION_SECRET;

  process.env.INTERNAL_TOOL_SESSION_SECRET = "waitlist-admin-secret";

  assert.equal(
    hasWaitlistAdminAccess({
      get() {
        return undefined;
      },
    }),
    false,
  );

  assert.equal(
    hasWaitlistAdminAccess({
      get(name) {
        return name === getInternalUtilityCookieName() ? { value: "forged.cookie.value" } : undefined;
      },
    }),
    false,
  );

  assert.equal(
    hasWaitlistAdminAccess({
      get() {
        throw new Error("cookie store unavailable");
      },
    }),
    false,
  );

  process.env.INTERNAL_TOOL_SESSION_SECRET = originalSessionSecret;
});

test("waitlist admin access does not accept a cookie sealed with a different secret", () => {
  const originalSessionSecret = process.env.INTERNAL_TOOL_SESSION_SECRET;

  process.env.INTERNAL_TOOL_SESSION_SECRET = "first-secret";
  const cookieValue = createInternalUtilityCookieValue();
  process.env.INTERNAL_TOOL_SESSION_SECRET = "rotated-secret";

  assert.equal(
    hasWaitlistAdminAccess({
      get(name) {
        return name === getInternalUtilityCookieName() ? { value: cookieValue } : undefined;
      },
    }),
    false,
  );

  process.env.INTERNAL_TOOL_SESSION_SECRET = originalSessionSecret;
});

test("the waitlist admin page is gated, non-indexable and reads only real rows", () => {
  const source = readFileSync(pagePath, "utf8");

  assert.match(source, /hasWaitlistAdminAccess\(cookieStore\)/);
  assert.match(source, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(source, /listWaitlistSignups/);
});

test("the waitlist admin page imports nothing from the TikTok or WhatsApp systems", () => {
  const source = readFileSync(pagePath, "utf8");
  const specifiers = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);

  assert.ok(specifiers.length > 0, "expected the page to have imports");

  for (const specifier of specifiers) {
    assert.doesNotMatch(
      specifier,
      /whatsapp|tiktok|scheduler/i,
      `unexpected product import: ${specifier}`,
    );
  }
});
