"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  WHATSAPP_REALTIME_EVENT,
  WHATSAPP_SERVICE_WINDOW_TICK_MS,
  matchesWhatsAppRealtimeScope,
  type WhatsAppRealtimeInvalidation,
} from "@/lib/whatsapp/pollingPolicy";

type WindowState = "open" | "closing" | "closed" | "unavailable";

type ServiceWindowStatus = {
  ok?: boolean;
  state?: WindowState;
  expiresAt?: string | null;
  remainingMs?: number | null;
};

const WARNING_MS = 2 * 60 * 60 * 1000;
const REALTIME_SCOPES = ["whatsapp_messages", "whatsapp_conversations"] as const;

function formatRemaining(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

export default function ServiceWindowWarning({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("lead") || "";
  const [status, setStatus] = useState<ServiceWindowStatus | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled || !pathname.includes("/admin/whatsapp/conversations") || !conversationId) {
      setStatus(null);
      return;
    }

    let cancelled = false;
    let controller: AbortController | null = null;

    async function load() {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(
          `/api/admin/whatsapp/service-window/?conversationId=${encodeURIComponent(conversationId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const payload = (await response.json().catch(() => ({}))) as ServiceWindowStatus;
        if (!cancelled && response.ok && payload.ok) {
          setStatus(payload);
          setClockNow(Date.now());
        }
      } catch {
        if (!cancelled && !controller?.signal.aborted) setStatus(null);
      }
    }

    const handleRealtime = (event: Event) => {
      const detail = (event as CustomEvent<WhatsAppRealtimeInvalidation>).detail;
      if (matchesWhatsAppRealtimeScope(detail, REALTIME_SCOPES)) void load();
    };
    const handleFocus = () => void load();

    void load();
    window.addEventListener(WHATSAPP_REALTIME_EVENT, handleRealtime);
    window.addEventListener("focus", handleFocus);
    return () => {
      cancelled = true;
      controller?.abort();
      window.removeEventListener(WHATSAPP_REALTIME_EVENT, handleRealtime);
      window.removeEventListener("focus", handleFocus);
    };
  }, [conversationId, enabled, pathname]);

  useEffect(() => {
    if (!status?.expiresAt) return;
    const timer = window.setInterval(() => setClockNow(Date.now()), WHATSAPP_SERVICE_WINDOW_TICK_MS);
    return () => window.clearInterval(timer);
  }, [status?.expiresAt]);

  const effective = useMemo(() => {
    if (!status) return null;
    if (!status.expiresAt) return status;
    const expiresAt = Date.parse(status.expiresAt);
    if (!Number.isFinite(expiresAt)) return status;
    const remainingMs = Math.max(0, expiresAt - clockNow);
    const state: WindowState = remainingMs <= 0 ? "closed" : remainingMs <= WARNING_MS ? "closing" : "open";
    return { ...status, state, remainingMs };
  }, [clockNow, status]);

  if (!enabled || !effective || effective.state === "open" || effective.state === "unavailable") return null;

  const closed = effective.state === "closed";
  return (
    <div className="mx-4 mt-3 sm:mx-6" role="status" aria-live="polite">
      <div
        className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
          closed
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-brass/30 bg-brass-tint text-[#6f4f16]"
        }`}
      >
        <span>
          {closed
            ? "The 24-hour customer service window is closed. Free-form replies are blocked; use an approved template."
            : `The 24-hour customer service window closes in ${formatRemaining(effective.remainingMs || 0)}.`}
        </span>
        {closed ? (
          <Link href="/admin/whatsapp/templates/" className="font-semibold underline underline-offset-2">
            Open templates
          </Link>
        ) : null}
      </div>
    </div>
  );
}
