"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WhatsAppBusinessProfile } from "@/lib/whatsapp/businessProfile";

const FIELD =
  "mt-1.5 w-full rounded-xl border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint/70 focus:border-ledger-bright focus:ring-2 focus:ring-ledger-bright/15 disabled:cursor-not-allowed disabled:opacity-60";
const LABEL = "block text-xs font-semibold text-ink-soft";

const CATEGORIES = [
  ["OTHER", "Other"],
  ["PROF_SERVICES", "Professional services"],
  ["RETAIL", "Retail"],
  ["BEAUTY", "Beauty"],
  ["HEALTH", "Health"],
  ["EDU", "Education"],
  ["FINANCE", "Finance"],
  ["ENTERTAIN", "Entertainment"],
  ["EVENT_PLAN", "Event planning"],
  ["RESTAURANT", "Restaurant"],
  ["HOTEL", "Hotel"],
  ["TRAVEL", "Travel"],
  ["AUTO", "Automotive"],
  ["APPAREL", "Apparel"],
  ["GROCERY", "Grocery"],
  ["NONPROFIT", "Nonprofit"],
  ["GOVT", "Government"],
  ["NOT_A_BIZ", "Not a business"],
  ["UNDEFINED", "Unspecified"],
] as const;

export default function BusinessProfileEditor({ profile }: { profile: WhatsAppBusinessProfile }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState({
    description: profile.description || "",
    about: profile.about || "",
    email: profile.email || "",
    address: profile.address || "",
    website1: profile.websites[0] || "",
    website2: profile.websites[1] || "",
    vertical: profile.vertical || "OTHER",
  });
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const update = (key: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  };

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/whatsapp/business-profile/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: draft.description,
          about: draft.about,
          email: draft.email,
          address: draft.address,
          websites: [draft.website1, draft.website2].filter((value) => value.trim()),
          vertical: draft.vertical,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!payload.ok) {
        setFeedback({ ok: false, text: payload.error || "Business profile could not be updated." });
        return;
      }
      setFeedback({ ok: true, text: "Business profile updated on WhatsApp." });
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="wa-description" className={LABEL}>Business description</label>
          <textarea
            id="wa-description"
            rows={3}
            maxLength={256}
            value={draft.description}
            onChange={(event) => update("description", event.target.value)}
            disabled={isPending}
            className={`${FIELD} resize-y`}
          />
          <p className="mt-1 text-[0.68rem] text-ink-faint">{draft.description.length}/256</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="wa-about" className={LABEL}>About</label>
          <input
            id="wa-about"
            maxLength={139}
            value={draft.about}
            onChange={(event) => update("about", event.target.value)}
            disabled={isPending}
            placeholder="Short line customers see inside the chat"
            className={FIELD}
          />
          <p className="mt-1 text-[0.68rem] text-ink-faint">{draft.about.length}/139</p>
        </div>
        <div>
          <label htmlFor="wa-email" className={LABEL}>Email</label>
          <input id="wa-email" type="email" maxLength={128} value={draft.email} onChange={(event) => update("email", event.target.value)} disabled={isPending} className={FIELD} />
        </div>
        <div>
          <label htmlFor="wa-category" className={LABEL}>Category</label>
          <select id="wa-category" value={draft.vertical} onChange={(event) => update("vertical", event.target.value)} disabled={isPending} className={FIELD}>
            {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="wa-address" className={LABEL}>Address</label>
          <input id="wa-address" maxLength={256} value={draft.address} onChange={(event) => update("address", event.target.value)} disabled={isPending} placeholder="Optional business address" className={FIELD} />
        </div>
        <div>
          <label htmlFor="wa-website-1" className={LABEL}>Website</label>
          <input id="wa-website-1" type="url" maxLength={256} value={draft.website1} onChange={(event) => update("website1", event.target.value)} disabled={isPending} placeholder="https://webgrowth.info" className={FIELD} />
        </div>
        <div>
          <label htmlFor="wa-website-2" className={LABEL}>Second website</label>
          <input id="wa-website-2" type="url" maxLength={256} value={draft.website2} onChange={(event) => update("website2", event.target.value)} disabled={isPending} placeholder="Optional" className={FIELD} />
        </div>
      </div>

      {feedback ? (
        <p role="status" className={`rounded-xl px-4 py-3 text-xs ${feedback.ok ? "border border-ledger/15 bg-ledger-tint text-ledger" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
          {feedback.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-xl bg-ledger-bright px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ledger disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? "Saving..." : "Save business profile"}
        </button>
        <span className="text-xs text-ink-faint">Profile photo is managed separately because Meta requires an upload handle.</span>
      </div>
    </form>
  );
}
