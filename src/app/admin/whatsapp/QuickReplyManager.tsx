"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import {
  WHATSAPP_QUICK_REPLY_LIMITS,
  normalizeWhatsAppQuickReplyShortcut,
  validateWhatsAppQuickReplyInput,
  type WhatsAppQuickReply,
} from "./quickRepliesModel";

type Draft = { shortcut: string; title: string; body: string };

const EMPTY_DRAFT: Draft = { shortcut: "", title: "", body: "" };

function DraftFields({
  draft,
  onChange,
  disabled,
  idPrefix,
}: {
  draft: Draft;
  onChange: (next: Draft) => void;
  disabled: boolean;
  idPrefix: string;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${idPrefix}-shortcut`}
            className="block text-[0.65rem] font-semibold uppercase tracking-[.14em] text-ink-faint"
          >
            Shortcut
          </label>
          <input
            id={`${idPrefix}-shortcut`}
            value={draft.shortcut}
            onChange={(event) => onChange({ ...draft, shortcut: event.target.value })}
            disabled={disabled}
            maxLength={WHATSAPP_QUICK_REPLY_LIMITS.shortcutMax + 8}
            placeholder="pricing"
            className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 font-mono text-sm text-ink outline-none transition placeholder:text-ink-faint/70 focus:border-ledger-bright focus:ring-2 focus:ring-ledger-bright/20 disabled:opacity-60"
          />
          <p className="mt-1 text-[0.65rem] text-ink-faint">
            Lowercase letters, numbers, and hyphens. Saved as{" "}
            <span className="font-mono text-ink-soft">
              {normalizeWhatsAppQuickReplyShortcut(draft.shortcut) || "—"}
            </span>
          </p>
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-title`}
            className="block text-[0.65rem] font-semibold uppercase tracking-[.14em] text-ink-faint"
          >
            Title
          </label>
          <input
            id={`${idPrefix}-title`}
            value={draft.title}
            onChange={(event) => onChange({ ...draft, title: event.target.value })}
            disabled={disabled}
            maxLength={WHATSAPP_QUICK_REPLY_LIMITS.titleMax}
            placeholder="Pricing overview"
            className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-faint/70 focus:border-ledger-bright focus:ring-2 focus:ring-ledger-bright/20 disabled:opacity-60"
          />
        </div>
      </div>
      <div className="mt-3">
        <label
          htmlFor={`${idPrefix}-body`}
          className="block text-[0.65rem] font-semibold uppercase tracking-[.14em] text-ink-faint"
        >
          Message
        </label>
        <textarea
          id={`${idPrefix}-body`}
          value={draft.body}
          onChange={(event) => onChange({ ...draft, body: event.target.value })}
          disabled={disabled}
          rows={4}
          maxLength={WHATSAPP_QUICK_REPLY_LIMITS.bodyMax}
          placeholder="The text this quick reply inserts into the composer."
          className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-faint/70 focus:border-ledger-bright focus:ring-2 focus:ring-ledger-bright/20 disabled:opacity-60"
        />
        <p className="mt-1 text-right text-[0.65rem] tabular-nums text-ink-faint">
          {draft.body.length} / {WHATSAPP_QUICK_REPLY_LIMITS.bodyMax}
        </p>
      </div>
    </>
  );
}

export default function QuickReplyManager({ quickReplies }: { quickReplies: WhatsAppQuickReply[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function send(method: "POST" | "PATCH" | "DELETE", payload: Record<string, unknown>) {
    // Trailing slash matches next.config's trailingSlash: true, avoiding a 308 hop.
    const response = await fetch("/api/admin/whatsapp/quick-replies/", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const validation = validateWhatsAppQuickReplyInput(draft);
    if (!validation.ok) {
      setFeedback({ tone: "error", text: validation.error });
      return;
    }

    startTransition(async () => {
      const payload = await send("POST", validation.value);
      if (!payload.ok) {
        setFeedback({ tone: "error", text: payload.error || "Unable to save this quick reply." });
        return;
      }
      setDraft(EMPTY_DRAFT);
      setFeedback({ tone: "ok", text: "Quick reply saved." });
      router.refresh();
    });
  }

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setFeedback(null);

    const validation = validateWhatsAppQuickReplyInput(editDraft);
    if (!validation.ok) {
      setFeedback({ tone: "error", text: validation.error });
      return;
    }

    startTransition(async () => {
      const payload = await send("PATCH", { id: editingId, ...validation.value });
      if (!payload.ok) {
        setFeedback({ tone: "error", text: payload.error || "Unable to update this quick reply." });
        return;
      }
      setEditingId(null);
      setFeedback({ tone: "ok", text: "Quick reply updated." });
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const payload = await send("DELETE", { id });
      if (!payload.ok) {
        setFeedback({ tone: "error", text: payload.error || "Unable to delete this quick reply." });
        return;
      }
      setConfirmingDeleteId(null);
      setFeedback({ tone: "ok", text: "Quick reply deleted." });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,26rem)]">
      <section className="min-w-0 rounded-xl border border-rule bg-paper-raised">
        <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">Saved quick replies</h2>
          <span className="text-xs tabular-nums text-ink-faint">{quickReplies.length}</span>
        </div>

        {feedback ? (
          <p
            role="status"
            className={`mx-5 mt-4 rounded-lg px-3 py-2 text-xs ${
              feedback.tone === "ok"
                ? "border border-ledger/15 bg-ledger-tint text-ledger"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.text}
          </p>
        ) : null}

        {quickReplies.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-sunk text-ink-faint">
              <WhatsAppIcon name="quickReplies" className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-medium text-ink">No quick replies yet</p>
            <p className="mt-1 text-xs text-ink-faint">
              Save the answers you send most often, then insert them in the inbox in one tap.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-rule">
            {quickReplies.map((reply) => (
              <li key={reply.id} className="px-5 py-4">
                {editingId === reply.id ? (
                  <form onSubmit={handleUpdate}>
                    <DraftFields
                      draft={editDraft}
                      onChange={setEditDraft}
                      disabled={isPending}
                      idPrefix={`edit-${reply.id}`}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-full bg-ledger-bright px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-ledger disabled:cursor-not-allowed disabled:bg-paper-sunk disabled:text-ink-faint"
                      >
                        {isPending ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={isPending}
                        className="rounded-full border border-rule px-4 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-rule-strong hover:text-ink disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-ledger-tint px-2 py-0.5 font-mono text-[0.7rem] font-medium text-ledger">
                          /{reply.shortcut}
                        </span>
                        <span className="truncate text-sm font-semibold text-ink">{reply.title}</span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink-soft">
                        {reply.body}
                      </p>
                    </div>
                    <div className="flex flex-none gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(reply.id);
                          setEditDraft({
                            shortcut: reply.shortcut,
                            title: reply.title,
                            body: reply.body,
                          });
                          setConfirmingDeleteId(null);
                        }}
                        disabled={isPending}
                        className="rounded-lg border border-rule px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-ledger hover:text-ledger disabled:opacity-60"
                      >
                        Edit
                      </button>
                      {confirmingDeleteId === reply.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDelete(reply.id)}
                            disabled={isPending}
                            className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                          >
                            {isPending ? "Deleting..." : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(null)}
                            disabled={isPending}
                            className="rounded-lg border border-rule px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-rule-strong disabled:opacity-60"
                          >
                            Keep
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(reply.id)}
                          disabled={isPending}
                          className="rounded-lg border border-rule px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-rose-300 hover:text-rose-700 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5">
        <h2 className="text-sm font-semibold text-ink">New quick reply</h2>
        <p className="mt-0.5 text-xs text-ink-faint">
          These insert text into the composer. Sending still goes through the normal reply flow
          and the 24-hour window.
        </p>
        <form onSubmit={handleCreate} className="mt-4">
          <DraftFields draft={draft} onChange={setDraft} disabled={isPending} idPrefix="new" />
          <button
            type="submit"
            disabled={isPending}
            className="mt-3 w-full rounded-full bg-ledger-bright px-4 py-2 text-sm font-medium text-white transition hover:bg-ledger disabled:cursor-not-allowed disabled:bg-paper-sunk disabled:text-ink-faint"
          >
            {isPending ? "Saving..." : "Save quick reply"}
          </button>
        </form>
      </section>
    </div>
  );
}
