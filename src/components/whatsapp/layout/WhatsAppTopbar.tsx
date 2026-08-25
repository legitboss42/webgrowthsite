"use client";

import Link from "next/link";
import type { ShellSummary } from "@/lib/whatsapp/admin/shell";
import { CloseIcon, LockIcon, MenuIcon } from "./icons";

type WhatsAppTopbarProps = {
  summary: ShellSummary;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
};

type Health = {
  label: string;
  hint: string;
  dot: string;
  text: string;
};

/**
 * Reduces the environment and Meta responses to one honest sentence about
 * whether the integration is actually working. Nothing here is optimistic: a
 * missing credential reads as missing, and a silent Graph API reads as degraded
 * rather than healthy.
 */
function readHealth(summary: ShellSummary): Health {
  const { api, database, webhook } = summary.integration;

  if (!api && !database) {
    return {
      label: "Not configured",
      hint: "No WhatsApp credentials or database URL in this environment.",
      dot: "bg-on-dark-soft",
      text: "text-ledger-tint/70",
    };
  }

  const missing = [!api && "API credentials", !database && "database", !webhook && "webhook secrets"]
    .filter(Boolean)
    .join(", ");

  if (missing) {
    return {
      label: "Partly configured",
      hint: `Missing: ${missing}.`,
      dot: "bg-brass",
      text: "text-brass-tint",
    };
  }

  if (summary.number.state === "unknown") {
    return {
      label: "Meta unreachable",
      hint: "Credentials are present but Meta did not answer the last status check.",
      dot: "bg-brass",
      text: "text-brass-tint",
    };
  }

  return {
    label: "Connected",
    hint: "Credentials, database and webhook secrets are all present.",
    dot: "bg-ledger-tint",
    text: "text-ledger-tint",
  };
}

/**
 * Full-width bar above both the sidebar and the content, per the platform shell
 * brief. It carries the product lockup, the live integration state and the admin
 * identity, so those three answers are on screen from every route.
 */
export default function WhatsAppTopbar({ summary, drawerOpen, onToggleDrawer }: WhatsAppTopbarProps) {
  const health = readHealth(summary);

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-ledger-deep px-3 sm:px-4">
      <button
        type="button"
        onClick={onToggleDrawer}
        aria-expanded={drawerOpen}
        aria-controls="whatsapp-nav-drawer"
        className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ledger-tint outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-ledger-tint lg:hidden"
      >
        {drawerOpen ? <CloseIcon /> : <MenuIcon />}
        <span className="sr-only">{drawerOpen ? "Close navigation" : "Open navigation"}</span>
      </button>

      {/* Product lockup. "Web Growth" is the company, "Automation" is the
          platform the WhatsApp module lives inside, which is why the module name
          sits in the sidebar rather than here. */}
      <Link
        href="/admin/whatsapp/overview/"
        className="flex min-w-0 items-center gap-2.5 rounded-lg py-1 pr-2 outline-none focus-visible:ring-2 focus-visible:ring-ledger-tint"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-ledger-tint font-display text-sm font-semibold leading-none text-ledger-deep">
          W
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold leading-tight text-white">Web Growth</span>
          <span className="block truncate font-mono text-[0.5625rem] uppercase leading-tight tracking-[0.18em] text-ledger-tint/70">
            Automation
          </span>
        </span>
      </Link>

      <div className="ml-auto flex min-w-0 items-center gap-2">
        {/* Integration health. Carries a dot and a word, never colour alone. */}
        <span
          title={health.hint}
          className="flex items-center gap-2 rounded-full border border-white/12 px-2.5 py-1.5"
        >
          <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${health.dot}`} />
          <span className={`hidden font-mono text-[0.625rem] uppercase tracking-[0.1em] sm:inline ${health.text}`}>
            {health.label}
          </span>
          <span className="sr-only">Integration status: {health.label}. {health.hint}</span>
        </span>

        {/* Admin identity. This platform has no per-user accounts yet, so it
            names the access path it actually authenticated, not a person. */}
        <span
          title="Signed in through the internal admin gate"
          className="flex items-center gap-2 rounded-full border border-white/12 px-2.5 py-1.5 text-ledger-tint"
        >
          <LockIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden text-xs font-medium sm:inline">Internal access</span>
          <span className="sr-only">Signed in with internal admin access</span>
        </span>
      </div>
    </header>
  );
}
