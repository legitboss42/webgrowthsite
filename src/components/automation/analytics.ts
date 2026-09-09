"use client";

import { trackEvent } from "@/lib/analytics";

type TikTokTrackPayload = {
  contents: Array<{
    content_id: string;
    content_type: "product" | "product_group";
    content_name: string;
  }>;
};

declare global {
  interface Window {
    ttq?: {
      identify: (payload: { email?: string }) => void;
      track: (eventName: string, payload: TikTokTrackPayload) => void;
    };
  }
}

/**
 * Analytics for the /automation landing page.
 *
 * Deliberately narrow: this module only ever forwards non-identifying values.
 * Names, email addresses, business names and free-text use-case answers are
 * never passed to analytics, so they cannot leak through a param. The only
 * user-chosen value sent is the product interest, which is one of three fixed
 * enum values.
 */

export type AutomationEvent =
  | "automation_page_view"
  | "automation_waitlist_cta_clicked"
  | "automation_product_interest_selected"
  | "automation_waitlist_submitted"
  | "automation_waitlist_success"
  | "automation_demo_started";

type SafeParams = Record<string, string | number | boolean>;

export function trackAutomationEvent(event: AutomationEvent, params: SafeParams = {}) {
  trackEvent(event, { page_path: "/automation/", ...params });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Reports a confirmed waitlist signup to TikTok without exposing raw PII.
 * There is no purchase value for this early-access form, so value/currency are
 * intentionally omitted rather than invented.
 */
export async function trackTikTokWaitlistLead(email: string) {
  if (typeof window === "undefined" || !window.ttq || !email.trim()) return;

  try {
    const hashedEmail = await sha256(email);
    window.ttq.identify({ email: hashedEmail });
    window.ttq.track("Lead", {
      contents: [
        {
          content_id: "automation-waitlist",
          content_type: "product_group",
          content_name: "Web Growth Automation early-access waitlist",
        },
      ],
    });
  } catch {
    // Analytics must never turn a successful signup into a visible error.
  }
}
