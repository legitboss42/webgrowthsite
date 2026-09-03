"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const LEAD_FILTERS = ["ALL", "HOT", "WARM", "REVIEW", "PRICING", "MEETING", "PROPOSAL"] as const;
type LeadFilter = (typeof LEAD_FILTERS)[number];
type Lifecycle = "all" | "open" | "closed";

function normalizedLeadFilter(value: string | null): LeadFilter {
  return LEAD_FILTERS.includes(value as LeadFilter) ? value as LeadFilter : "ALL";
}

function normalizedLifecycle(value: string | null): Lifecycle {
  return value === "open" || value === "closed" ? value : "all";
}

export default function ConversationFilterDock() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [leadFilter, setLeadFilter] = useState<LeadFilter>(() => normalizedLeadFilter(searchParams.get("filter")));
  const [lifecycle, setLifecycle] = useState<Lifecycle>(() => normalizedLifecycle(searchParams.get("lifecycle")));
  const [counts, setCounts] = useState<Record<string, string>>({});

  useEffect(() => {
    setLeadFilter(normalizedLeadFilter(searchParams.get("filter")));
    setLifecycle(normalizedLifecycle(searchParams.get("lifecycle")));
  }, [searchParams]);

  useEffect(() => {
    if (!pathname?.startsWith("/admin/whatsapp/conversations")) {
      setTarget(null);
      return;
    }

    const assignmentNav = document.querySelector<HTMLElement>('nav[aria-label="Assignment scope"]');
    const leadNav = document.querySelector<HTMLElement>('nav[aria-label="Lead filters"]');
    if (!assignmentNav || !leadNav) return;

    const nextCounts: Record<string, string> = {};
    leadNav.querySelectorAll<HTMLAnchorElement>("a").forEach((anchor) => {
      const href = new URL(anchor.href, window.location.origin);
      const value = normalizedLeadFilter(href.searchParams.get("filter"));
      const badge = anchor.querySelector("span");
      if (badge?.textContent) nextCounts[value] = badge.textContent.trim();
    });
    setCounts(nextCounts);

    const existing = assignmentNav.parentElement?.querySelector<HTMLElement>("[data-wg-conversation-filter-dock]");
    const dock = existing || document.createElement("div");
    if (!existing) {
      dock.dataset.wgConversationFilterDock = "true";
      assignmentNav.insertAdjacentElement("afterend", dock);
    }
    setTarget(dock);
    return () => {
      if (!existing) dock.remove();
      setTarget(null);
    };
  }, [pathname, searchParams]);

  if (!target) return null;

  const activeCount = Number(leadFilter !== "ALL") + Number(lifecycle !== "all");

  function navigate(nextFilter: LeadFilter, nextLifecycle: Lifecycle) {
    const query = new URLSearchParams(searchParams.toString());
    if (nextFilter === "ALL") query.delete("filter"); else query.set("filter", nextFilter);
    if (nextLifecycle === "all") query.delete("lifecycle"); else query.set("lifecycle", nextLifecycle);
    query.delete("panel");
    const suffix = query.toString();
    router.push(suffix ? `/admin/whatsapp/conversations/?${suffix}` : "/admin/whatsapp/conversations/");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(leadFilter, lifecycle);
  }

  return createPortal(
    <details className="wg-conversation-filter-menu relative mt-1.5">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-rule bg-paper-raised px-3 text-xs font-semibold text-ink-soft transition hover:border-rule-strong hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2"><span aria-hidden="true">⌁</span><span>Filter{activeCount ? ` · ${activeCount}` : ""}</span></span>
        <span aria-hidden="true" className="text-[0.65rem] text-ink-faint">▾</span>
      </summary>
      <form onSubmit={submit} className="absolute left-0 right-0 top-[calc(100%+.35rem)] z-[60] rounded-xl border border-rule bg-paper-raised p-3 shadow-2xl">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[0.62rem] font-semibold uppercase tracking-[.09em] text-ink-faint">Lifecycle
            <select value={lifecycle} onChange={(event) => setLifecycle(event.target.value as Lifecycle)} className="mt-1 w-full border border-rule bg-paper px-2.5 py-1.5 text-xs font-medium normal-case tracking-normal text-ink">
              <option value="all">All chats</option><option value="open">Open chats</option><option value="closed">Closed chats</option>
            </select>
          </label>
          <label className="text-[0.62rem] font-semibold uppercase tracking-[.09em] text-ink-faint">Lead type
            <select value={leadFilter} onChange={(event) => setLeadFilter(event.target.value as LeadFilter)} className="mt-1 w-full border border-rule bg-paper px-2.5 py-1.5 text-xs font-medium normal-case tracking-normal text-ink">
              {LEAD_FILTERS.map((item) => <option key={item} value={item}>{item === "ALL" ? "All leads" : item}{counts[item] ? ` · ${counts[item]}` : ""}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button type="button" onClick={() => { setLeadFilter("ALL"); setLifecycle("all"); navigate("ALL", "all"); }} className="rounded-lg border border-rule bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft">Clear</button>
          <button type="submit" className="rounded-lg bg-ledger-bright px-3 py-1.5 text-xs font-semibold text-white">Apply filters</button>
        </div>
      </form>
    </details>,
    target,
  );
}
