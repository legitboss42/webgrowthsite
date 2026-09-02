"use client";

import type { ReactNode } from "react";
import { Suspense, useState } from "react";
import AdvancedAnalyticsPanel from "./AdvancedAnalyticsPanel";
import CallAnalyticsPanel from "./CallAnalyticsPanel";

type AnalyticsView = "messages" | "advanced" | "calls";

function TabButton({ view, active, onSelect, children }: { view: AnalyticsView; active: AnalyticsView; onSelect: (view: AnalyticsView) => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      id={`analytics-${view}-tab`}
      aria-selected={active === view}
      aria-controls={`analytics-${view}-panel`}
      onClick={() => onSelect(view)}
      className={`min-w-[104px] rounded-lg px-3.5 py-2 text-sm font-medium transition active:scale-[0.98] ${active === view ? "bg-ledger-bright text-white shadow-sm" : "text-ink-soft hover:bg-paper-raised hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

function LoadingCards() {
  return (
    <section className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-paper-sunk" />)}
      </div>
    </section>
  );
}

export default function WhatsAppAnalyticsLayout({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AnalyticsView>("messages");

  return (
    <>
      <div className="border-b border-rule px-4 pt-4 sm:px-6">
        <div role="tablist" aria-label="Analytics view" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex min-w-max rounded-xl border border-rule bg-paper-sunk p-1">
            <TabButton view="messages" active={view} onSelect={setView}>Messages</TabButton>
            <TabButton view="advanced" active={view} onSelect={setView}>Advanced</TabButton>
            <TabButton view="calls" active={view} onSelect={setView}>Calls</TabButton>
          </div>
        </div>
      </div>

      <div id="analytics-messages-panel" role="tabpanel" aria-labelledby="analytics-messages-tab" hidden={view !== "messages"}>
        {children}
      </div>

      <div id="analytics-advanced-panel" role="tabpanel" aria-labelledby="analytics-advanced-tab" hidden={view !== "advanced"}>
        {view === "advanced" ? <Suspense fallback={<LoadingCards />}><AdvancedAnalyticsPanel /></Suspense> : null}
      </div>

      <div id="analytics-calls-panel" role="tabpanel" aria-labelledby="analytics-calls-tab" hidden={view !== "calls"}>
        {view === "calls" ? <Suspense fallback={<LoadingCards />}><CallAnalyticsPanel /></Suspense> : null}
      </div>
    </>
  );
}
