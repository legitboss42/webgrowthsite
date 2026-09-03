"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
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

function NavRow({ item, onNavigate }: { item: WhatsAppNavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isWhatsAppNavItemActive(pathname, item.href);
  if (item.status === "soon") {
    return (
      <span aria-disabled="true" title={`${item.description} Coming in a later stage.`} className="wg-nav-row flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/30">
        <WhatsAppIcon name={item.icon} />
        <span className="truncate">{item.label}</span>
        <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-[.12em] text-white/35">Soon</span>
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : "false"}
      className={`wg-nav-row flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-ledger-tint font-semibold text-white" : "text-white/65 hover:bg-white/[.055] hover:text-white"}`}
    >
      <span className={active ? "text-ledger-bright" : "text-white/55"}><WhatsAppIcon name={item.icon} /></span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function Brand({ href, compact = false, onNavigate }: { href: string; compact?: boolean; onNavigate?: () => void }) {
  return (
    <Link href={href} onClick={onNavigate} aria-label="Web Growth WhatsApp platform" className={`flex items-center rounded-xl transition hover:bg-white/[.045] ${compact ? "gap-2 p-1" : "gap-3 px-2 py-2"}`}>
      <Image src="/images/brand/stage12-app-logo.svg" alt="" aria-hidden width={36} height={36} className="h-9 w-9 flex-none rounded-xl border border-white/10 object-cover" priority />
      {!compact ? <span className="min-w-0"><span className="block truncate text-sm font-bold text-white">Web Growth</span><span className="block truncate text-[0.61rem] font-medium text-ledger-bright">WhatsApp Business Platform</span></span> : null}
    </Link>
  );
}

function SidebarContent({ senderConnected, senderNumber, role, memberName, workspaceName, workspaceControl, onNavigate }: {
  senderConnected: boolean;
  senderNumber?: string;
  role: WhatsAppTeamRole;
  memberName: string;
  workspaceName?: string;
  workspaceControl?: ReactNode;
  onNavigate?: () => void;
}) {
  const sections = getWhatsAppNavSectionsForRole(role);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Brand href={workspaceHome(role)} onNavigate={onNavigate} />
      {workspaceControl ? <div className="mt-3">{workspaceControl}</div> : workspaceName ? <div className="mt-3 rounded-xl border border-rule bg-paper-raised px-3 py-2"><p className="truncate text-xs font-semibold text-ink">{workspaceName}</p><p className="mt-0.5 text-[0.62rem] uppercase tracking-[.12em] text-ink-faint">Workspace</p></div> : null}
      <nav aria-label="WhatsApp console" className="wg-sidebar-scroll mt-3 min-h-0 flex-1 overflow-y-auto pb-3">
        {sections.map((section) => (
          <div key={section.label} className="mb-2">
            <p className="px-3 pb-1.5 pt-3 text-[0.6rem] font-semibold uppercase tracking-[.2em] text-white/28">{section.label}</p>
            <div className="space-y-0.5">{section.items.map((item) => <NavRow key={item.label} item={item} onNavigate={onNavigate} />)}</div>
          </div>
        ))}
      </nav>
      <div className="mt-auto space-y-2 border-t border-rule pt-3">
        <div className="rounded-xl border border-rule bg-paper-raised px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-ledger-tint text-xs font-bold text-ledger-bright">{memberName.trim().slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0"><p className="truncate text-xs font-semibold text-ink">{memberName}</p><p className="mt-0.5 text-[0.6rem] uppercase tracking-[.12em] text-ink-faint">{role}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-rule bg-paper-raised px-3 py-2.5">
          <div className="flex items-center gap-2.5"><span aria-hidden="true" className={`h-2 w-2 flex-none rounded-full ${senderConnected ? "bg-ledger-bright shadow-[0_0_0_3px_rgba(22,198,90,.12)]" : "bg-white/25"}`} /><div className="min-w-0"><p className="text-[0.6rem] uppercase tracking-[.12em] text-ink-faint">{getWhatsAppSenderStatusText(senderConnected)}</p>{senderNumber ? <p className="truncate font-mono text-[0.7rem] text-ink-soft">{senderNumber}</p> : null}</div></div>
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
        return <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[0.62rem] font-medium ${active ? "text-ledger-bright" : "text-ink-faint"}`}><WhatsAppIcon name={item.icon} /><span className="max-w-full truncate">{item.label === "Conversations" ? "Inbox" : item.label}</span></Link>;
      })}
      <button type="button" onClick={onMore} className="flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[0.62rem] font-medium text-ink-faint"><WhatsAppIcon name="menu" /><span>More</span></button>
    </nav>
  );
}

export default function WhatsAppShell({ children, senderConnected, senderNumber, role, memberName, workspaceName, workspaceControl, presenceControl, toolbar }: WhatsAppShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const { title, description } = getWhatsAppPageMeta(pathname);
  const fillsViewport = getWhatsAppLayoutMode(pathname) === "fill";

  useEffect(() => { setDrawerOpen(false); }, [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [drawerOpen]);

  return (
    <div className={`wg-whatsapp-app flex text-ink ${fillsViewport ? "h-dvh overflow-hidden" : "min-h-dvh"}`}>
      <aside className="wg-app-sidebar sticky top-0 hidden h-dvh w-[15.5rem] flex-none flex-col px-3 py-3 lg:flex xl:w-64">
        <SidebarContent senderConnected={senderConnected} senderNumber={senderNumber} role={role} memberName={memberName} workspaceName={workspaceName} workspaceControl={workspaceControl} />
      </aside>

      {drawerOpen ? <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-[3px]" /><div id={drawerId} role="dialog" aria-modal="true" aria-label="WhatsApp console navigation" className="wg-app-sidebar absolute inset-y-0 left-0 flex w-[18rem] max-w-[88vw] flex-col px-3 py-3 shadow-2xl"><div className="mb-1 flex justify-end"><button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"><WhatsAppIcon name="close" /><span className="sr-only">Close navigation</span></button></div><SidebarContent senderConnected={senderConnected} senderNumber={senderNumber} role={role} memberName={memberName} workspaceName={workspaceName} workspaceControl={workspaceControl} onNavigate={() => setDrawerOpen(false)} /></div></div> : null}

      <div className={`flex min-w-0 max-w-full flex-1 flex-col ${fillsViewport ? "overflow-hidden" : ""}`}>
        <header className="wg-app-topbar sticky top-0 z-30 flex-none backdrop-blur-xl">
          <div className="flex min-h-14 items-center gap-3 px-3 py-2 sm:px-5 lg:min-h-[4.25rem] lg:px-6">
            <button type="button" onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen} aria-controls={drawerId} className="rounded-lg p-2 text-ink-soft transition hover:bg-paper-sunk hover:text-ink lg:hidden"><WhatsAppIcon name="menu" className="h-5 w-5" /><span className="sr-only">Open navigation</span></button>
            <div className="lg:hidden"><Brand href={workspaceHome(role)} compact /></div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2"><h1 className="truncate text-base font-semibold leading-tight text-ink sm:text-lg lg:text-xl">{title}</h1>{workspaceName ? <span className="hidden max-w-[15rem] truncate rounded-full border border-rule bg-paper-raised px-2 py-0.5 text-[0.62rem] font-semibold text-ink-faint sm:inline-flex lg:hidden">{workspaceName}</span> : null}</div>
              <p className="mt-0.5 hidden truncate text-xs text-ink-faint md:block">{description}</p>
            </div>
            <div className="flex flex-none items-center gap-2">{presenceControl ?? <span className={`hidden items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs sm:inline-flex ${senderConnected ? "border-ledger-bright/25 bg-ledger-tint text-ledger-bright" : "border-rule bg-paper-raised text-ink-faint"}`}><span aria-hidden="true" className={`h-2 w-2 rounded-full ${senderConnected ? "bg-ledger-bright" : "bg-ink-faint/50"}`} />{senderConnected ? "Active" : "Offline"}</span>}</div>
            {toolbar ? <div className="min-w-0 flex-none">{toolbar}</div> : null}
          </div>
        </header>
        <main className={`wg-app-content min-w-0 flex-1 ${fillsViewport ? "min-h-0 overflow-hidden" : ""}`}>{children}</main>
      </div>
      <MobileNav role={role} onMore={() => setDrawerOpen(true)} />
    </div>
  );
}
