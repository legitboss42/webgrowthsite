import type { ReactNode } from "react";
import { Suspense } from "react";
import CallAnalyticsPanel from "./CallAnalyticsPanel";

export default function WhatsAppAnalyticsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Suspense
        fallback={
          <section className="px-4 pb-6 sm:px-6">
            <div className="mt-5 border-t border-rule pt-5">
              <div className="h-5 w-32 animate-pulse rounded bg-paper-sunk" />
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-28 animate-pulse rounded-xl bg-paper-sunk" />
                ))}
              </div>
            </div>
          </section>
        }
      >
        <CallAnalyticsPanel />
      </Suspense>
    </>
  );
}
