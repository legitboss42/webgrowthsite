"use client";

import { useCallback, useEffect, useRef } from "react";
import AutomationMotion from "@/components/automation/AutomationMotion";
import { trackAutomationEvent } from "@/components/automation/analytics";

/**
 * Client entry point for the /automation page: reports the page view, starts the
 * motion layer, and forwards demo-start and CTA-click events.
 *
 * CTA clicks are handled by delegation on `[data-automation-cta]` so the static
 * server-rendered sections stay server components and no anchor needs to become
 * a client island.
 */

export default function AutomationTracking() {
  const viewReported = useRef(false);

  useEffect(() => {
    if (viewReported.current) return;
    viewReported.current = true;
    trackAutomationEvent("automation_page_view");
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const cta = target?.closest<HTMLElement>("[data-automation-cta]");
      if (!cta) return;

      trackAutomationEvent("automation_waitlist_cta_clicked", {
        location: cta.dataset.automationCta || "unknown",
      });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const onDemoStart = useCallback((demo: string) => {
    trackAutomationEvent("automation_demo_started", { demo });
  }, []);

  return <AutomationMotion onDemoStart={onDemoStart} />;
}
