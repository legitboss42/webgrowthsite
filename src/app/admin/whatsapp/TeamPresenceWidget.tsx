"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWhatsAppPresenceLabel,
  type WhatsAppTeamAvailability,
  type WhatsAppTeamMember,
} from "@/lib/whatsapp/teamModel";

type PresenceResponse = {
  viewerMemberId?: string | null;
  members?: WhatsAppTeamMember[];
  error?: string;
};

type MentionNotification = {
  noteId: string;
  conversationId: string;
  authorName: string;
  body: string;
  createdAt?: string | null;
};

type MentionResponse = {
  notifications?: MentionNotification[];
  error?: string;
};

const states: WhatsAppTeamAvailability[] = ["available", "busy", "offline"];

function dotClass(availability: WhatsAppTeamAvailability) {
  if (availability === "available") return "bg-emerald-500";
  if (availability === "busy") return "bg-amber-400";
  return "bg-rose-600";
}

function formatTime(value?: string | null) {
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

export default function TeamPresenceWidget({ senderConnected }: { senderConnected: boolean }) {
  const router = useRouter();
  const [members, setMembers] = useState<WhatsAppTeamMember[]>([]);
  const [viewerMemberId, setViewerMemberId] = useState<string | null>(null);
  const [mentions, setMentions] = useState<MentionNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [presenceResponse, mentionsResponse] = await Promise.all([
        fetch("/api/admin/whatsapp/presence/", { cache: "no-store" }),
        fetch("/api/admin/whatsapp/mentions/", { cache: "no-store" }),
      ]);
      const presence = (await presenceResponse.json().catch(() => null)) as PresenceResponse | null;
      const mentionData = (await mentionsResponse.json().catch(() => null)) as MentionResponse | null;

      if (presenceResponse.ok) {
        setMembers(presence?.members || []);
        setViewerMemberId(presence?.viewerMemberId || null);
      }
      if (mentionsResponse.ok) setMentions(mentionData?.notifications || []);
    } catch {
      // Presence polling is supplemental. A transient miss should not disrupt the workspace.
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const viewer = useMemo(
    () => members.find((member) => member.id === viewerMemberId) || null,
    [members, viewerMemberId],
  );

  async function changeStatus(availability: WhatsAppTeamAvailability) {
    if (!viewer || saving || viewer.availability === availability) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/whatsapp/presence/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });
      const payload = (await response.json().catch(() => null)) as { member?: WhatsAppTeamMember; error?: string } | null;
      if (!response.ok || !payload?.member) {
        throw new Error(payload?.error || "Your status could not be changed.");
      }
      const nextMember = payload.member;
      setMembers((current) =>
        current.map((member) => (member.id === nextMember.id ? nextMember : member)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your status could not be changed.");
    } finally {
      setSaving(false);
    }
  }

  async function openMention(notification: MentionNotification) {
    setMentions((current) => current.filter((item) => item.noteId !== notification.noteId));
    void fetch("/api/admin/whatsapp/mentions/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: notification.noteId }),
    }).catch(() => {});
    setOpen(false);
    router.push(`/admin/whatsapp/conversations/?lead=${encodeURIComponent(notification.conversationId)}`);
  }

  const statusLabel = senderConnected ? "Sender connected" : "Sender disconnected";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={viewer ? `${statusLabel}. Your status: ${getWhatsAppPresenceLabel(viewer.availability)}.` : statusLabel}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
          senderConnected
            ? "border-ledger-tint bg-ledger-tint/60 text-ledger hover:border-ledger/30 hover:bg-ledger-tint"
            : "border-rule bg-paper text-ink-faint hover:border-rule-strong"
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${senderConnected ? "bg-ledger-bright" : "bg-ink-faint/50"}`}
        />
        <span className="hidden sm:inline">{statusLabel}</span>
        {viewer ? (
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ring-2 ring-white/70 ${dotClass(viewer.availability)}`}
          />
        ) : null}
        {mentions.length > 0 ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[0.625rem] font-bold text-white">
            {mentions.length > 9 ? "9+" : mentions.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Team presence and mentions"
          className="absolute right-0 top-full z-[70] mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-rule bg-paper-raised text-ink shadow-2xl shadow-ink/20"
        >
          <div className="border-b border-rule px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink-faint">Your activity status</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {states.map((state) => {
                const active = viewer?.availability === state;
                return (
                  <button
                    key={state}
                    type="button"
                    disabled={saving || !viewer}
                    onClick={() => void changeStatus(state)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold disabled:opacity-50 ${
                      active ? "border-ledger bg-ledger-tint text-ledger" : "border-rule bg-paper text-ink-soft"
                    }`}
                  >
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dotClass(state)}`} />
                    {getWhatsAppPresenceLabel(state)}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[0.68rem] leading-5 text-ink-faint">
              Only Online team members can receive new conversation assignments.
            </p>
            {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
          </div>

          <div className="max-h-60 overflow-y-auto border-b border-rule px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink-faint">Team presence</p>
              <span className="text-[0.65rem] text-ink-faint">{members.length} active</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2 rounded-lg bg-paper px-2.5 py-2">
                  <span aria-hidden="true" className={`h-2.5 w-2.5 flex-none rounded-full ${dotClass(member.availability)}`} />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                    {member.displayName}{member.id === viewerMemberId ? " · You" : ""}
                  </span>
                  <span className="flex-none text-[0.65rem] text-ink-faint">{getWhatsAppPresenceLabel(member.availability)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink-faint">Mentions</p>
              {mentions.length > 0 ? <span className="text-[0.65rem] font-semibold text-rose-700">{mentions.length} unread</span> : null}
            </div>
            {mentions.length > 0 ? (
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                {mentions.map((notification) => (
                  <button
                    key={notification.noteId}
                    type="button"
                    onClick={() => void openMention(notification)}
                    className="block w-full rounded-lg border border-rule bg-paper px-3 py-2 text-left transition hover:border-ledger"
                  >
                    <span className="block text-xs font-semibold text-ink">{notification.authorName} mentioned you</span>
                    <span className="mt-0.5 block line-clamp-2 text-[0.7rem] leading-5 text-ink-soft">{notification.body}</span>
                    <span className="mt-1 block text-[0.62rem] text-ink-faint">{formatTime(notification.createdAt)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-ink-faint">No unread mentions.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
