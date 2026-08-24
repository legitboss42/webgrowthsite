"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  shouldShowWhatsAppInboxNotification,
  type WhatsAppInboxNotification,
} from "@/lib/whatsapp/notifications";

export const WHATSAPP_INBOX_REFRESH_INTERVAL_MS = 10_000;

export function shouldPauseWhatsAppInboxRefresh(input: {
  visibilityState: DocumentVisibilityState | "visible" | "hidden";
  activeTagName?: string | null;
}) {
  if (input.visibilityState !== "visible") return true;
  return input.activeTagName === "TEXTAREA" || input.activeTagName === "INPUT";
}

export default function WhatsAppInboxAutoRefresh() {
  const router = useRouter();
  const latestMessageIdRef = useRef<string | undefined>(undefined);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");

  useEffect(() => {
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

  if (permission === "unsupported") return null;

  if (permission === "granted") {
    return (
      <div className="fixed bottom-4 right-4 z-40 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-100 shadow-lg shadow-black/25">
        WhatsApp alerts on
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        const nextPermission = await Notification.requestPermission();
        setPermission(nextPermission);
      }}
      className="fixed bottom-4 right-4 z-40 rounded-full border border-white/10 bg-white px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-black/25 transition hover:bg-emerald-100"
    >
      Enable WhatsApp alerts
    </button>
  );
}
