"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getStatusPresentation, shouldPollPostStatus } from "@/lib/scheduler/statusPresentation";
import { createStatusPollingController, type StatusPollingSnapshot } from "@/lib/scheduler/statusPolling";
import { createManualStatusRetryRunner } from "@/lib/scheduler/statusRetry";
import { parsePublicStatusSnapshot, type PublicStatusSnapshot } from "@/lib/scheduler/statusSnapshot";

type StatusPanelProps = {
  postId: string;
  initialSnapshot: PublicStatusSnapshot;
  scheduledFor: string | null;
  timezone: string | null;
};

function formatTime(value: string | null, timezone: string | null) {
  if (!value) return null;
  try {
    const label = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: timezone || undefined, timeZoneName: "short" }).format(new Date(value));
    return timezone ? `${label} (${timezone})` : label;
  } catch {
    return new Date(value).toLocaleString();
  }
}

function parseStatusSnapshot(value: unknown): StatusPollingSnapshot | null {
  return parsePublicStatusSnapshot(value);
}

export default function PostStatusPanel({ postId, initialSnapshot, scheduledFor, timezone }: StatusPanelProps) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [pollingMessage, setPollingMessage] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [retryAnnouncement, setRetryAnnouncement] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const controllerRef = useRef<ReturnType<typeof createStatusPollingController> | null>(null);
  const retryRunnerRef = useRef<ReturnType<typeof createManualStatusRetryRunner> | null>(null);

  useEffect(() => {
    const controller = createStatusPollingController({
      now: () => Date.now(),
      isVisible: () => document.visibilityState === "visible",
      setTimeout: (callback, delay) => window.setTimeout(callback, delay),
      clearTimeout: (id) => window.clearTimeout(id),
      onVisibilityChange(listener) {
        document.addEventListener("visibilitychange", listener);
        return () => document.removeEventListener("visibilitychange", listener);
      },
      async fetchStatus(signal) {
        const response = await fetch(`/api/scheduler/posts/${postId}/status/`, { cache: "no-store", signal });
        const next = response.ok ? parseStatusSnapshot(await response.json()) : null;
        if (!next) throw new Error("Status response unavailable.");
        return next;
      },
    }, {
      initial: initialSnapshot,
      onSnapshot(next) { setSnapshot(next); setPollingMessage(""); },
      onChangedStatus() { router.refresh(); },
    });
    controllerRef.current = controller;
    controller.start();
    return () => {
      controller.stop();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [postId, router]);

  useEffect(() => {
    setSnapshot(initialSnapshot);
    controllerRef.current?.update(initialSnapshot);
  }, [initialSnapshot]);

  useEffect(() => {
    retryRunnerRef.current = createManualStatusRetryRunner({
      async requestRetry() {
        const response = await fetch(`/api/scheduler/posts/${postId}/retry/`, { method: "POST" });
        return response.ok;
      },
      onPending(value) { setRetrying(value); },
      onSuccess() { setSnapshot((current) => ({ ...current, status: "SCHEDULED", retryEligible: false, nextRetryAt: null, nextPollAfterMs: null })); },
      onAnnounce(message) { setRetryAnnouncement(message); },
      focusStatus() { requestAnimationFrame(() => headingRef.current?.focus()); },
      refresh() { router.refresh(); },
      onFailure(message) { setPollingMessage(message); },
    });
  }, [postId, router]);

  const presentation = getStatusPresentation(snapshot.status, snapshot.failureCode, { retryEligible: snapshot.retryEligible, nextRetryAt: snapshot.nextRetryAt });
  const scheduledTime = formatTime(scheduledFor, timezone);
  const publishedTime = formatTime(snapshot.publishedAt, timezone);
  const canRetry = snapshot.status === "FAILED_RETRYABLE" && presentation.canRetry && snapshot.retryEligible && !snapshot.nextRetryAt;
  const needsReconnect = snapshot.failureCode === "TIKTOK_RECONNECT_REQUIRED";
  const needsSettingsReview = snapshot.failureCode === "CREATOR_SETTINGS_CHANGED" || snapshot.failureCode === "PRIVACY_MISMATCH";
  const toneClass = presentation.tone === "success" ? "border-[#62f5e6]/35 bg-[#62f5e6]/[0.07]" : presentation.tone === "attention" ? "border-[#ffb454]/35 bg-[#ffb454]/[0.07]" : "border-white/12 bg-white/[0.035]";

  async function retry() {
    setRetryAnnouncement("");
    await retryRunnerRef.current?.run();
  }

  return (
    <section className={`mt-10 rounded-3xl border p-6 sm:p-7 ${toneClass}`} aria-labelledby="publishing-status-title">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Publishing status</p>
          <h2 id="publishing-status-title" ref={headingRef} tabIndex={-1} className="mt-2 font-serif text-2xl">{presentation.title}</h2>
        </div>
        {shouldPollPostStatus(snapshot.status) ? <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-[#62f5e6] motion-safe:animate-pulse" /> : null}
      </div>
      <div className="mt-5 border-l border-white/15 pl-4">
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm leading-6 text-white/75">{presentation.detail}</p>
        {scheduledTime ? <p className="mt-3 text-sm text-white/60">Scheduled locally for <time dateTime={scheduledFor || undefined}>{scheduledTime}</time>.</p> : null}
        {publishedTime ? <p className="mt-2 text-sm text-white/60">Published <time dateTime={snapshot.publishedAt || undefined}>{publishedTime}</time>.</p> : null}
      </div>
      {canRetry ? <button type="button" onClick={retry} disabled={retrying} className="mt-6 rounded-full bg-[#ffb454] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#ffd18a] disabled:opacity-50">{retrying ? "Requesting retry…" : "Retry publishing"}</button> : null}
      {needsReconnect ? <a href="/scheduler/settings/" className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold transition hover:border-[#62f5e6]/60">Reconnect TikTok</a> : null}
      {needsSettingsReview ? <a href="/scheduler/settings/" className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold transition hover:border-[#ffb454]/70">Review TikTok settings</a> : null}
      {retryAnnouncement ? <p role="status" aria-live="polite" className="mt-5 text-sm text-white/75">{retryAnnouncement}</p> : null}
      {pollingMessage ? <p role="alert" className="mt-5 text-sm text-[#ffb454]">{pollingMessage}</p> : null}
    </section>
  );
}
