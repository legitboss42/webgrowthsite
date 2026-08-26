"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  shouldShowWhatsAppInboxNotification,
  type WhatsAppInboxNotification,
} from "@/lib/whatsapp/notifications";

/** The default when no interval is configured on the Settings page. */
export const WHATSAPP_INBOX_REFRESH_INTERVAL_MS = 10_000;

/**
 * How long the inbox will sit on unchanged data before re-reading it anyway.
 *
 * The fingerprint check means an idle inbox normally refreshes nothing, but a webhook
 * can be delayed, a status can land while the browser was asleep, and a poll response
 * can be served from a stale edge. Reconciling on this cadence means the screen cannot
 * drift away from the database indefinitely.
 */
export const WHATSAPP_INBOX_RECONCILE_INTERVAL_MS = 60_000;

type WhatsAppNotificationPermission = NotificationPermission | "unsupported";

/**
 * Clamps a configured interval to the same bounds the Settings page enforces, so a
 * hand-edited settings document cannot poll this endpoint every few milliseconds.
 */
export function resolveWhatsAppInboxRefreshMs(seconds?: number) {
  if (!Number.isFinite(seconds) || seconds === undefined) {
    return WHATSAPP_INBOX_REFRESH_INTERVAL_MS;
  }
  return Math.min(300, Math.max(5, Math.round(seconds))) * 1000;
}

/**
 * Only a hidden tab pauses the inbox.
 *
 * It used to pause while a message field was focused, to protect a half-typed reply.
 * That is no longer needed and is no longer wanted: `router.refresh()` re-renders the
 * server tree into the existing React tree, so the composer stays mounted and its
 * draft, selection, and focus all survive — and an inbox that stops receiving while
 * an agent is mid-sentence is exactly the wrong moment to stop receiving.
 */
export function shouldPauseWhatsAppInboxRefresh(input: {
  visibilityState: DocumentVisibilityState | "visible" | "hidden";
}) {
  return input.visibilityState !== "visible";
}

/**
 * Decides whether this poll should re-read the page.
 *
 * Three reasons to refresh, and nothing else: we have no baseline yet, the recent
 * thread changed, or the screen has gone too long without being reconciled against
 * the database.
 */
export function shouldRefreshWhatsAppInbox(input: {
  previousFingerprint?: string;
  fingerprint: string;
  lastRefreshAt?: number;
  now: number;
  reconcileMs?: number;
}) {
  if (input.previousFingerprint === undefined) return true;
  if (input.previousFingerprint !== input.fingerprint) return true;
  if (input.lastRefreshAt === undefined) return true;
  return input.now - input.lastRefreshAt >= (input.reconcileMs ?? WHATSAPP_INBOX_RECONCILE_INTERVAL_MS);
}

export function shouldFallbackAlertInPage(permission: WhatsAppNotificationPermission) {
  return permission !== "granted";
}

export function getWhatsAppNotificationStatusText(permission: WhatsAppNotificationPermission) {
  if (permission === "granted") return "WhatsApp alerts on";
  if (permission === "denied") return "Browser notifications are blocked. Mobile alerts will work only while this inbox is open.";
  if (permission === "unsupported") return "Browser notifications are not supported here. Keep this inbox open for in-page mobile alerts.";
  return "Enable WhatsApp alerts";
}

export default function WhatsAppInboxAutoRefresh({
  refreshSeconds,
}: {
  /** From console settings. Omitted or unusable falls back to the 10 second default. */
  refreshSeconds?: number;
} = {}) {
  const router = useRouter();
  const intervalMs = resolveWhatsAppInboxRefreshMs(refreshSeconds);
  const latestMessageIdRef = useRef<string | undefined>(undefined);
  const fingerprintRef = useRef<string | undefined>(undefined);
  const lastRefreshAtRef = useRef<number | undefined>(undefined);
  const originalTitleRef = useRef<string | undefined>(undefined);
  const [permission, setPermission] = useState<WhatsAppNotificationPermission>("unsupported");
  const [live, setLive] = useState(true);
  const [inPageAlert, setInPageAlert] = useState<WhatsAppInboxNotification | null>(null);

  useEffect(() => {
    originalTitleRef.current = document.title;
    setPermission(typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported");
  }, []);

  useEffect(() => {
    const check = async () => {
      if (shouldPauseWhatsAppInboxRefresh({ visibilityState: document.visibilityState })) return;

      let payload: { latest?: WhatsAppInboxNotification | null; fingerprint?: string };
      try {
        const response = await fetch("/api/admin/whatsapp/notifications", { cache: "no-store" });
        if (!response.ok) throw new Error(`Notification check failed: ${response.status}`);
        payload = (await response.json()) as { latest?: WhatsAppInboxNotification | null; fingerprint?: string };
      } catch {
        // Offline, asleep, or the endpoint is briefly unavailable. Nothing is recorded,
        // so the next successful poll still sees whatever changed while we were away.
        setLive(false);
        return;
      }
      setLive(true);

      const latest = payload.latest || null;
      const shouldNotify = shouldShowWhatsAppInboxNotification(latestMessageIdRef.current, latest);
      if (latest && shouldNotify && permission === "granted") {
        new Notification(latest.title, {
          body: latest.body,
          tag: latest.id,
        });
      }
      if (latest && shouldNotify && shouldFallbackAlertInPage(permission)) {
        setInPageAlert(latest);
        if (typeof navigator.vibrate === "function") navigator.vibrate([160, 80, 160]);
        document.title = `New WhatsApp lead · ${originalTitleRef.current || "Web Growth"}`;
      }
      if (latest?.id) latestMessageIdRef.current = latest.id;

      const fingerprint = typeof payload.fingerprint === "string" ? payload.fingerprint : "";
      const now = Date.now();
      const refreshNeeded = shouldRefreshWhatsAppInbox({
        previousFingerprint: fingerprintRef.current,
        fingerprint,
        lastRefreshAt: lastRefreshAtRef.current,
        now,
      });
      fingerprintRef.current = fingerprint;
      if (!refreshNeeded) return;

      lastRefreshAtRef.current = now;
      // A soft refresh: the server tree is re-rendered and reconciled into the page, so
      // the conversation list, its previews, ordering, and every delivery receipt update
      // together without the composer losing its draft.
      router.refresh();
    };

    const intervalId = window.setInterval(check, intervalMs);
    window.addEventListener("focus", check);
    // Coming back from a dropped connection or a sleeping tab: check straight away
    // rather than waiting out the rest of the interval.
    window.addEventListener("online", check);
    document.addEventListener("visibilitychange", check);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", check);
      window.removeEventListener("online", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [intervalMs, permission, router]);

  const statusText = getWhatsAppNotificationStatusText(permission);
  const reconnectingText = "Reconnecting to the WhatsApp inbox…";

  if (permission === "granted") {
    return (
      <div
        aria-live="polite"
        className={`fixed bottom-4 right-4 z-40 rounded-full border px-4 py-2 text-xs font-medium shadow-lg shadow-ink/10 ${
          live
            ? "border-ledger/15 bg-ledger-tint text-ledger"
            : "border-brass/30 bg-brass-tint text-[#6f4f16]"
        }`}
      >
        {live ? statusText : reconnectingText}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-rule bg-paper-raised p-3 text-xs text-ink shadow-xl shadow-ink/15">
      {inPageAlert ? (
        <div className="mb-3 rounded-lg border border-ledger/15 bg-ledger-tint p-3">
          <p className="font-semibold text-ledger">{inPageAlert.title}</p>
          <p className="mt-1 leading-5 text-ink-soft">{inPageAlert.body}</p>
        </div>
      ) : null}
      {live ? null : (
        <p aria-live="polite" className="mb-2 rounded-lg border border-brass/30 bg-brass-tint px-2.5 py-1.5 leading-5 text-[#6f4f16]">
          {reconnectingText}
        </p>
      )}
      <p className="leading-5 text-ink-soft">{statusText}</p>
      {permission === "default" ? (
        <button
          type="button"
          onClick={async () => {
            const nextPermission = await Notification.requestPermission();
            setPermission(nextPermission);
          }}
          className="mt-3 rounded-full bg-ledger-bright px-4 py-2 text-xs font-semibold text-white transition hover:bg-ledger"
        >
          Enable WhatsApp alerts
        </button>
      ) : null}
    </div>
  );
}
