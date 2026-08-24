"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStatusPresentation, shouldPollPostStatus } from "@/lib/scheduler/statusPresentation";
import { isPostStatus, type PostStatus } from "@/lib/scheduler/types";

type StatusPost = {
  id: string;
  status: PostStatus;
  scheduled_for: string | null;
  timezone: string | null;
  terminal_at: string | null;
  user_failure_code: string | null;
  retry_eligible: boolean;
};

type StatusSnapshot = {
  status: PostStatus;
  publishedAt: string | null;
  failureCode: string | null;
  retryEligible: boolean;
  nextPollAfterMs: number | null;
};

const MAX_CLIENT_POLLING_MS = 15 * 60_000;
const DEFAULT_POLL_INTERVAL_MS = 5_000;

function formatTime(value: string | null, timezone: string | null) {
  if (!value) return null;
  try {
    const label = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone || undefined,
      timeZoneName: "short",
    }).format(new Date(value));
    return timezone ? `${label} (${timezone})` : label;
  } catch {
    return new Date(value).toLocaleString();
  }
}

function parseStatusSnapshot(value: unknown): StatusSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Record<string, unknown>;
  const status = typeof payload.status === "string" ? payload.status : "";
  if (!isPostStatus(status)) return null;
  return {
    status,
    publishedAt: typeof payload.publishedAt === "string" ? payload.publishedAt : null,
    failureCode: typeof payload.failureCode === "string" ? payload.failureCode : null,
    retryEligible: payload.retryEligible === true,
    nextPollAfterMs: typeof payload.nextPollAfterMs === "number" ? payload.nextPollAfterMs : null,
  };
}

function intervalFrom(value: number | null) {
  return value === DEFAULT_POLL_INTERVAL_MS ? value : DEFAULT_POLL_INTERVAL_MS;
}

export default function PostStatusPanel({ post }: { post: StatusPost }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<StatusSnapshot>({
    status: post.status,
    publishedAt: post.status === "PUBLISHED" ? post.terminal_at : null,
    failureCode: post.user_failure_code,
    retryEligible: post.retry_eligible,
    nextPollAfterMs: shouldPollPostStatus(post.status) ? DEFAULT_POLL_INTERVAL_MS : null,
  });
  const [pollingMessage, setPollingMessage] = useState("");
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    setSnapshot({
      status: post.status,
      publishedAt: post.status === "PUBLISHED" ? post.terminal_at : null,
      failureCode: post.user_failure_code,
      retryEligible: post.retry_eligible,
      nextPollAfterMs: shouldPollPostStatus(post.status) ? DEFAULT_POLL_INTERVAL_MS : null,
    });
  }, [post.status, post.terminal_at, post.user_failure_code, post.retry_eligible]);

  useEffect(() => {
    if (!shouldPollPostStatus(snapshot.status)) return;

    const startedAt = Date.now();
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;
    let consecutiveFailures = 0;

    const schedulePoll = (delay = intervalFrom(snapshot.nextPollAfterMs)) => {
      if (document.visibilityState === "visible" && Date.now() - startedAt < MAX_CLIENT_POLLING_MS) {
        timer = setTimeout(poll, delay);
      }
    };
    const scheduleAfterFailure = () => {
      const delay = Math.min(DEFAULT_POLL_INTERVAL_MS * 2 ** consecutiveFailures, 60_000);
      consecutiveFailures += 1;
      schedulePoll(delay);
    };

    const poll = async () => {
      if (!active || document.visibilityState === "hidden" || Date.now() - startedAt >= MAX_CLIENT_POLLING_MS) return;
      timer = null;
      controller = new AbortController();
      try {
        const response = await fetch(`/api/scheduler/posts/${post.id}/status/`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const next = response.ok ? parseStatusSnapshot(await response.json()) : null;
        if (!active || !next) {
          if (active && !controller.signal.aborted) {
            setPollingMessage("Status updates are temporarily unavailable. Please check again shortly.");
            scheduleAfterFailure();
          }
          return;
        }
        consecutiveFailures = 0;
        setPollingMessage("");
        if (next.status !== snapshot.status) {
          setSnapshot(next);
          router.refresh();
          return;
        }
        setSnapshot(next);
        if (shouldPollPostStatus(next.status)) timer = setTimeout(poll, intervalFrom(next.nextPollAfterMs));
      } catch {
        if (active && !controller?.signal.aborted) {
          setPollingMessage("Status updates are temporarily unavailable. Please check again shortly.");
          scheduleAfterFailure();
        }
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timer) clearTimeout(timer);
        timer = null;
        controller?.abort();
      } else if (!timer) {
        schedulePoll();
      }
    };

    schedulePoll();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [post.id, router, snapshot.status, snapshot.nextPollAfterMs]);

  const presentation = getStatusPresentation(snapshot.status, snapshot.failureCode);
  const scheduledTime = formatTime(post.scheduled_for, post.timezone);
  const publishedTime = formatTime(snapshot.publishedAt, post.timezone);
  const canRetry = presentation.canRetry && snapshot.retryEligible;
  const needsReconnect = snapshot.failureCode === "TIKTOK_RECONNECT_REQUIRED";
  const needsSettingsReview = snapshot.failureCode === "CREATOR_SETTINGS_CHANGED" || snapshot.failureCode === "PRIVACY_MISMATCH";
  const toneClass = presentation.tone === "success"
    ? "border-[#62f5e6]/35 bg-[#62f5e6]/[0.07]"
    : presentation.tone === "attention"
      ? "border-[#ffb454]/35 bg-[#ffb454]/[0.07]"
      : "border-white/12 bg-white/[0.035]";

  async function retry() {
    setRetrying(true);
    try {
      const response = await fetch(`/api/scheduler/posts/${post.id}/retry/`, { method: "POST" });
      if (!response.ok) {
        setPollingMessage("This post is no longer eligible for retry. Refresh the page to see its latest status.");
        return;
      }
      setSnapshot((current) => ({ ...current, status: "SCHEDULED", retryEligible: false, nextPollAfterMs: null }));
      router.refresh();
    } catch {
      setPollingMessage("Unable to request a retry right now. Please try again shortly.");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <section className={`mt-10 rounded-3xl border p-6 sm:p-7 ${toneClass}`} aria-labelledby="publishing-status-title">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Publishing status</p>
          <h2 id="publishing-status-title" className="mt-2 font-serif text-2xl">{presentation.title}</h2>
        </div>
        {shouldPollPostStatus(snapshot.status) ? <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-[#62f5e6] motion-safe:animate-pulse" /> : null}
      </div>
      <div className="mt-5 border-l border-white/15 pl-4">
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm leading-6 text-white/75">{presentation.detail}</p>
        {scheduledTime ? <p className="mt-3 text-sm text-white/60">Scheduled locally for <time dateTime={post.scheduled_for || undefined}>{scheduledTime}</time>.</p> : null}
        {publishedTime ? <p className="mt-2 text-sm text-white/60">Published <time dateTime={snapshot.publishedAt || undefined}>{publishedTime}</time>.</p> : null}
      </div>
      {canRetry ? <button type="button" onClick={retry} disabled={retrying} className="mt-6 rounded-full bg-[#ffb454] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#ffd18a] disabled:opacity-50">{retrying ? "Requesting retry…" : "Retry publishing"}</button> : null}
      {needsReconnect ? <a href="/scheduler/settings/" className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold transition hover:border-[#62f5e6]/60">Reconnect TikTok</a> : null}
      {needsSettingsReview ? <a href="/scheduler/settings/" className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold transition hover:border-[#ffb454]/70">Review TikTok settings</a> : null}
      {pollingMessage ? <p role="alert" className="mt-5 text-sm text-[#ffb454]">{pollingMessage}</p> : null}
    </section>
  );
}
