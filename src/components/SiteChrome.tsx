"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * The marketing header/footer wrap every route from the root layout. The internal
 * consoles under /admin are full-height app surfaces with their own chrome, so the
 * public site furniture is hidden there (and the header's top offset dropped).
 */
export function isConsoleRoute(pathname: string | null | undefined) {
  if (!pathname) return false;
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Renders children only on public routes. */
export function PublicChromeOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isConsoleRoute(pathname) ? null : <>{children}</>;
}

/** The shared <main> landmark; consoles opt out of the marketing header offset. */
export function SiteMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <main id="main-content" tabIndex={-1} className={isConsoleRoute(pathname) ? undefined : "pt-28"}>
      {children}
    </main>
  );
}
