"use client";

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function InstantInteractionLayer() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const conversationsRoute = pathname?.startsWith("/admin/whatsapp/conversations") ?? false;
  const hasSelectedConversation = Boolean(searchParams.get("lead"));
  const detailsOpen = searchParams.get("panel") === "contact";

  useEffect(() => {
    document.documentElement.classList.add("whatsapp-instant-ui");
    return () => document.documentElement.classList.remove("whatsapp-instant-ui");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("whatsapp-conversations-ui", conversationsRoute);
    return () => document.documentElement.classList.remove("whatsapp-conversations-ui");
  }, [conversationsRoute]);

  useEffect(() => {
    document.documentElement.classList.toggle("whatsapp-details-open", conversationsRoute && detailsOpen);
    return () => document.documentElement.classList.remove("whatsapp-details-open");
  }, [conversationsRoute, detailsOpen]);

  useEffect(() => {
    setNavigating(false);
  }, [routeKey]);

  function replaceConversationQuery(mutator: (query: URLSearchParams) => void) {
    const query = new URLSearchParams(searchParams.toString());
    mutator(query);
    const suffix = query.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname || "/admin/whatsapp/conversations/", { scroll: false });
  }

  function closeDesktopDetails() {
    replaceConversationQuery((query) => query.delete("panel"));
  }

  useEffect(() => {
    if (!conversationsRoute || !hasSelectedConversation) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (!window.matchMedia("(min-width: 1024px)").matches) return;

      const target = event.target as HTMLElement | null;
      const editable = target?.matches("input, textarea, select, [contenteditable='true']") || target?.isContentEditable;
      if (editable) return;

      event.preventDefault();
      if (detailsOpen) {
        closeDesktopDetails();
        return;
      }

      replaceConversationQuery((query) => {
        query.delete("lead");
        query.delete("panel");
      });
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [conversationsRoute, detailsOpen, hasSelectedConversation, pathname, router, searchParams]);

  function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target as Element | null;
    const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin !== window.location.origin || !destination.pathname.startsWith("/admin/whatsapp")) return;

    if (
      conversationsRoute &&
      detailsOpen &&
      destination.searchParams.get("panel") === "contact" &&
      window.matchMedia("(min-width: 1024px)").matches
    ) {
      event.preventDefault();
      closeDesktopDetails();
      return;
    }

    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const next = `${destination.pathname}${destination.search}${destination.hash}`;
    if (current !== next) setNavigating(true);
  }

  return (
    <div className="contents" onClickCapture={handleClickCapture}>
      {navigating ? (
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden bg-ledger-tint">
          <span className="block h-full w-full animate-pulse bg-ledger-bright" />
        </div>
      ) : null}

      {conversationsRoute && !hasSelectedConversation ? (
        <div className="pointer-events-none fixed bottom-0 left-[calc(16rem+20rem)] right-0 top-[4.5rem] z-20 hidden items-center justify-center bg-paper lg:flex xl:left-[calc(16rem+22rem)]">
          <div className="max-w-sm px-8 text-center">
            <Image src="/images/brand/web-growth-logo.webp" alt="Web Growth" width={270} height={40} sizes="220px" quality={75} className="mx-auto h-auto w-52 opacity-70" />
            <p className="mt-5 text-sm font-medium text-ink-soft">Web Growth WhatsApp</p>
            <p className="mt-1 text-xs leading-5 text-ink-faint">Select a conversation to read messages and reply.</p>
          </div>
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

        html.whatsapp-conversations-ui,
        html.whatsapp-conversations-ui body {
          height: 100%;
          overflow: hidden;
          overscroll-behavior: none;
        }

        @media (min-width: 1024px) {
          html.whatsapp-conversations-ui:not(.whatsapp-details-open) aside[class*="lg:w-72"] {
            display: none !important;
          }

          html.whatsapp-conversations-ui a[href*="panel=contact"] {
            display: inline-flex !important;
          }

          html.whatsapp-details-open a[href*="panel=contact"] {
            border-color: var(--ledger-bright);
            color: var(--ledger);
            background: var(--ledger-tint);
          }
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
