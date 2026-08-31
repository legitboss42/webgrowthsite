"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import type { WhatsAppTeamMember } from "@/lib/whatsapp/teamModel";

type CollaborationNote = {
  id: string;
  body: string;
  authorMemberId?: string | null;
  authorName: string;
  createdAt?: string | null;
};

type CollaborationActivity = {
  id: string;
  eventType: string;
  actorName: string;
  targetName?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string | null;
};

type CollaborationViewer = {
  memberId: string;
  displayName: string;
  isTyping: boolean;
  lastSeenAt?: string | null;
};

type CollaborationResponse = {
  viewerMemberId?: string | null;
  canWriteNote?: boolean;
  mentionableMembers?: WhatsAppTeamMember[];
  notes?: CollaborationNote[];
  activity?: CollaborationActivity[];
  viewers?: CollaborationViewer[];
  error?: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "";
  return new Date(parsed).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function activityText(activity: CollaborationActivity) {
  const target = activity.targetName ? ` to ${activity.targetName}` : "";
  if (activity.eventType === "conversation_assigned") return `${activity.actorName} assigned this conversation${target}.`;
  if (activity.eventType === "conversation_reassigned") return `${activity.actorName} reassigned this conversation${target}.`;
  if (activity.eventType === "conversation_unassigned") return `${activity.actorName} unassigned this conversation.`;
  if (activity.eventType === "internal_note_created") return `${activity.actorName} added an internal note.`;
  if (activity.eventType === "conversation_reply_sent") {
    const kind = typeof activity.metadata?.kind === "string" ? activity.metadata.kind : "message";
    return `${activity.actorName} replied with ${kind === "voice" ? "a voice note" : kind === "text" ? "a message" : `a ${kind}`}.`;
  }
  return `${activity.actorName} · ${activity.eventType.replaceAll("_", " ")}`;
}

export default function ConversationCollaborationWidget() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const conversationId = pathname?.startsWith("/admin/whatsapp/conversations")
    ? searchParams.get("lead") || ""
    : "";
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CollaborationResponse | null>(null);
  const [note, setNote] = useState("");
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typingRef = useRef(false);
  const typingTimerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) {
      setData(null);
      return;
    }
    try {
      const response = await fetch(
        `/api/admin/whatsapp/conversations/collaboration/?conversationId=${encodeURIComponent(conversationId)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => null)) as CollaborationResponse | null;
      if (!response.ok) {
        if (response.status !== 403) setError(payload?.error || "Collaboration data could not be loaded.");
        return;
      }
      setData(payload || {});
      setError(null);
    } catch {
      // Background collaboration polling can retry on the next interval.
    }
  }, [conversationId]);

  const heartbeat = useCallback(
    async (isTyping = typingRef.current) => {
      if (!conversationId) return;
      try {
        await fetch("/api/admin/whatsapp/conversations/collaboration/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "heartbeat", conversationId, isTyping }),
          keepalive: true,
        });
      } catch {
        // Presence is advisory. Never let it interrupt the message workspace.
      }
    },
    [conversationId],
  );

  useEffect(() => {
    if (!conversationId) {
      setOpen(false);
      setData(null);
      setNote("");
      setMentionIds([]);
      return;
    }
    void load();
    void heartbeat(false);
    const refreshTimer = window.setInterval(() => void load(), 8_000);
    const heartbeatTimer = window.setInterval(() => void heartbeat(), 12_000);
    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(heartbeatTimer);
      typingRef.current = false;
      void heartbeat(false);
    };
  }, [conversationId, heartbeat, load]);

  useEffect(() => {
    if (!conversationId) return;

    function setTyping(next: boolean) {
      if (typingRef.current === next) return;
      typingRef.current = next;
      void heartbeat(next);
    }

    function handleInput(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLTextAreaElement) || target.id !== "whatsapp-composer-editor") return;
      const hasDraft = target.value.trim().length > 0;
      setTyping(hasDraft);
      if (typingTimerRef.current !== null) window.clearTimeout(typingTimerRef.current);
      if (hasDraft) {
        typingTimerRef.current = window.setTimeout(() => setTyping(false), 7_000);
      }
    }

    function handleFocus(event: FocusEvent) {
      const target = event.target;
      if (target instanceof HTMLTextAreaElement && target.id === "whatsapp-composer-editor") {
        setTyping(target.value.trim().length > 0);
      }
    }

    function handleBlur(event: FocusEvent) {
      const target = event.target;
      if (target instanceof HTMLTextAreaElement && target.id === "whatsapp-composer-editor") setTyping(false);
    }

    document.addEventListener("input", handleInput);
    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);
    return () => {
      document.removeEventListener("input", handleInput);
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
      if (typingTimerRef.current !== null) window.clearTimeout(typingTimerRef.current);
    };
  }, [conversationId, heartbeat]);

  const otherViewers = useMemo(
    () => (data?.viewers || []).filter((viewer) => viewer.memberId !== data?.viewerMemberId),
    [data?.viewerMemberId, data?.viewers],
  );
  const typingViewer = otherViewers.find((viewer) => viewer.isTyping);

  function addMention(member: WhatsAppTeamMember) {
    setMentionIds((current) => (current.includes(member.id) ? current : [...current, member.id]));
    const token = `@${member.displayName}`;
    setNote((current) => (current.includes(token) ? current : `${current}${current && !current.endsWith(" ") ? " " : ""}${token} `));
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversationId || !note.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/whatsapp/conversations/collaboration/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "note",
          conversationId,
          body: note,
          mentionMemberIds: mentionIds,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Internal note could not be saved.");
      setNote("");
      setMentionIds([]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Internal note could not be saved.");
    } finally {
      setSending(false);
    }
  }

  if (!conversationId) return null;

  return (
    <>
      {otherViewers.length > 0 ? (
        <div className="pointer-events-none fixed left-1/2 top-[4.8rem] z-[54] -translate-x-1/2 rounded-full border border-brass/25 bg-brass-tint px-3 py-1.5 text-xs font-semibold text-[#6f4f16] shadow-md">
          {typingViewer
            ? `${typingViewer.displayName} is replying…`
            : `${otherViewers.map((viewer) => viewer.displayName).join(", ")} ${otherViewers.length === 1 ? "is" : "are"} viewing this conversation`}
        </div>
      ) : null}

      <div className="fixed right-3 top-[8.25rem] z-[54] sm:right-5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-ledger/20 bg-ledger-tint px-3 py-2 text-xs font-semibold text-ledger shadow-lg shadow-ink/10"
        >
          Internal · {data?.notes?.length || 0}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] bg-ink/35 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-label="Internal conversation collaboration">
          <button type="button" aria-label="Close internal collaboration" onClick={() => setOpen(false)} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-rule bg-paper-raised shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-4">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ink-faint">Team collaboration</p>
                <h2 className="mt-1 text-lg font-semibold text-ink">Internal notes & activity</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-rule px-3 py-2 text-xs font-semibold text-ink-soft">Close</button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {otherViewers.length > 0 ? (
                <div className="mb-4 rounded-xl border border-brass/25 bg-brass-tint px-3 py-2.5 text-xs text-[#6f4f16]">
                  {typingViewer
                    ? `${typingViewer.displayName} is replying to this customer right now.`
                    : `${otherViewers.map((viewer) => viewer.displayName).join(", ")} ${otherViewers.length === 1 ? "is" : "are"} viewing this conversation.`}
                </div>
              ) : null}

              <section>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">Internal notes</h3>
                  <span className="text-xs text-ink-faint">Never sent to the customer</span>
                </div>

                <div className="mt-3 space-y-2">
                  {(data?.notes || []).map((item) => (
                    <article key={item.id} className="rounded-xl border border-rule bg-paper px-3 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-xs font-semibold text-ledger">{item.authorName}</p>
                        <time className="text-[0.65rem] text-ink-faint">{formatDateTime(item.createdAt)}</time>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{item.body}</p>
                    </article>
                  ))}
                  {(data?.notes || []).length === 0 ? (
                    <p className="rounded-xl border border-dashed border-rule px-3 py-6 text-center text-xs text-ink-faint">No internal notes yet.</p>
                  ) : null}
                </div>

                {data?.canWriteNote ? (
                  <form onSubmit={submitNote} className="mt-3 rounded-xl border border-rule bg-paper p-3">
                    {(data.mentionableMembers || []).length > 0 ? (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {(data.mentionableMembers || []).map((member) => {
                          const selected = mentionIds.includes(member.id);
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => addMention(member)}
                              className={`rounded-full border px-2 py-1 text-[0.65rem] font-semibold ${selected ? "border-ledger bg-ledger-tint text-ledger" : "border-rule bg-paper-raised text-ink-soft"}`}
                            >
                              @{member.displayName}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={4}
                      maxLength={4000}
                      placeholder="Add an internal note. Use @mentions to alert a teammate."
                      className="w-full resize-y rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-ledger"
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[0.65rem] text-ink-faint">{note.length}/4000</span>
                      <button type="submit" disabled={sending || !note.trim()} className="rounded-lg bg-ledger-bright px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                        {sending ? "Saving…" : "Add internal note"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-xs text-ink-faint">Assign this conversation to yourself before adding a note.</p>
                )}
              </section>

              <section className="mt-6 border-t border-rule pt-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">Activity history</h3>
                  <span className="text-xs text-ink-faint">Latest 50 events</span>
                </div>
                <div className="mt-3 space-y-2">
                  {(data?.activity || []).map((item) => (
                    <div key={item.id} className="rounded-lg bg-paper px-3 py-2.5">
                      <p className="text-xs leading-5 text-ink-soft">{activityText(item)}</p>
                      <time className="mt-0.5 block text-[0.65rem] text-ink-faint">{formatDateTime(item.createdAt)}</time>
                    </div>
                  ))}
                  {(data?.activity || []).length === 0 ? (
                    <p className="text-xs text-ink-faint">No recorded activity yet.</p>
                  ) : null}
                </div>
              </section>

              {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
