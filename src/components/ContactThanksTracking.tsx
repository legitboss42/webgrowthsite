"use client";

import { useEffect } from "react";

export default function ContactThanksTracking() {
  useEffect(() => {
    if (typeof window !== "undefined" && (window as { fbq?: (...args: unknown[]) => void }).fbq) {
      (window as { fbq?: (...args: unknown[]) => void }).fbq?.("track", "Lead");
    }

    if (
      typeof window !== "undefined" &&
      (window as { dataLayer?: Array<Record<string, unknown>> }).dataLayer
    ) {
      (window as { dataLayer?: Array<Record<string, unknown>> }).dataLayer?.push({
        event: "lead",
        source: "contact_form",
      });
    }
  }, []);

  return null;
}

