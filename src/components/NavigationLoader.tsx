"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import LoaderBrand from "@/components/LoaderBrand";

const MIN_VISIBLE_MS = 700;
const MAX_VISIBLE_MS = 6000;
const NAVIGATION_START_DELAY_MS = 180;

export default function NavigationLoader() {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const startedAtRef = useRef<number | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHrefRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    function finishInitialLoad() {
      if (initialLoadDoneRef.current) return;
      initialLoadDoneRef.current = true;

      const startedAt = startedAtRef.current;
      const elapsed = startedAt ? Date.now() - startedAt : 0;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

      window.setTimeout(() => {
        setVisible(false);
        startedAtRef.current = null;
      }, remaining);
    }

    startedAtRef.current = Date.now();

    if (document.readyState === "complete") {
      finishInitialLoad();
      return;
    }

    window.addEventListener("load", finishInitialLoad, { once: true });

    return () => {
      window.removeEventListener("load", finishInitialLoad);
    };
  }, []);

  useEffect(() => {
    if (!initialLoadDoneRef.current) return;

    function clearTimers() {
      if (maxTimerRef.current) {
        clearTimeout(maxTimerRef.current);
        maxTimerRef.current = null;
      }
    }

    function hideLoader() {
      const startedAt = startedAtRef.current;

      if (!startedAt) {
        setVisible(false);
        return;
      }

      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

      window.setTimeout(() => {
        setVisible(false);
        startedAtRef.current = null;
      }, remaining);
    }

    hideLoader();
    clearTimers();

    return clearTimers;
  }, [pathname]);

  useEffect(() => {
    function clearTimers() {
      if (maxTimerRef.current) {
        clearTimeout(maxTimerRef.current);
        maxTimerRef.current = null;
      }
    }

    function showLoader() {
      startedAtRef.current = Date.now();
      flushSync(() => {
        setVisible(true);
      });
      clearTimers();
      maxTimerRef.current = setTimeout(() => {
        setVisible(false);
        startedAtRef.current = null;
      }, MAX_VISIBLE_MS);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      const samePath = url.pathname === currentPath;
      const sameSearch = url.search === currentSearch;

      if (samePath && sameSearch) return;

      event.preventDefault();
      if (pendingHrefRef.current === url.href) return;

      pendingHrefRef.current = url.href;
      showLoader();

      window.setTimeout(() => {
        const pendingHref = pendingHrefRef.current;
        if (!pendingHref) return;

        pendingHrefRef.current = null;

        const nextUrl = new URL(pendingHref, window.location.href);
        const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
        router.push(nextPath);
      }, NAVIGATION_START_DELAY_MS);
    }

    function handlePageShow() {
      setVisible(false);
      startedAtRef.current = null;
      pendingHrefRef.current = null;
      clearTimers();
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("pageshow", handlePageShow);
      clearTimers();
    };
  }, [router]);

  return (
    <div
      className={[
        "nav-loader-overlay",
        visible ? "nav-loader-overlay-visible" : "nav-loader-overlay-hidden",
      ].join(" ")}
      aria-hidden={visible ? "false" : "true"}
    >
      <LoaderBrand />
    </div>
  );
}
