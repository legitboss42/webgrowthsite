"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApprovalPost = { id: string; approval_id: string | null; scheduled_for: string | null };

export default function PostApprovalPanel({ post }: { post: ApprovalPost }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function approve(data: FormData) {
    setBusy(true);
    setError("");
    if (data.get("musicUsageConfirmation") !== "on") {
      setError("Confirm TikTok's Music Usage terms before approving.");
      setBusy(false);
      return;
    }

    const response = await fetch("/api/scheduler/posts/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "approve",
        postId: post.id,
        approval: {
          privacyLevel: String(data.get("privacy")),
          allowComment: data.get("comments") === "on",
          allowDuet: false,
          allowStitch: false,
          brandContent: false,
          brandOrganic: data.get("organic") === "on",
          declarationVersion: "2026-08",
        },
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      setBusy(false);
      return;
    }
    router.refresh();
  }

  async function schedule(data: FormData) {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/scheduler/posts/${post.id}/schedule/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "schedule",
        scheduledFor: String(data.get("time")),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <section className="mt-10 rounded-3xl border border-white/10 p-6">
      <h2 className="font-serif text-2xl">Approval and schedule</h2>
      {!post.approval_id ? (
        <form action={approve} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm">Privacy — choose manually</span>
            <select name="privacy" required defaultValue="" className="w-full rounded-xl bg-[#111617] p-3">
              <option value="" disabled>Select privacy</option>
              <option value="SELF_ONLY">Only me (beta)</option>
            </select>
          </label>
          <label className="flex gap-3"><input type="checkbox" name="comments" />Allow comments</label>
          <label className="flex gap-3"><input type="checkbox" name="organic" />This promotes my own brand</label>
          <label className="flex gap-3 text-sm text-white/75">
            <input type="checkbox" name="musicUsageConfirmation" required />
            I agree to TikTok&apos;s Music Usage Confirmation for this post.
          </label>
          <button disabled={busy} className="rounded-full bg-[#62f5e6] px-5 py-3 font-bold text-black disabled:opacity-50">
            {busy ? "Approving…" : "Approve post"}
          </button>
        </form>
      ) : (
        <form action={schedule} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm">Publish time</span>
            <input name="time" type="datetime-local" required className="w-full rounded-xl bg-[#111617] p-3" />
          </label>
          <button disabled={busy} className="rounded-full bg-[#ff5269] px-5 py-3 font-bold disabled:opacity-50">
            {busy ? "Scheduling…" : "Approve and schedule"}
          </button>
        </form>
      )}
      {error ? <p role="alert" className="mt-4 text-[#ff8b9a]">{error}</p> : null}
    </section>
  );
}
