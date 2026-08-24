"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  shouldShowWhatsAppInboxNotification,
  type WhatsAppInboxNotification,
} from "@/lib/whatsapp/notifications";

export const WHATSAPP_INBOX_REFRESH_INTERVAL_MS = 10_000;
type WhatsAppNotificationPermission = NotificationPermission | "unsupported";

export function shouldPauseWhatsAppInboxRefresh(input: {
  visibilityState: DocumentVisibilityState | "visible" | "hidden";
  activeTagName?: string | null;
}) {
  if (input.visibilityState !== "visible") return true;
  return input.activeTagName === "TEXTAREA" || input.activeTagName === "INPUT";
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

export default function WhatsAppInboxAutoRefresh() {
  const router = useRouter();
  const latestMessageIdRef = useRef<string | undefined>(undefined);
  const originalTitleRef = useRef<string | undefined>(undefined);
  const [permission, setPermission] = useState<WhatsAppNotificationPermission>("unsupported");
  const [inPageAlert, setInPageAlert] = useState<WhatsAppInboxNotification | null>(null);

  useEffect(() => {
    originalTitleRef.current = document.title;
    setPermission(typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported");
  }, []);

  useEffect(() => {
    const refresh = async () => {
      const activeTagName = document.activeElement?.tagName || null;
      if (shouldPauseWhatsAppInboxRefresh({ visibilityState: document.visibilityState, activeTagName })) return;

      try {
        const response = await fetch("/api/admin/whatsapp/notifications", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as { latest?: WhatsAppInboxNotification | null };
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
      } catch {
        // A failed notification check should not stop the inbox from refreshing.
      }

      router.refresh();
    };

    const intervalId = window.setInterval(refresh, WHATSAPP_INBOX_REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [permission, router]);

  const statusText = getWhatsAppNotificationStatusText(permission);

  if (permission === "granted") {
    return (
      <div className="fixed bottom-4 right-4 z-40 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-100 shadow-lg shadow-black/25">
        {statusText}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#07110c] p-3 text-xs text-white shadow-lg shadow-black/30">
      {inPageAlert ? (
        <div className="mb-3 rounded-xl border border-emerald-400/25 bg-emerald-500/15 p-3">
          <p className="font-semibold text-emerald-100">{inPageAlert.title}</p>
          <p className="mt-1 text-white/70">{inPageAlert.body}</p>
        </div>
      ) : null}
      <p className="text-white/65">{statusText}</p>
      {permission === "default" ? (
        <button
          type="button"
          onClick={async () => {
            const nextPermission = await Notification.requestPermission();
            setPermission(nextPermission);
          }}
          className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-emerald-100"
        >
          Enable WhatsApp alerts
        </button>
      ) : null}
    </div>
  );
}
