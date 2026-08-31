"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  shouldShowWhatsAppInboxNotification,
  type WhatsAppInboxNotification,
} from "@/lib/whatsapp/notifications";

export const WHATSAPP_INBOX_REFRESH_INTERVAL_MS = 10_000;
export const WHATSAPP_INBOX_RECONCILE_INTERVAL_MS = 60_000;

type WhatsAppNotificationPermission = NotificationPermission | "unsupported";
type PushStatus = "checking" | "available" | "subscribed" | "unsupported" | "ios-install-required" | "error";

export function resolveWhatsAppInboxRefreshMs(seconds?: number) {
  if (!Number.isFinite(seconds) || seconds === undefined) return WHATSAPP_INBOX_REFRESH_INTERVAL_MS;
  return Math.min(300, Math.max(5, Math.round(seconds))) * 1000;
}

export function shouldPauseWhatsAppInboxRefresh(input: {
  visibilityState: DocumentVisibilityState | "visible" | "hidden";
}) {
  return input.visibilityState !== "visible";
}

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
  if (permission === "denied") return "Browser notifications are blocked. In-page alerts still work while this inbox is open.";
  if (permission === "unsupported") return "Browser notifications are not supported here. Keep this inbox open for in-page alerts.";
  return "Enable WhatsApp alerts";
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function supportsPush() {
  return typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;
}

function isIosHomeScreenRequired() {
  if (typeof window === "undefined") return false;
  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isIos) return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
  return !standalone;
}

async function persistSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const response = await fetch("/api/admin/whatsapp/push-subscriptions/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });
  if (!response.ok) throw new Error("Push subscription could not be saved.");
}

function NotificationBellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

export default function WhatsAppInboxAutoRefresh({
  refreshSeconds,
}: {
  refreshSeconds?: number;
} = {}) {
  const router = useRouter();
  const intervalMs = resolveWhatsAppInboxRefreshMs(refreshSeconds);
  const latestMessageIdRef = useRef<string | undefined>(undefined);
  const fingerprintRef = useRef<string | undefined>(undefined);
  const lastRefreshAtRef = useRef<number | undefined>(undefined);
  const originalTitleRef = useRef<string | undefined>(undefined);
  const [permission, setPermission] = useState<WhatsAppNotificationPermission>("unsupported");
  const [pushStatus, setPushStatus] = useState<PushStatus>("checking");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [live, setLive] = useState(true);
  const [inPageAlert, setInPageAlert] = useState<WhatsAppInboxNotification | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    originalTitleRef.current = document.title;
    setPermission("Notification" in window ? Notification.permission : "unsupported");

    if (isIosHomeScreenRequired()) {
      setPushStatus("ios-install-required");
      return;
    }
    if (!supportsPush()) {
      setPushStatus("unsupported");
      return;
    }

    let cancelled = false;
    void navigator.serviceWorker
      .register("/whatsapp-sw.js", { scope: "/" })
      .then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        if (cancelled) return;
        if (!subscription) {
          setPushStatus("available");
          return;
        }
        await persistSubscription(subscription);
        if (!cancelled) setPushStatus("subscribed");
      })
      .catch(() => {
        if (!cancelled) setPushStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function enableBackgroundPush() {
    setPushError(null);
    if (isIosHomeScreenRequired()) {
      setPushStatus("ios-install-required");
      return;
    }
    if (!supportsPush()) {
      setPushStatus("unsupported");
      return;
    }

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") return;

      const registration = await navigator.serviceWorker.register("/whatsapp-sw.js", { scope: "/" });
      const keyResponse = await fetch("/api/admin/whatsapp/push-public-key/", { cache: "no-store" });
      const keyPayload = (await keyResponse.json().catch(() => ({}))) as { publicKey?: string; error?: string };
      if (!keyResponse.ok || !keyPayload.publicKey) {
        throw new Error(keyPayload.error || "Push notifications are not ready yet.");
      }

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyPayload.publicKey),
        }));
      await persistSubscription(subscription);
      setPushStatus("subscribed");
    } catch (error) {
      setPushStatus("error");
      setPushError(error instanceof Error ? error.message : "Could not enable background notifications.");
    }
  }

  useEffect(() => {
    const check = async () => {
      if (shouldPauseWhatsAppInboxRefresh({ visibilityState: document.visibilityState })) return;

      let payload: {
        latest?: WhatsAppInboxNotification | null;
        fingerprint?: string;
        alertsEnabled?: boolean;
      };
      try {
        const response = await fetch("/api/admin/whatsapp/notifications", { cache: "no-store" });
        if (!response.ok) throw new Error(`Notification check failed: ${response.status}`);
        payload = (await response.json()) as typeof payload;
      } catch {
        setLive(false);
        return;
      }
      setLive(true);
      const enabled = payload.alertsEnabled !== false;
      setAlertsEnabled(enabled);
      if (!enabled) setInPageAlert(null);

      const latest = enabled ? payload.latest || null : null;
      const shouldNotify = shouldShowWhatsAppInboxNotification(latestMessageIdRef.current, latest);
      // When Web Push is subscribed the service worker owns system notifications, which
      // prevents a foreground poll and a background push from showing the same message twice.
      if (latest && shouldNotify && permission === "granted" && pushStatus !== "subscribed") {
        new Notification(latest.title, { body: latest.body, tag: latest.id });
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
      router.refresh();
    };

    void check();
    const intervalId = window.setInterval(check, intervalMs);
    window.addEventListener("focus", check);
    window.addEventListener("online", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", check);
      window.removeEventListener("online", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [intervalMs, permission, pushStatus, router]);

  const reconnectingText = "Reconnecting to the WhatsApp inbox…";

  if (!alertsEnabled) {
    return (
      <div className="fixed bottom-4 right-4 z-40 max-w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-rule bg-paper-raised p-3 text-xs text-ink shadow-xl shadow-ink/15">
        <p className="font-semibold text-ink">New message alerts are off</p>
        <p className="mt-1 leading-5 text-ink-soft">Turn them on in Quick Settings to receive desktop and mobile notifications.</p>
        <Link href="/admin/whatsapp/settings/" className="mt-2 inline-block font-semibold text-ledger hover:underline">Open Quick Settings</Link>
      </div>
    );
  }

  if (pushStatus === "subscribed" && permission === "granted") {
    const statusText = live ? "Background WhatsApp alerts are on" : reconnectingText;
    return (
      <button
        type="button"
        onClick={() => router.push("/admin/whatsapp/settings/")}
        aria-label={`${statusText}. Open notification settings.`}
        title={`${statusText}. Open notification settings.`}
        className={`fixed bottom-4 right-4 z-40 grid h-11 w-11 place-items-center rounded-full border shadow-lg shadow-ink/10 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40 ${
          live
            ? "border-ledger/20 bg-ledger-bright text-white hover:bg-ledger"
            : "border-brass/30 bg-brass-tint text-[#6f4f16]"
        }`}
      >
        <NotificationBellIcon />
        <span
          aria-hidden="true"
          className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-paper-raised ${
            live ? "bg-emerald-300" : "bg-brass"
          }`}
        />
      </button>
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
      {!live ? (
        <p aria-live="polite" className="mb-2 rounded-lg border border-brass/30 bg-brass-tint px-2.5 py-1.5 leading-5 text-[#6f4f16]">
          {reconnectingText}
        </p>
      ) : null}

      {pushStatus === "ios-install-required" ? (
        <>
          <p className="font-semibold text-ink">Install Web Growth for iPhone alerts</p>
          <p className="mt-1 leading-5 text-ink-soft">In Safari, use Share → Add to Home Screen. Open the installed Web Growth app, then enable notifications there.</p>
        </>
      ) : pushStatus === "unsupported" ? (
        <p className="leading-5 text-ink-soft">{getWhatsAppNotificationStatusText(permission)}</p>
      ) : permission === "denied" ? (
        <p className="leading-5 text-ink-soft">Browser notifications are blocked for Web Growth. Allow them in your browser/site settings, then return here.</p>
      ) : (
        <>
          <p className="font-semibold text-ink">Enable background WhatsApp alerts</p>
          <p className="mt-1 leading-5 text-ink-soft">Receive new-message notifications on this device even when Web Growth is closed.</p>
          <button
            type="button"
            onClick={enableBackgroundPush}
            disabled={pushStatus === "checking"}
            className="mt-3 rounded-full bg-ledger-bright px-4 py-2 text-xs font-semibold text-white transition hover:bg-ledger disabled:cursor-wait disabled:opacity-60"
          >
            {pushStatus === "checking" ? "Checking…" : "Enable background alerts"}
          </button>
        </>
      )}
      {pushError ? <p className="mt-2 text-rose-700">{pushError}</p> : null}
    </div>
  );
}
