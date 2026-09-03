"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense, useState } from "react";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import AdvancedAnalyticsPanel from "./AdvancedAnalyticsPanel";
import CallAnalyticsPanel from "./CallAnalyticsPanel";

type AnalyticsView = "messages" | "advanced" | "calls";

function TabButton({ view, active, onSelect, children }: { view: AnalyticsView; active: AnalyticsView; onSelect: (view: AnalyticsView) => void; children: ReactNode }) {
  return <button type="button" role="tab" id={`analytics-${view}-tab`} aria-selected={active === view} aria-controls={`analytics-${view}-panel`} onClick={() => onSelect(view)} className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-xs font-semibold transition ${active === view ? "bg-ledger-tint text-ledger-bright shadow-[inset_0_0_0_1px_rgba(22,198,90,.14)]" : "text-ink-faint hover:bg-paper-sunk hover:text-ink"}`}>{children}</button>;
}

function LoadingCards() { return <section className="p-4 sm:p-5"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0,1,2,3].map((item)=><div key={item} className="h-28 animate-pulse rounded-2xl border border-rule bg-paper-sunk" />)}</div></section>; }

export default function WhatsAppAnalyticsLayout({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AnalyticsView>("messages");
  return <div className="w-full p-3 sm:p-5 lg:p-6">
    <header className="mb-5 flex flex-col gap-4 border-b border-rule pb-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ledger-bright"><span className="h-1.5 w-1.5 rounded-full bg-ledger-bright" />Performance intelligence</div><h1 className="text-2xl font-semibold text-ink sm:text-3xl">Analytics & reports</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-ink-faint">Monitor messaging, conversations, automations and calls from a single reporting workspace.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/whatsapp/conversations/" className="inline-flex items-center gap-2 rounded-xl border border-rule bg-paper-raised px-3.5 py-2.5 text-xs font-semibold text-ink-soft hover:border-rule-strong hover:text-ink"><WhatsAppIcon name="conversations" className="h-4 w-4" />Inbox</Link><Link href="/admin/whatsapp/campaigns/" className="inline-flex items-center gap-2 rounded-xl border border-ledger-bright/25 bg-ledger-tint px-3.5 py-2.5 text-xs font-semibold text-ledger-bright"><WhatsAppIcon name="campaigns" className="h-4 w-4" />Campaigns</Link></div></header>
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-5">
      <main className="min-w-0 overflow-hidden rounded-2xl border border-rule bg-paper-raised">
        <div className="border-b border-rule p-3 sm:p-4"><div role="tablist" aria-label="Analytics view" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-rule bg-paper p-1"><TabButton view="messages" active={view} onSelect={setView}>Messages</TabButton><TabButton view="advanced" active={view} onSelect={setView}>Advanced</TabButton><TabButton view="calls" active={view} onSelect={setView}>Calls</TabButton></div></div>
        <div id="analytics-messages-panel" role="tabpanel" aria-labelledby="analytics-messages-tab" hidden={view!=="messages"}>{children}</div>
        <div id="analytics-advanced-panel" role="tabpanel" aria-labelledby="analytics-advanced-tab" hidden={view!=="advanced"}>{view==="advanced"?<Suspense fallback={<LoadingCards/>}><AdvancedAnalyticsPanel/></Suspense>:null}</div>
        <div id="analytics-calls-panel" role="tabpanel" aria-labelledby="analytics-calls-tab" hidden={view!=="calls"}>{view==="calls"?<Suspense fallback={<LoadingCards/>}><CallAnalyticsPanel/></Suspense>:null}</div>
      </main>
      <aside className="hidden space-y-3 xl:block xl:sticky xl:top-24 xl:self-start"><section className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Report shortcuts</p><nav className="mt-3 grid gap-1"><Link href="/admin/whatsapp/analytics/?days=7" className="rounded-xl bg-ledger-tint px-3 py-2.5 text-xs font-semibold text-ledger-bright">Last 7 days</Link><Link href="/admin/whatsapp/analytics/?days=30" className="rounded-xl px-3 py-2.5 text-xs font-semibold text-ink-soft hover:bg-paper-sunk hover:text-ink">Last 30 days</Link><Link href="/admin/whatsapp/analytics/?days=90" className="rounded-xl px-3 py-2.5 text-xs font-semibold text-ink-soft hover:bg-paper-sunk hover:text-ink">Last 90 days</Link></nav></section><section className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Related workspaces</p><div className="mt-3 grid gap-2"><Link href="/admin/whatsapp/automations/" className="flex items-center gap-2 rounded-xl border border-rule bg-paper px-3 py-2.5 text-xs text-ink-soft hover:border-rule-strong hover:text-ink"><WhatsAppIcon name="automations" className="h-4 w-4" />Automation performance</Link><Link href="/admin/whatsapp/flows/" className="flex items-center gap-2 rounded-xl border border-rule bg-paper px-3 py-2.5 text-xs text-ink-soft hover:border-rule-strong hover:text-ink"><WhatsAppIcon name="automations" className="h-4 w-4" />Flow activity</Link></div></section></aside>
    </div>
  </div>;
}
