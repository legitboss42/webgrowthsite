"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWhatsAppPresenceLabel,
  isWhatsAppTeamMemberAssignable,
  type WhatsAppTeamMember,
  type WhatsAppTeamRole,
} from "@/lib/whatsapp/teamModel";

type Props = {
  conversationId: string;
  assignedMemberId?: string | null;
  viewerMemberId?: string | null;
  viewerRole: WhatsAppTeamRole;
  members: WhatsAppTeamMember[];
};

export default function ConversationAssignment({
  conversationId,
  assignedMemberId,
  viewerMemberId,
  viewerRole,
  members,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supervisor = viewerRole === "owner" || viewerRole === "manager";
  const assignedMember = members.find((member) => member.id === assignedMemberId) || null;
  const viewerMember = members.find((member) => member.id === viewerMemberId) || null;
  const mine = Boolean(viewerMemberId && assignedMemberId === viewerMemberId);
  const viewerCanClaim = Boolean(viewerMember && isWhatsAppTeamMemberAssignable(viewerMember));
  const eligibleMembers = members.filter(isWhatsAppTeamMemberAssignable);
  const assignedIsEligible = Boolean(
    assignedMember && eligibleMembers.some((member) => member.id === assignedMember.id),
  );

  async function assign(memberId: string | null) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/whatsapp/conversations/assignment/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, memberId }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Assignment could not be saved.");

      if (!supervisor && memberId && memberId === viewerMemberId) {
        router.replace(`/admin/whatsapp/conversations/?scope=mine&lead=${encodeURIComponent(conversationId)}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (!supervisor) {
    return (
      <div className="flex min-w-0 flex-col items-end gap-1">
        {mine ? (
          <span className="rounded-full border border-ledger/20 bg-ledger-tint px-2.5 py-1 text-[0.7rem] font-semibold text-ledger">
            Assigned to you
          </span>
        ) : assignedMember ? (
          <span className="max-w-36 truncate rounded-full border border-rule bg-paper px-2.5 py-1 text-[0.7rem] font-medium text-ink-faint">
            {assignedMember.displayName}
          </span>
        ) : (
          <button
            type="button"
            disabled={saving || !viewerMemberId || !viewerCanClaim}
            onClick={() => void assign(viewerMemberId || null)}
            title={viewerCanClaim ? undefined : "Set your activity status to Online before claiming a conversation."}
            className="rounded-lg bg-ledger-bright px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Assigning…" : viewerCanClaim ? "Assign to me" : "Set Online to claim"}
          </button>
        )}
        {error ? <span className="max-w-48 text-right text-[0.65rem] text-rose-700">{error}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <select
        aria-label="Assigned team member"
        value={assignedMemberId || ""}
        disabled={saving}
        onChange={(event) => void assign(event.target.value || null)}
        className="max-w-52 rounded-lg border border-rule bg-paper px-2.5 py-1.5 text-xs font-medium text-ink outline-none focus:border-ledger disabled:opacity-50"
      >
        <option value="">Unassigned</option>
        {assignedMember && !assignedIsEligible ? (
          <option value={assignedMember.id} disabled>
            {assignedMember.displayName} · {getWhatsAppPresenceLabel(assignedMember.availability)} · current
          </option>
        ) : null}
        {eligibleMembers.map((member) => (
          <option key={member.id} value={member.id}>
            {member.displayName} · Online
          </option>
        ))}
      </select>
      <span className="max-w-52 text-right text-[0.62rem] text-ink-faint">Only Online team members can receive new assignments.</span>
      {error ? <span className="max-w-48 text-right text-[0.65rem] text-rose-700">{error}</span> : null}
    </div>
  );
}
