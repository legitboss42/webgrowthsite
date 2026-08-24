"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    const refresh = () => {
      const activeTagName = document.activeElement?.tagName || null;
      if (shouldPauseWhatsAppInboxRefresh({ visibilityState: document.visibilityState, activeTagName })) return;
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
  }, [router]);

  return null;
}
