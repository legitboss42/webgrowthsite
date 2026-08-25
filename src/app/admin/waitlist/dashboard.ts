/**
 * Pure helpers for the /admin/waitlist dashboard.
 *
 * Kept free of database and server-only imports so the numbers can be unit
 * tested directly. Every figure is derived from the rows passed in; there is no
 * placeholder, sample or hard-coded count anywhere in this module.
 */

import { NO_VALUE } from "@/lib/waitlist/schema";

export type WaitlistDashboardRow = {
  id: string;
  full_name: string;
  email: string;
  business_name: string | null;
  interest: string;
  business_size: string | null;
  status: string;
  confirmation_email_status: string;
  created_at: string;
};

export const WAITLIST_FILTERS = ["ALL", "WHATSAPP", "TIKTOK", "BOTH"] as const;

export type WaitlistFilter = (typeof WAITLIST_FILTERS)[number];

export const WAITLIST_FILTER_LABELS: Record<WaitlistFilter, string> = {
  ALL: "All",
  WHATSAPP: "WhatsApp",
  TIKTOK: "TikTok",
  BOTH: "Both",
};

/** Narrow an untrusted query string to a known filter, defaulting to ALL. */
export function parseWaitlistFilter(value: string | undefined): WaitlistFilter {
  const candidate = (value || "").toUpperCase();
  return (WAITLIST_FILTERS as readonly string[]).includes(candidate)
    ? (candidate as WaitlistFilter)
    : "ALL";
}

/**
 * Filter by stated interest.
 *
 * WHATSAPP and TIKTOK match that product exactly; someone who chose both is
 * counted under BOTH rather than being duplicated into each product filter, so
 * the four filters partition the list.
 */
export function filterWaitlistSignups(
  rows: WaitlistDashboardRow[],
  filter: WaitlistFilter
): WaitlistDashboardRow[] {
  if (filter === "ALL") return rows;
  if (filter === "WHATSAPP") return rows.filter((row) => row.interest === "whatsapp");
  if (filter === "TIKTOK") return rows.filter((row) => row.interest === "tiktok");
  return rows.filter((row) => row.interest === "both");
}

export type WaitlistSummary = {
  total: number;
  /** Anyone who wants WhatsApp automation, including those who chose both. */
  whatsappInterest: number;
  /** Anyone who wants the TikTok scheduler, including those who chose both. */
  tiktokInterest: number;
  both: number;
  lastSevenDays: number;
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Real counts from real rows. `now` is injectable so the seven-day window can be
 * tested without depending on the wall clock.
 */
export function summariseWaitlist(
  rows: WaitlistDashboardRow[],
  now: number = Date.now()
): WaitlistSummary {
  const cutoff = now - SEVEN_DAYS_MS;

  let whatsappInterest = 0;
  let tiktokInterest = 0;
  let both = 0;
  let lastSevenDays = 0;

  for (const row of rows) {
    if (row.interest === "whatsapp" || row.interest === "both") whatsappInterest += 1;
    if (row.interest === "tiktok" || row.interest === "both") tiktokInterest += 1;
    if (row.interest === "both") both += 1;

    const created = Date.parse(row.created_at);
    if (Number.isFinite(created) && created >= cutoff && created <= now) {
      lastSevenDays += 1;
    }
  }

  return { total: rows.length, whatsappInterest, tiktokInterest, both, lastSevenDays };
}

/** Confirmation-email status as shown in the table. Unknown values pass through. */
export function getEmailStatusLabel(status: string): string {
  if (status === "sent") return "Sent";
  if (status === "failed") return "Failed";
  if (status === "pending") return "Pending";
  if (status === "skipped") return "Skipped";
  return status || NO_VALUE;
}

/** Signup date, formatted without a locale so server and client agree. */
export function formatSignupDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return NO_VALUE;
  return parsed.toISOString().slice(0, 16).replace("T", " ");
}
