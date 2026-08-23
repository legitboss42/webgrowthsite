"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENT_SCHEDULER_PRIVACY_VERSION, CURRENT_SCHEDULER_TERMS_VERSION } from "@/lib/scheduler/legalVersions";

export default function TermsAcceptance() {
  const router = useRouter();
  const [retentionAcknowledged, setRetentionAcknowledged] = useState(false);
  const [contentResponsibilityAcknowledged, setContentResponsibilityAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canAccept = retentionAcknowledged && contentResponsibilityAcknowledged && !busy;

  async function accept() {
    if (!canAccept) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/scheduler/legal/accept/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          termsVersion: CURRENT_SCHEDULER_TERMS_VERSION,
          privacyVersion: CURRENT_SCHEDULER_PRIVACY_VERSION,
          retentionAcknowledged: true,
          contentResponsibilityAcknowledged: true,
        }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error || "Unable to record acceptance.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to record acceptance.");
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-3xl border border-[#62f5e6]/30 bg-[#62f5e6]/[0.06] p-6 sm:p-8" aria-labelledby="scheduler-legal-heading">
      <p className="text-xs uppercase tracking-[.25em] text-[#62f5e6]">Before you create or schedule</p>
      <h2 id="scheduler-legal-heading" className="mt-3 font-serif text-3xl">Accept the current scheduler terms</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Confirm that your uploads are original or properly authorized, that you remain responsible for published content, and that original media is retained only as described in the scheduler terms.</p>
      <p className="mt-3 text-sm text-white/70"><a className="underline" href="/scheduler/terms/">Read Scheduler Terms and Privacy Policy</a>.</p>
      <label className="mt-6 flex gap-3 text-sm leading-6 text-white/85"><input type="checkbox" checked={retentionAcknowledged} onChange={(event) => setRetentionAcknowledged(event.target.checked)} />I acknowledge the scheduler media-retention policy.</label>
      <label className="mt-4 flex gap-3 text-sm leading-6 text-white/85"><input type="checkbox" checked={contentResponsibilityAcknowledged} onChange={(event) => setContentResponsibilityAcknowledged(event.target.checked)} />I am responsible for the content I upload and schedule.</label>
      {error ? <p role="alert" className="mt-4 text-sm text-[#ff8b9a]">{error}</p> : null}
      <button type="button" disabled={!canAccept} onClick={() => void accept()} className="mt-6 rounded-full bg-[#62f5e6] px-5 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Saving…" : "Accept and continue"}</button>
    </section>
  );
}
