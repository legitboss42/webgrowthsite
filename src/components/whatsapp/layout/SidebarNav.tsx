"use client";

import Link from "next/link";
import { findActiveNavHref, WHATSAPP_NAV } from "./nav";

type SidebarNavProps = {
  pathname: string;
  /** Icon-only rail. Labels stay in the accessible name via `title`/sr-only. */
  collapsed?: boolean;
  needsReview: number | null;
  /** Called after a link activates, so the mobile drawer can close itself. */
  onNavigate?: () => void;
};

/**
 * The navigation list itself, shared by the desktop rail and the mobile drawer so
 * the two can never drift apart.
 *
 * Colour notes: inactive rows use `ledger-tint/70`, which composites to roughly
 * #9fb8ac on the `ledger` ground for a 4.8:1 contrast ratio. Active rows go to
 * white (8.5:1) and add both a tinted background and a left marker, so the active
 * state is never carried by colour alone.
 */
export default function SidebarNav({
  pathname,
  collapsed = false,
  needsReview,
  onNavigate,
}: SidebarNavProps) {
  const active = findActiveNavHref(pathname);

  return (
    <nav aria-label="WhatsApp platform" className="flex-1 overflow-y-auto px-2 py-3">
      {WHATSAPP_NAV.map((group) => (
        <div key={group.label ?? "primary"} className="mb-1 last:mb-0">
          {group.label ? (
            collapsed ? (
              <div className="mx-2 my-2 border-t border-white/10" role="presentation" />
            ) : (
              <h2 className="px-3 pb-1 pt-4 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ledger-tint/70">
                {group.label}
              </h2>
            )
          ) : null}

          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = active === item.href;
              const badgeCount = item.badge === "review" ? needsReview : null;
              const showBadge = typeof badgeCount === "number" && badgeCount > 0;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={[
                      "group relative flex items-center gap-3 rounded-lg py-2 text-sm outline-none transition-colors",
                      collapsed ? "justify-center px-2" : "px-3",
                      isActive
                        ? "bg-white/12 font-medium text-white"
                        : "text-ledger-tint/70 hover:bg-white/8 hover:text-white",
                      "focus-visible:ring-2 focus-visible:ring-ledger-tint focus-visible:ring-offset-2 focus-visible:ring-offset-ledger",
                    ].join(" ")}
                  >
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-ledger-tint"
                      />
                    ) : null}

                    <item.icon className="h-[1.125rem] w-[1.125rem] shrink-0" />

                    {collapsed ? (
                      <span className="sr-only">{item.label}</span>
                    ) : (
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    )}

                    {showBadge ? (
                      <span
                        className={[
                          "shrink-0 rounded-full bg-brass font-mono text-[0.625rem] font-semibold leading-none text-ink",
                          collapsed
                            ? "absolute right-1 top-1 px-1 py-0.5"
                            : "px-1.5 py-1",
                        ].join(" ")}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                        <span className="sr-only"> conversations need review</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
