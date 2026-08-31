"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type WindowState = "open" | "closing" | "closed" | "unavailable";

type ServiceWindowStatus = {
  ok?: boolean;
  state?: WindowState;
  expiresAt?: string | null;
  remainingMs?: number | null;
};

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

  useEffect(() => {
    if (!enabled || !pathname.includes("/admin/whatsapp/conversations") || !conversationId) {
      setStatus(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(
          `/api/admin/whatsapp/service-window/?conversationId=${encodeURIComponent(conversationId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const payload = (await response.json().catch(() => ({}))) as ServiceWindowStatus;
        if (!cancelled && response.ok && payload.ok) setStatus(payload);
      } catch {
        if (!cancelled) setStatus(null);
      }
    }

    void load();
    const timer = window.setInterval(load, 60000);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [conversationId, enabled, pathname]);

  if (!enabled || !status || status.state === "open" || status.state === "unavailable") return null;

  const closed = status.state === "closed";
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
            : `The 24-hour customer service window closes in ${formatRemaining(status.remainingMs || 0)}.`}
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
