"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { ShellSummary } from "@/lib/whatsapp/admin/shell";
import WhatsAppSidebar from "./WhatsAppSidebar";
import WhatsAppTopbar from "./WhatsAppTopbar";

const COLLAPSE_KEY = "wa-admin-sidebar-collapsed";

type WhatsAppShellProps = {
  summary: ShellSummary;
  children: React.ReactNode;
};

/**
 * Application frame for every `/admin/whatsapp` route.
 *
 * Owns the two pieces of chrome state that have to survive navigation: the
 * mobile drawer and the desktop collapse. Everything else about the shell is
 * server-rendered and passed in, so no page data is fetched on the client.
 *
 * The frame is a fixed-height column and only the content region scrolls. That
 * is what lets the conversation inbox pin its own list and composer without the
 * whole page moving under them.
 */
export default function WhatsAppShell({ summary, children }: WhatsAppShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Read after mount rather than during render: touching localStorage in the
  // render pass would make the server and client markup disagree.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // Private browsing or a blocked storage partition. Stay expanded.
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // Preference simply does not persist. Not worth surfacing.
      }
      return next;
    });
  }, []);

  const openDrawer = useCallback(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    restoreFocusRef.current?.focus();
    restoreFocusRef.current = null;
  }, []);

  const toggleDrawer = useCallback(() => {
    if (drawerOpen) closeDrawer();
    else openDrawer();
  }, [closeDrawer, drawerOpen, openDrawer]);

  // A route change means the drawer has done its job.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    drawerRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeDrawer, drawerOpen]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper-raised text-ink">
      {/* The site-wide skip link lands at the top of this shell. This one skips
          the eleven navigation rows as well. */}
      <a href="#whatsapp-content" className="skip-link">
        Skip to page content
      </a>

      <WhatsAppTopbar summary={summary} drawerOpen={drawerOpen} onToggleDrawer={toggleDrawer} />

      <div className="flex min-h-0 flex-1">
        <div className="hidden shrink-0 lg:flex">
          <WhatsAppSidebar
            summary={summary}
            pathname={pathname}
            variant="rail"
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
          />
        </div>

        <main id="whatsapp-content" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            onClick={closeDrawer}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 bg-ink/50"
          />
          <div
            ref={drawerRef}
            id="whatsapp-nav-drawer"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 shadow-2xl outline-none"
          >
            <WhatsAppSidebar
              summary={summary}
              pathname={pathname}
              variant="drawer"
              onNavigate={closeDrawer}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
