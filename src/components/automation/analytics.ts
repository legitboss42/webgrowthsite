"use client";

import { trackEvent } from "@/lib/analytics";

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
