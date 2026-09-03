"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense, useState } from "react";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import AdvancedAnalyticsPanel from "./AdvancedAnalyticsPanel";
import CallAnalyticsPanel from "./CallAnalyticsPanel";

type AnalyticsView = "messages" | "advanced" | "calls";

function TabButton({ view, active, onSelect, children }: { view: AnalyticsView; active: AnalyticsView; onSelect: (view: AnalyticsView) => void; children: ReactNode }) {
  return <button type="button" role="tab" id={`analytics-${view}-tab`} aria-selected={active === view} aria-controls={`analytics-${view}-panel`} onClick={() => onSelect(view)} className="wg-report-tab" data-active={active === view ? "true" : "false"}>{children}</button>;
}
function LoadingCards() { return <section className="p-4"><div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{[0,1,2,3].map((item)=><div key={item} className="h-24 animate-pulse rounded-xl border border-rule bg-paper-sunk" />)}</div></section>; }

export default function WhatsAppAnalyticsLayout({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AnalyticsView>("messages");
  return (
    <div className="wg-analytics-workspace flex min-h-full min-w-0 flex-col">
      <header className="wg-page-commandbar">
        <div className="min-w-0">
          <p className="wg-cw-eyebrow">Reporting</p>
          <h1 className="wg-cw-workspace-title">Analytics & reports</h1>
          <p className="wg-cw-workspace-description">Messaging, conversation, automation, campaign, Flow and call performance.</p>
        </div>
        <div className="wg-cw-workspace-actions">
          <Link href="/admin/whatsapp/conversations/" className="wg-cw-action"><WhatsAppIcon name="conversations" className="h-4 w-4" />Inbox</Link>
          <Link href="/admin/whatsapp/campaigns/" className="wg-cw-action" data-primary="true"><WhatsAppIcon name="campaigns" className="h-4 w-4" />Campaigns</Link>
        </div>
      </header>

      <div className="grid min-h-0 min-w-0 flex-1 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <main className="min-h-0 min-w-0 bg-[#060a0e] xl:border-r xl:border-rule">
          <div className="flex min-h-[3.4rem] items-center border-b border-rule bg-[#090f15] px-3 sm:px-4">
            <div role="tablist" aria-label="Analytics view" className="flex max-w-full gap-1 overflow-x-auto">
              <TabButton view="messages" active={view} onSelect={setView}>Messages</TabButton>
              <TabButton view="advanced" active={view} onSelect={setView}>Advanced</TabButton>
              <TabButton view="calls" active={view} onSelect={setView}>Calls</TabButton>
            </div>
          </div>
          <div id="analytics-messages-panel" role="tabpanel" aria-labelledby="analytics-messages-tab" hidden={view!=="messages"}>{children}</div>
          <div id="analytics-advanced-panel" role="tabpanel" aria-labelledby="analytics-advanced-tab" hidden={view!=="advanced"}>{view==="advanced"?<Suspense fallback={<LoadingCards/>}><AdvancedAnalyticsPanel/></Suspense>:null}</div>
          <div id="analytics-calls-panel" role="tabpanel" aria-labelledby="analytics-calls-tab" hidden={view!=="calls"}>{view==="calls"?<Suspense fallback={<LoadingCards/>}><CallAnalyticsPanel/></Suspense>:null}</div>
        </main>

        <aside className="wg-inspector-rail hidden min-h-0 overflow-y-auto p-3 xl:block">
          <p className="wg-cw-rail-label">Time range</p>
          <nav className="grid gap-1">
            <Link href="/admin/whatsapp/analytics/?days=7" className="wg-cw-rail-link" data-active="true"><span className="wg-cw-rail-icon"><WhatsAppIcon name="analytics" className="h-4 w-4" /></span><span>Last 7 days</span></Link>
            <Link href="/admin/whatsapp/analytics/?days=30" className="wg-cw-rail-link"><span className="wg-cw-rail-icon"><WhatsAppIcon name="analytics" className="h-4 w-4" /></span><span>Last 30 days</span></Link>
            <Link href="/admin/whatsapp/analytics/?days=90" className="wg-cw-rail-link"><span className="wg-cw-rail-icon"><WhatsAppIcon name="analytics" className="h-4 w-4" /></span><span>Last 90 days</span></Link>
          </nav>
          <div className="mt-4 border-t border-rule pt-4">
            <p className="wg-cw-rail-label">Drill down</p>
            <nav className="grid gap-1">
              <Link href="/admin/whatsapp/automations/" className="wg-cw-rail-link"><span className="wg-cw-rail-icon"><WhatsAppIcon name="automations" className="h-4 w-4" /></span><span>Automations</span></Link>
              <Link href="/admin/whatsapp/flows/" className="wg-cw-rail-link"><span className="wg-cw-rail-icon"><WhatsAppIcon name="templates" className="h-4 w-4" /></span><span>Flows</span></Link>
              <Link href="/admin/whatsapp/team/" className="wg-cw-rail-link"><span className="wg-cw-rail-icon"><WhatsAppIcon name="contacts" className="h-4 w-4" /></span><span>Team</span></Link>
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}
