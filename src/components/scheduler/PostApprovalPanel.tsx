"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPostWorkflowStage, type PostWorkflowStage } from "@/lib/scheduler/postWorkflow";
import { toScheduleInstantInTimezone } from "@/lib/scheduler/scheduleTime";
import type { PostStatus } from "@/lib/scheduler/types";

type ApprovalPost = { id: string; status: PostStatus; approval_id: string | null; scheduled_for: string | null };
type CreatorInfo = {
  nickname: string;
  username: string;
  avatarUrl: string;
  privacyLevelOptions: string[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  publicPostingEnabled: boolean;
};

export default function PostApprovalPanel({
  post,
  directPostEnabled,
}: {
  post: ApprovalPost;
  directPostEnabled: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [creator, setCreator] = useState<CreatorInfo | null>(null);
  const [stage, setStage] = useState<PostWorkflowStage>(() => getPostWorkflowStage({ status: post.status }));
  const [scheduleReady, setScheduleReady] = useState(false);

  useEffect(() => {
    setStage(getPostWorkflowStage({ status: post.status }));
    setScheduleReady(false);
  }, [post.status]);

  useEffect(() => {
    if (!directPostEnabled) return;
    if (stage !== "NEEDS_APPROVAL" || scheduleReady) return;
    let active = true;
    fetch("/api/scheduler/creator/", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load TikTok creator settings.");
        if (active) setCreator(body);
      })
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : "Unable to load TikTok creator settings."));
    return () => { active = false; };
  }, [directPostEnabled, stage, scheduleReady]);

  async function approve(data: FormData) {
    setBusy(true);
    setError("");
    if (!creator || data.get("musicUsageConfirmation") !== "on") {
      setError("Load the TikTok account and confirm Music Usage terms before approving.");
      setBusy(false);
      return;
    }
    const response = await fetch("/api/scheduler/posts/", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "approve", postId: post.id, approval: {
        privacyLevel: String(data.get("privacy")), allowComment: data.get("comments") === "on",
        allowDuet: data.get("duet") === "on", allowStitch: data.get("stitch") === "on",
        brandContent: data.get("branded") === "on", brandOrganic: data.get("organic") === "on",
        declarationVersion: "2026-08",
      } }),
    });
    const body = await response.json();
    if (!response.ok) { setError(body.error); setBusy(false); return; }
    setScheduleReady(true);
    setBusy(false);
    router.refresh();
  }

  async function schedule(data: FormData) {
    setBusy(true); setError("");
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localTime = String(data.get("time") || "");
    const instant = toScheduleInstantInTimezone(localTime, timezone);
    if (!instant.ok) { setError(instant.error); setBusy(false); return; }
    const response = await fetch(`/api/scheduler/posts/${post.id}/schedule/`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "schedule", scheduledFor: instant.scheduledForIso, localTime, timezone }),
    });
    const body = await response.json();
    if (!response.ok) { setError(body.error); setBusy(false); return; }
    setStage("SCHEDULED");
    setBusy(false);
    router.refresh();
  }

  if (stage === "STATUS" || stage === "SCHEDULED" || stage === "DRAFT") return null;

  return (
    <section className="mt-10 rounded-3xl border border-white/10 p-6">
      <h2 className="font-serif text-2xl">Approval and schedule</h2>
      {!directPostEnabled ? (
        <div className="mt-6 rounded-2xl border border-[#62f5e6]/25 bg-[#62f5e6]/[0.06] p-5">
          <p className="text-sm font-bold text-[#62f5e6]">Direct Post approval needed</p>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Your preview is saved, but automatic TikTok publishing cannot be approved from here until TikTok enables
            Direct Post for this app. You can keep preparing posts now; turn on Direct Post after TikTok approves the
            Content Posting API scope.
          </p>
          <a
            href="/scheduler/settings/"
            className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white"
          >
            View connection settings
          </a>
        </div>
      ) : stage === "NEEDS_CONNECTION" ? (
        <div className="mt-6 rounded-2xl border border-[#ffb454]/25 bg-[#ffb454]/[0.06] p-5">
          <p className="text-sm font-bold text-[#ffb454]">Connect TikTok before approval</p>
          <a href="/scheduler/settings/" className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-bold">Open connection settings</a>
        </div>
      ) : stage === "NEEDS_APPROVAL" && !scheduleReady ? (
        <form action={approve} className="mt-6 space-y-4">
          {creator ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#62f5e6]">Posting to TikTok</p>
              <p className="mt-1 font-semibold">{creator.nickname || creator.username}</p>
              {!creator.publicPostingEnabled ? <p className="mt-2 text-sm text-white/60">Private beta: posts are limited to Only me until TikTok approves the app audit.</p> : null}
            </div>
          ) : <p aria-live="polite" className="text-sm text-white/60">Loading current TikTok publishing choices…</p>}
          <label className="block">
            <span className="mb-2 block text-sm">Privacy — choose manually</span>
            <select name="privacy" required defaultValue="" disabled={!creator} className="w-full rounded-xl bg-[#111617] p-3 disabled:opacity-50">
              <option value="" disabled>Select privacy</option>
              {creator?.privacyLevelOptions.map((option) => <option key={option} value={option}>{option === "SELF_ONLY" ? "Only me" : option}</option>)}
            </select>
          </label>
          <label className="flex gap-3"><input type="checkbox" name="comments" disabled={!creator || creator.commentDisabled} />Allow comments</label>
          <label className="flex gap-3"><input type="checkbox" name="duet" disabled={!creator || creator.duetDisabled} />Allow Duet (video)</label>
          <label className="flex gap-3"><input type="checkbox" name="stitch" disabled={!creator || creator.stitchDisabled} />Allow Stitch (video)</label>
          <label className="flex gap-3"><input type="checkbox" name="organic" />This promotes my own brand</label>
          <label className="flex gap-3"><input type="checkbox" name="branded" />This is paid third-party branded content</label>
          <label className="flex gap-3 text-sm text-white/75"><input type="checkbox" name="musicUsageConfirmation" required />I agree to TikTok&apos;s Music Usage Confirmation for this post.</label>
          <button disabled={busy || !creator || creator.privacyLevelOptions.length === 0} className="rounded-full bg-[#62f5e6] px-5 py-3 font-bold text-black disabled:opacity-50">{busy ? "Approving…" : "Approve post"}</button>
        </form>
      ) : scheduleReady ? (
        <form action={schedule} className="mt-6 space-y-4">
          <label className="block"><span className="mb-2 block text-sm">Publish time</span><input name="time" type="datetime-local" required className="w-full rounded-xl bg-[#111617] p-3" /></label>
          <button disabled={busy} className="rounded-full bg-[#ff5269] px-5 py-3 font-bold disabled:opacity-50">{busy ? "Scheduling…" : "Approve and schedule"}</button>
        </form>
      ) : null}
      {error ? <p role="alert" className="mt-4 text-[#ff8b9a]">{error}</p> : null}
    </section>
  );
}
