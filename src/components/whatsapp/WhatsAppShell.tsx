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
    return <span aria-disabled="true" title={`${item.description} Coming in a later stage.`} className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/35"><WhatsAppIcon name={item.icon} /><span className="truncate">{item.label}</span><span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-[.12em] text-white/40">Soon</span></span>;
  }
  return <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-ledger-bright font-medium text-white shadow-[0_6px_16px_-8px_rgba(28,122,84,.9)]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><WhatsAppIcon name={item.icon} /><span className="truncate">{item.label}</span></Link>;
}

function SidebarContent({ senderConnected, senderNumber, role, memberName, workspaceControl, onNavigate }: {
  senderConnected: boolean; senderNumber?: string; role: WhatsAppTeamRole; memberName: string; workspaceControl?: ReactNode; onNavigate?: () => void;
}) {
  const sections = getWhatsAppNavSectionsForRole(role);
  return (
    <div className="flex h-full flex-col">
      <Link href={workspaceHome(role)} onClick={onNavigate} aria-label="Web Growth WhatsApp console" className="flex flex-col gap-1.5 rounded-lg px-2 py-2 transition hover:bg-white/5">
        <Image src="/images/brand/web-growth-logo.webp" alt="Web Growth" width={270} height={40} sizes="160px" quality={75} priority className="h-5 w-auto" />
        <span className="block text-[0.65rem] uppercase tracking-[.16em] text-white/45">WhatsApp business</span>
      </Link>
      {workspaceControl ? <div className="mt-3">{workspaceControl}</div> : null}
      <nav aria-label="WhatsApp console" className="mt-3 flex-1 overflow-y-auto pb-4">
        {sections.map((section) => <div key={section.label} className="mb-1"><p className="px-3 pb-1.5 pt-3 text-[0.625rem] font-semibold uppercase tracking-[.2em] text-white/35">{section.label}</p><div className="space-y-0.5">{section.items.map((item) => <NavRow key={item.label} item={item} onNavigate={onNavigate} />)}</div></div>)}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-3">
        <div className="mb-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"><p className="truncate text-xs font-semibold text-white/85">{memberName}</p><p className="mt-0.5 text-[0.625rem] uppercase tracking-[.14em] text-white/45">{role}</p></div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"><div className="flex items-center gap-2.5"><span aria-hidden="true" className={`h-2 w-2 flex-none rounded-full ${senderConnected ? "bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,.2)]" : "bg-white/30"}`} /><div className="min-w-0"><p className="text-[0.625rem] uppercase tracking-[.14em] text-white/45">{getWhatsAppSenderStatusText(senderConnected)}</p>{senderNumber ? <p className="truncate font-mono text-xs text-white/85">{senderNumber}</p> : null}</div></div></div>
      </div>
    </div>
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
    <div className={`flex w-full max-w-full overflow-x-hidden bg-paper text-ink lg:fixed lg:inset-0 lg:max-w-none ${fillsViewport ? "h-dvh overflow-y-hidden" : "min-h-dvh lg:min-h-0 lg:overflow-y-auto"}`}>
      <aside className="sticky top-0 hidden h-dvh w-64 flex-none flex-col bg-ledger-deep px-3 py-4 lg:flex"><SidebarContent senderConnected={senderConnected} senderNumber={senderNumber} role={role} memberName={memberName} workspaceControl={workspaceControl} /></aside>
      {drawerOpen ? <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} className="absolute inset-0 h-full w-full bg-ink/50 backdrop-blur-[2px]" /><div id={drawerId} role="dialog" aria-modal="true" aria-label="WhatsApp console navigation" className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col bg-ledger-deep px-3 py-4 shadow-2xl"><div className="mb-1 flex justify-end"><button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"><WhatsAppIcon name="close" /><span className="sr-only">Close navigation</span></button></div><SidebarContent senderConnected={senderConnected} senderNumber={senderNumber} role={role} memberName={memberName} workspaceControl={workspaceControl} onNavigate={() => setDrawerOpen(false)} /></div></div> : null}
      <div className={`flex w-0 min-w-0 max-w-full flex-1 flex-col ${fillsViewport ? "overflow-hidden" : ""}`}>
        <header className="sticky top-0 z-30 w-full max-w-full flex-none border-b border-rule bg-paper-raised/95 backdrop-blur supports-[backdrop-filter]:bg-paper-raised/80">
          <div className="flex w-full max-w-full flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
            <button type="button" onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen} aria-controls={drawerId} className="-ml-1 rounded-lg p-2 text-ink-soft transition hover:bg-paper-sunk hover:text-ink lg:hidden"><WhatsAppIcon name="menu" className="h-5 w-5" /><span className="sr-only">Open navigation</span></button>
            <Link href={workspaceHome(role)} aria-label="Web Growth WhatsApp console" className="flex-none rounded-md p-1 transition hover:bg-paper-sunk lg:hidden"><Image src="/images/brand/web-growth-logo.webp" alt="Web Growth" width={270} height={40} sizes="120px" quality={75} className="h-4 w-auto" /></Link>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h1 className="font-display text-lg font-semibold leading-tight text-ink sm:text-xl">{title}</h1>{workspaceName ? <span className="truncate rounded-full border border-rule bg-paper px-2 py-0.5 text-[0.62rem] font-semibold text-ink-faint lg:hidden">{workspaceName}</span> : null}</div><p className="mt-0.5 hidden text-xs text-ink-faint sm:block">{description}</p></div>
            <div className="flex items-center gap-2"><span className="hidden rounded-full border border-rule bg-paper px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[.08em] text-ink-faint md:inline-flex">{role}</span>{presenceControl ?? <span className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:inline-flex ${senderConnected ? "border-ledger-tint bg-ledger-tint/60 text-ledger" : "border-rule bg-paper text-ink-faint"}`}><span aria-hidden="true" className={`h-2 w-2 rounded-full ${senderConnected ? "bg-ledger-bright" : "bg-ink-faint/50"}`} />{getWhatsAppSenderStatusText(senderConnected)}</span>}</div>
            {toolbar ? <div className="w-full min-w-0 max-w-full lg:w-auto">{toolbar}</div> : null}
          </div>
        </header>
        <div className={`w-full min-w-0 max-w-full flex-1 ${fillsViewport ? "min-h-0 overflow-hidden" : ""}`}>{children}</div>
      </div>
    </div>
  );
}
