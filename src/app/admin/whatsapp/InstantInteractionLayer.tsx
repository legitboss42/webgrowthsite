"use client";

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function InstantInteractionLayer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    document.documentElement.classList.add("whatsapp-instant-ui");
    return () => document.documentElement.classList.remove("whatsapp-instant-ui");
  }, []);

  useEffect(() => {
    setNavigating(false);
  }, [routeKey]);

  function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = event.target as Element | null;
    const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    if (!destination.pathname.startsWith("/admin/whatsapp")) return;

    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const next = `${destination.pathname}${destination.search}${destination.hash}`;
    if (current === next) return;

    setNavigating(true);
  }

  return (
    <div className="contents" onClickCapture={handleClickCapture}>
      {navigating ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden bg-ledger-tint"
        >
          <span className="block h-full w-full animate-pulse bg-ledger-bright" />
        </div>
      ) : null}

      <style jsx global>{`
        .whatsapp-instant-ui a,
        .whatsapp-instant-ui button,
        .whatsapp-instant-ui [role="button"],
        .whatsapp-instant-ui input[type="checkbox"],
        .whatsapp-instant-ui input[type="radio"],
        .whatsapp-instant-ui select {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        @media (hover: none) and (pointer: coarse) {
          .whatsapp-instant-ui a:active,
          .whatsapp-instant-ui button:not(:disabled):active,
          .whatsapp-instant-ui [role="button"]:active,
          .whatsapp-instant-ui input[type="checkbox"]:active,
          .whatsapp-instant-ui input[type="radio"]:active,
          .whatsapp-instant-ui select:active {
            opacity: 0.7;
            transition: opacity 35ms linear !important;
          }
        }
      `}</style>
    </div>
  );
}
