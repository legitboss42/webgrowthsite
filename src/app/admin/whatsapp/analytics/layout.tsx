"use client";

import type { ReactNode } from "react";
import { Suspense, useState } from "react";
import CallAnalyticsPanel from "./CallAnalyticsPanel";

type AnalyticsView = "messages" | "calls";

export default function WhatsAppAnalyticsLayout({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AnalyticsView>("messages");

  return (
    <>
      <div className="border-b border-rule px-4 pt-4 sm:px-6">
        <div
          role="tablist"
          aria-label="Analytics channel"
          className="inline-flex rounded-xl border border-rule bg-paper-sunk p-1"
        >
          <button
            type="button"
            role="tab"
            id="analytics-messages-tab"
            aria-selected={view === "messages"}
            aria-controls="analytics-messages-panel"
            onClick={() => setView("messages")}
            className={`min-w-[110px] rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${
              view === "messages"
                ? "bg-ledger-bright text-white shadow-sm"
                : "text-ink-soft hover:bg-paper-raised hover:text-ink"
            }`}
          >
            Messages
          </button>
          <button
            type="button"
            role="tab"
            id="analytics-calls-tab"
            aria-selected={view === "calls"}
            aria-controls="analytics-calls-panel"
            onClick={() => setView("calls")}
            className={`min-w-[110px] rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${
              view === "calls"
                ? "bg-ledger-bright text-white shadow-sm"
                : "text-ink-soft hover:bg-paper-raised hover:text-ink"
            }`}
          >
            Calls
          </button>
        </div>
      </div>

      <div
        id="analytics-messages-panel"
        role="tabpanel"
        aria-labelledby="analytics-messages-tab"
        hidden={view !== "messages"}
      >
        {children}
      </div>

      <div
        id="analytics-calls-panel"
        role="tabpanel"
        aria-labelledby="analytics-calls-tab"
        hidden={view !== "calls"}
      >
        {view === "calls" ? (
          <Suspense
            fallback={
              <section className="px-4 py-5 sm:px-6 sm:py-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="h-28 animate-pulse rounded-xl bg-paper-sunk" />
                  ))}
                </div>
              </section>
            }
          >
            <CallAnalyticsPanel />
          </Suspense>
        ) : null}
      </div>
    </>
  );
}
