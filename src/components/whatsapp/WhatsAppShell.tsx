"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { WhatsAppTeamRole } from "@/lib/whatsapp/teamModel";
import { WhatsAppIcon } from "./icons";
import {
  WHATSAPP_CONSOLE_ROOT,
  WHATSAPP_NAV_ITEMS,
  getWhatsAppLayoutMode,
  getWhatsAppNavSectionsForRole,
  getWhatsAppPageMeta,
  getWhatsAppSenderStatusText,
  isWhatsAppNavItemActive,
  type WhatsAppNavItem,
} from "./nav";

type WhatsAppShellProps = {
  children: React.ReactNode;
  senderConnected: boolean;
  senderNumber?: string;
  role: WhatsAppTeamRole;
  memberName: string;
  workspaceName?: string;
  workspaceControl?: ReactNode;
  presenceControl?: ReactNode;
  toolbar?: React.ReactNode;
};

function workspaceHome(role: WhatsAppTeamRole) {
  return role === "owner" ? WHATSAPP_CONSOLE_ROOT : `${WHATSAPP_CONSOLE_ROOT}/conversations`;
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "WG";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function Brand({ href, compact = false, onNavigate }: { href: string; compact?: boolean; onNavigate?: () => void }) {
  return (
    <Link href={href} onClick={onNavigate} aria-label="Web Growth WhatsApp platform" className={`wg-brand flex min-w-0 items-center ${compact ? "justify-center" : "gap-2.5"}`}>
      <span className="wg-brand-mark relative grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-xl">
        <img src="/images/logo.webp" alt="Web Growth" width="36" height="36" className="h-full w-full object-cover" />
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-[-.01em] text-white">Web Growth</span>
          <span className="mt-0.5 block truncate text-[0.6rem] font-semibold uppercase tracking-[.13em] text-white/38">WhatsApp workspace</span>
        </span>
      ) : null}
    </Link>
  );
}

function NavRow({ item, onNavigate, compact = false }: { item: WhatsAppNavItem; onNavigate?: () => void; compact?: boolean }) {
  const pathname = usePathname();
  const active = isWhatsAppNavItemActive(pathname, item.href);
  const title = compact ? `${item.label} · ${item.description}` : undefined;

  if (item.status === "soon") {
    return (
      <span aria-disabled="true" title={compact ? `${item.label}. ${item.description} Coming in a later stage.` : `${item.description} Coming in a later stage.`} className={`wg-nav-row flex cursor-not-allowed items-center px-2.5 py-2 text-sm text-white/24 ${compact ? "justify-center" : "gap-2.5"}`}>
        <WhatsAppIcon name={item.icon} className="h-[1.05rem] w-[1.05rem] flex-none" />
        {!compact ? <span className="truncate">{item.label}</span> : null}
        {!compact ? <span className="ml-auto text-[0.55rem] font-semibold uppercase tracking-[.12em] text-white/22">Soon</span> : null}
      </span>
    );
  }

  return (
    <Link href={item.href} onClick={onNavigate} title={title} aria-label={compact ? item.label : undefined} aria-current={active ? "page" : undefined} data-active={active ? "true" : "false"} className={`wg-nav-row group relative flex items-center px-2.5 py-2 text-sm font-medium ${compact ? "justify-center" : "gap-2.5"}`}>
      <span className="wg-nav-active-bar absolute inset-y-1.5 left-0 w-0.5 rounded-full" aria-hidden="true" />
      <WhatsAppIcon name={item.icon} className="h-[1.05rem] w-[1.05rem] flex-none" />
      {!compact ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

function SidebarContent({ senderConnected, senderNumber, role, memberName, workspaceName, workspaceControl, onNavigate, compact = false }: {
  senderConnected: boolean;
  senderNumber?: string;
  role: WhatsAppTeamRole;
  memberName: string;
  workspaceName?: string;
  workspaceControl?: ReactNode;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const sections = getWhatsAppNavSectionsForRole(role);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`wg-sidebar-brand flex-none pb-3 pt-1 ${compact ? "px-3" : "px-2"}`}>
        <Brand href={workspaceHome(role)} compact={compact} onNavigate={onNavigate} />
      </div>

      <div className={`wg-workspace-switcher flex-none pb-2 ${compact ? "px-3" : "px-2"}`}>
        {compact ? (
          <div title="Expand the sidebar to switch workspace" aria-label="Current workspace" className="grid h-9 w-9 place-items-center rounded-lg border border-white/[.06] bg-white/[.025] text-[0.62rem] font-bold text-white/74">
            WG
          </div>
        ) : workspaceControl ?? (
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/[.06] bg-white/[.025] px-2.5 py-2">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-white/[.05] text-[0.62rem] font-bold text-white/74">WG</span>
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-white/78">{workspaceName || "Web Growth"}</span>
            <WhatsAppIcon name="chevronLeft" className="h-3.5 w-3.5 -rotate-90 text-white/28" />
          </div>
        )}
      </div>

      <nav aria-label="WhatsApp console" className={`wg-sidebar-scroll min-h-0 flex-1 overflow-y-auto pb-3 ${compact ? "px-2" : "px-2"}`}>
        {sections.map((section) => (
          <div key={section.label} className="wg-nav-section mb-3">
            {!compact ? <p className="px-2.5 pb-1.5 pt-2 text-[0.57rem] font-semibold uppercase tracking-[.16em] text-white/24">{section.label}</p> : <div className="h-2" aria-hidden="true" />}
            <div className="space-y-0.5">{section.items.map((item) => <NavRow key={item.label} item={item} compact={compact} onNavigate={onNavigate} />)}</div>
          </div>
        ))}
      </nav>

      <div className={`wg-sidebar-footer flex-none border-t border-white/[.055] pb-1 pt-2.5 ${compact ? "px-3" : "px-2"}`}>
        <div className={`flex items-center rounded-lg py-2 ${compact ? "justify-center" : "gap-2.5 px-2"}`} title={compact ? `${memberName} · ${getWhatsAppSenderStatusText(senderConnected)}` : undefined}>
          <span className="relative grid h-8 w-8 flex-none place-items-center rounded-full bg-[#143423] text-[0.65rem] font-bold text-[#55dc8d]">
            {initials(memberName)}
            {compact ? <span aria-label={senderConnected ? "Sender connected" : "Sender offline"} className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#07110d] ${senderConnected ? "bg-[#22c55e]" : "bg-white/20"}`} /> : null}
          </span>
          {!compact ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white/82">{memberName}</p>
                <p className="mt-0.5 truncate text-[0.6rem] text-white/32">{role} · {getWhatsAppSenderStatusText(senderConnected)}{senderNumber ? ` · ${senderNumber}` : ""}</p>
              </div>
              <span aria-label={senderConnected ? "Sender connected" : "Sender offline"} className={`h-2 w-2 flex-none rounded-full ${senderConnected ? "bg-[#22c55e] shadow-[0_0_0_3px_rgba(34,197,94,.1)]" : "bg-white/20"}`} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MobileNav({ role, onMore }: { role: WhatsAppTeamRole; onMore: () => void }) {
  const pathname = usePathname();
  const preferred = ["Conversations", "Contacts", "Automations", "Campaigns"];
  const allowed = WHATSAPP_NAV_ITEMS.filter((item) => preferred.includes(item.label) && (!item.roles || item.roles.includes(role)));
  const columns = Math.max(1, allowed.length + 1);

  return (
    <nav aria-label="Mobile WhatsApp navigation" className="wg-mobile-nav fixed inset-x-0 bottom-0 z-40 grid px-1 lg:hidden" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {allowed.map((item) => {
        const active = isWhatsAppNavItemActive(pathname, item.href);
        return (
          <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className="relative flex flex-col items-center justify-center gap-1 px-1 py-1.5 text-[0.59rem] font-semibold" data-active={active ? "true" : "false"}>
            <WhatsAppIcon name={item.icon} className="h-[1.1rem] w-[1.1rem]" />
            <span className="max-w-full truncate">{item.label === "Conversations" ? "Inbox" : item.label}</span>
          </Link>
        );
      })}
      <button type="button" onClick={onMore} className="flex flex-col items-center justify-center gap-1 px-1 py-1.5 text-[0.59rem] font-semibold text-white/38">
        <WhatsAppIcon name="menu" className="h-[1.1rem] w-[1.1rem]" />
        <span>More</span>
      </button>
    </nav>
  );
}

export default function WhatsAppShell({ children, senderConnected, senderNumber, role, memberName, workspaceName, workspaceControl, presenceControl, toolbar }: WhatsAppShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const drawerId = useId();
  const pageMeta = useMemo(() => getWhatsAppPageMeta(pathname), [pathname]);
  const fillsViewport = getWhatsAppLayoutMode(pathname) === "fill";

  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  return (
    <div className={`wg-whatsapp-app flex min-w-0 text-ink ${fillsViewport ? "h-dvh overflow-hidden" : "min-h-dvh"}`}>
      <aside className={`wg-app-sidebar relative sticky top-0 hidden h-dvh flex-none flex-col py-3 transition-[width] duration-200 lg:flex ${sidebarCollapsed ? "w-[4.5rem]" : "w-[14.5rem]"}`}>
        <button
          type="button"
          onClick={() => setSidebarCollapsed((value) => !value)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-4 z-20 grid h-7 w-7 place-items-center rounded-full border border-white/[.09] bg-[#0b1511] text-white/55 shadow-lg transition hover:bg-[#12231b] hover:text-white"
        >
          <WhatsAppIcon name="chevronLeft" className={`h-3.5 w-3.5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
        </button>
        <SidebarContent compact={sidebarCollapsed} senderConnected={senderConnected} senderNumber={senderNumber} role={role} memberName={memberName} workspaceName={workspaceName} workspaceControl={workspaceControl} />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} className="absolute inset-0 h-full w-full bg-black/75 backdrop-blur-[3px]" />
          <aside id={drawerId} role="dialog" aria-modal="true" aria-label="WhatsApp console navigation" className="wg-app-sidebar absolute inset-y-0 left-0 flex w-[18rem] max-w-[88vw] flex-col py-3 shadow-2xl">
            <button type="button" onClick={() => setDrawerOpen(false)} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg border border-white/[.06] bg-white/[.035] text-white/45">
              <WhatsAppIcon name="close" className="h-4 w-4" />
              <span className="sr-only">Close navigation</span>
            </button>
            <SidebarContent senderConnected={senderConnected} senderNumber={senderNumber} role={role} memberName={memberName} workspaceName={workspaceName} workspaceControl={workspaceControl} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className={`flex min-w-0 max-w-full flex-1 flex-col ${fillsViewport ? "overflow-hidden" : ""}`}>
        <header className="wg-app-topbar sticky top-0 z-30 flex-none">
          <div className="flex min-h-[3.65rem] flex-wrap items-center gap-2 px-3 py-2 sm:px-4 lg:flex-nowrap lg:gap-3 lg:px-5">
            <button type="button" onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen} aria-controls={drawerId} className="grid h-9 w-9 place-items-center rounded-lg border border-white/[.07] bg-white/[.025] text-white/60 lg:hidden">
              <WhatsAppIcon name="menu" className="h-4.5 w-4.5" />
              <span className="sr-only">Open navigation</span>
            </button>
            <div className="lg:hidden"><Brand href={workspaceHome(role)} compact /></div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-sm font-semibold text-white/90 sm:text-[0.94rem]">{pageMeta.title}</h1>
                {workspaceName ? <span className="hidden truncate text-[0.65rem] text-white/28 sm:inline lg:hidden">/ {workspaceName}</span> : null}
              </div>
              <p className="mt-0.5 hidden truncate text-[0.68rem] text-white/30 md:block">{pageMeta.description}</p>
            </div>
            <div className="flex flex-none items-center gap-2">
              {presenceControl ?? <span className={`hidden items-center gap-1.5 rounded-md border px-2 py-1 text-[0.65rem] sm:inline-flex ${senderConnected ? "border-[#1d5f3a] bg-[#0d2919] text-[#67e59b]" : "border-white/[.07] bg-white/[.025] text-white/35"}`}><span className={`h-1.5 w-1.5 rounded-full ${senderConnected ? "bg-[#22c55e]" : "bg-white/25"}`} />{senderConnected ? "Active" : "Offline"}</span>}
              {toolbar ? <div className="min-w-0 flex-none">{toolbar}</div> : null}
            </div>
            <div id="wg-whatsapp-topbar-actions" className="order-4 flex min-w-0 basis-full items-center justify-end gap-1.5 overflow-x-auto border-t border-white/[.06] pt-2 empty:hidden lg:order-none lg:basis-auto lg:border-0 lg:pt-0" aria-label="Conversation actions" />
          </div>
        </header>
        <main className={`wg-app-content min-w-0 flex-1 ${fillsViewport ? "min-h-0 overflow-hidden" : ""}`}>{children}</main>
      </div>
      <MobileNav role={role} onMore={() => setDrawerOpen(true)} />
    </div>
  );
}
