"use client";

import type { ShellSummary } from "@/lib/whatsapp/admin/shell";
import { ChevronRightIcon, WhatsAppGlyphIcon } from "./icons";
import SidebarNav from "./SidebarNav";

type WhatsAppSidebarProps = {
  summary: ShellSummary;
  pathname: string;
  /** `rail` is the persistent desktop column, `drawer` is the mobile overlay. */
  variant?: "rail" | "drawer";
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
};

const NUMBER_STATE: Record<ShellSummary["number"]["state"], { dot: string; fallback: string }> = {
  connected: { dot: "bg-ledger-tint", fallback: "Number connected" },
  unknown: { dot: "bg-brass", fallback: "Status unavailable" },
  "not-configured": { dot: "bg-on-dark-soft", fallback: "No number connected" },
};

/**
 * The module column: which WhatsApp account you are working inside, the
 * navigation for it, and a collapse control.
 *
 * The account block sits here rather than in the topbar on purpose. The topbar
 * belongs to the platform, the sidebar belongs to the module, so adding an Email
 * or SMS module later means adding a sidebar, not rebuilding the shell.
 */
export default function WhatsAppSidebar({
  summary,
  pathname,
  variant = "rail",
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
}: WhatsAppSidebarProps) {
  const isDrawer = variant === "drawer";
  const isCollapsed = collapsed && !isDrawer;
  const state = NUMBER_STATE[summary.number.state];
  const businessName = summary.number.verifiedName ?? "WhatsApp Business";
  const numberLine = summary.number.display ?? state.fallback;

  return (
    <div
      className={[
        "flex h-full flex-col bg-ledger text-on-dark",
        isDrawer ? "w-[17rem]" : "border-r border-white/10 transition-[width] duration-150",
        isCollapsed ? "w-[3.75rem]" : isDrawer ? "" : "w-60",
      ].join(" ")}
    >
      {/* Connected account. One glyph, one name, one number, one status dot. */}
      <div
        className={[
          "flex shrink-0 items-center gap-2.5 border-b border-white/10 py-3",
          isCollapsed ? "justify-center px-2" : "px-3",
        ].join(" ")}
      >
        <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-ledger-tint">
          <WhatsAppGlyphIcon className="h-[1.125rem] w-[1.125rem]" />
          <span
            aria-hidden="true"
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ledger ${state.dot}`}
          />
        </span>

        {isCollapsed ? (
          <span className="sr-only">
            {businessName}. {numberLine}.
          </span>
        ) : (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium leading-tight text-white">{businessName}</span>
            <span className="block truncate font-mono text-[0.6875rem] leading-tight text-ledger-tint/70">
              {numberLine}
            </span>
          </span>
        )}
      </div>

      <SidebarNav
        pathname={pathname}
        collapsed={isCollapsed}
        needsReview={summary.needsReview}
        onNavigate={onNavigate}
      />

      {!isDrawer && onToggleCollapsed ? (
        <div className="shrink-0 border-t border-white/10 p-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={!isCollapsed}
            className={[
              "flex w-full items-center gap-3 rounded-lg py-2 text-xs text-ledger-tint/70 outline-none transition-colors hover:bg-white/8 hover:text-white",
              "focus-visible:ring-2 focus-visible:ring-ledger-tint focus-visible:ring-offset-2 focus-visible:ring-offset-ledger",
              isCollapsed ? "justify-center px-2" : "px-3",
            ].join(" ")}
          >
            <ChevronRightIcon
              className={`h-4 w-4 shrink-0 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
            />
            {isCollapsed ? null : <span>Collapse</span>}
            <span className="sr-only">{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
