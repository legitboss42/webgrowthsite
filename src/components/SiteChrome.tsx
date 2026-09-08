"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const CONTENT_AUTOMATION_ROUTE = "/admin/content-automation";

/**
 * The marketing header/footer wrap every route from the root layout. Internal app
 * and auth surfaces need their own full-height presentation, so the public site
 * furniture is hidden there (and the header's top offset dropped).
 */
export function isConsoleRoute(pathname: string | null | undefined) {
  if (!pathname) return false;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  return pathname === "/whatsapp/set-password" || pathname.startsWith("/whatsapp/set-password/");
}

export function isContentAutomationRoute(pathname: string | null | undefined) {
  if (!pathname) return false;
  return pathname === CONTENT_AUTOMATION_ROUTE || pathname.startsWith(`${CONTENT_AUTOMATION_ROUTE}/`);
}

export function showsSiteHeader(pathname: string | null | undefined) {
  return !isConsoleRoute(pathname) || isContentAutomationRoute(pathname);
}

/** The public header also stays available on the standalone Content Automation console. */
export function SiteHeaderOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return showsSiteHeader(pathname) ? <>{children}</> : null;
}

/** Renders children only on public routes. Internal consoles keep their footer hidden. */
export function PublicChromeOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isConsoleRoute(pathname) ? null : <>{children}</>;
}

/** The shared <main> landmark; surfaces with the fixed site header retain its top offset. */
export function SiteMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <main id="main-content" tabIndex={-1} className={showsSiteHeader(pathname) ? "pt-28" : undefined}>
      {children}
    </main>
  );
}
