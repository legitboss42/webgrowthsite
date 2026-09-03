"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  WHATSAPP_TEAM_ROLES,
  getWhatsAppPresenceLabel,
  type WhatsAppTeamMember,
  type WhatsAppTeamRole,
} from "@/lib/whatsapp/teamModel";
import { WhatsAppIcon, type WhatsAppIconName } from "@/components/whatsapp/icons";

type TeamResponse = {
  members?: WhatsAppTeamMember[];
  member?: WhatsAppTeamMember | null;
  invite?: {
    sent: boolean;
    reason?: "setup_required" | "delivery_failed" | "member_not_created";
  };
  error?: string;
  migrationRequired?: boolean;
};

type Notice = {
  tone: "success" | "warning";
  text: string;
};

function label(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function presenceDot(member: WhatsAppTeamMember) {
  if (member.availability === "available") return "bg-emerald-500";
  if (member.availability === "busy") return "bg-amber-400";
  return "bg-rose-600";
}

function SummaryCard({ label: title, value, note, icon }: { label: string; value: number; note: string; icon: WhatsAppIconName }) {
  return (
    <div className="rounded-xl border border-rule bg-paper-raised p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-faint">{title}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</p>
          <p className="mt-1 text-xs text-ink-faint">{note}</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-ledger-bright/15 bg-ledger-tint text-ledger-bright">
          <WhatsAppIcon name={icon} className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export default function TeamSettingsPanel({
  viewerRole = "owner",
}: {
  viewerRole?: WhatsAppTeamRole;
}) {
  const [members, setMembers] = useState<WhatsAppTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WhatsAppTeamRole>("agent");
  const ownerView = viewerRole === "owner";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/whatsapp/team/", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as TeamResponse | null;
      if (!response.ok) {
        setMigrationRequired(payload?.migrationRequired === true);
        throw new Error(payload?.error || "Team members could not be loaded.");
      }
      setMigrationRequired(false);
      setMembers(payload?.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Team members could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdding(true);
    setError(null);
    setNotice(null);
    const inviteAddress = email.trim().toLowerCase();

    try {
      const response = await fetch("/api/admin/whatsapp/team/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name, googleEmail: email, role }),
      });
      const payload = (await response.json().catch(() => null)) as TeamResponse | null;
      if (!response.ok) throw new Error(payload?.error || "Team member could not be added.");

      setNotice(
        payload?.invite?.sent
          ? { tone: "success", text: `Member added. Invitation sent to ${inviteAddress}. They can create a password or continue with Google, and start Offline until they set themselves Online.` }
          : {
              tone: "warning",
              text: `Member added, but the invitation email could not be sent to ${inviteAddress}.`,
            },
      );
      setName("");
      setEmail("");
      setRole("agent");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Team member could not be added.");
    } finally {
      setAdding(false);
    }
  }

  async function updateMember(
    member: WhatsAppTeamMember,
    patch: Partial<Pick<WhatsAppTeamMember, "role" | "active">>,
  ) {
    setBusyId(member.id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/whatsapp/team/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, ...patch }),
      });
      const payload = (await response.json().catch(() => null)) as TeamResponse | null;
      if (!response.ok || !payload?.member) {
        throw new Error(payload?.error || "Team member could not be updated.");
      }
      const next = payload.member;
      setMembers((current) => current.map((item) => (item.id === member.id ? next : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Team member could not be updated.");
    } finally {
      setBusyId(null);
    }
  }

  const active = members.filter((member) => member.active).length;
  const supervisors = members.filter((member) => member.active && (member.role === "owner" || member.role === "manager")).length;
  const agents = members.filter((member) => member.active && member.role === "agent").length;
  const online = members.filter((member) => member.active && member.availability === "available").length;

  return (
    <section className="w-full px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
        <div>
          <h2 className="text-xl font-semibold text-ink sm:text-2xl">Team Management</h2>
          <p className="mt-1 text-sm text-ink-faint">Manage workspace members, access, roles and availability.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-rule bg-paper-raised px-3 py-2 text-xs font-semibold text-ink-soft hover:border-rule-strong hover:text-ink disabled:opacity-50"
        >
          <WhatsAppIcon name="statusPending" className="h-4 w-4" />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total members" value={members.length} note={`${active} active`} icon="contacts" />
        <SummaryCard label="Supervisors" value={supervisors} note="Owner and managers" icon="settings" />
        <SummaryCard label="Agents" value={agents} note="Conversation access" icon="conversations" />
        <SummaryCard label="Online now" value={online} note="Available for assignment" icon="statusDelivered" />
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
          <p>{error}</p>
          {migrationRequired ? (
            <p className="mt-1 text-xs">Apply the Stage 2 team migration in Supabase, then refresh.</p>
          ) : null}
        </div>
      ) : null}

      {notice ? (
        <div
          className={`mt-4 rounded-xl border px-3 py-3 text-sm ${
            notice.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      {ownerView ? (
        <form onSubmit={addMember} className="mt-4 grid gap-3 rounded-xl border border-rule bg-paper-raised p-3 lg:grid-cols-[1fr_1.2fr_.7fr_auto]">
          <div className="lg:col-span-4"><p className="text-xs font-semibold text-ink">Invite a team member</p><p className="mt-0.5 text-xs text-ink-faint">Create workspace access without leaving the team screen.</p></div>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            required
            className="rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm outline-none focus:border-ledger"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            type="email"
            required
            className="rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm outline-none focus:border-ledger"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as WhatsAppTeamRole)}
            className="rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm"
          >
            {WHATSAPP_TEAM_ROLES.map((item) => (
              <option key={item} value={item}>{label(item)}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={adding || migrationRequired}
            className="rounded-lg bg-ledger-bright px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {adding ? "Adding…" : "Invite member"}
          </button>
        </form>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-rule bg-paper-raised">
        <div className="hidden grid-cols-[1.4fr_1.4fr_.8fr_.9fr_auto] gap-3 border-b border-rule bg-paper-sunk px-4 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[.1em] text-ink-faint md:grid">
          <span>Member</span><span>Email</span><span>Role</span><span>Availability</span><span className="text-right">Access</span>
        </div>
        <div className="divide-y divide-rule">
          {members.map((member) => {
            const busy = busyId === member.id;
            const managerCanEdit = viewerRole === "manager" && member.role === "agent";
            const canEditAccess = ownerView || managerCanEdit;
            return (
              <div key={member.id} className="grid gap-3 px-3 py-3 hover:bg-white/[.018] md:grid-cols-[1.4fr_1.4fr_.8fr_.9fr_auto] md:items-center md:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-full border border-rule bg-paper-sunk text-xs font-bold text-ink-soft">{member.displayName.trim().slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{member.displayName}</p><p className="text-xs text-ink-faint">{member.active ? "Active" : "Deactivated"}</p></div>
                </div>
                <p className="break-all text-xs text-ink-soft md:truncate">{member.googleEmail}</p>
                <select
                  value={member.role}
                  disabled={busy || !ownerView}
                  onChange={(event) => void updateMember(member, { role: event.target.value as WhatsAppTeamRole })}
                  className="rounded-lg border border-rule bg-paper px-2.5 py-2 text-xs disabled:opacity-60"
                >
                  {WHATSAPP_TEAM_ROLES.map((item) => (
                    <option key={item} value={item}>{label(item)}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2 rounded-lg border border-rule bg-paper px-2.5 py-2 text-xs text-ink-soft">
                  <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${presenceDot(member)}`} />
                  <span>{getWhatsAppPresenceLabel(member.availability)}</span>
                </div>
                <button
                  type="button"
                  disabled={busy || !canEditAccess}
                  onClick={() => void updateMember(member, { active: !member.active })}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                    member.active ? "border-rose-200 bg-rose-50 text-rose-700" : "border-ledger/20 bg-ledger-tint text-ledger-bright"
                  }`}
                >
                  {busy ? "Saving…" : member.active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            );
          })}
        </div>
        {!loading && members.length === 0 && !error ? (
          <p className="px-4 py-10 text-center text-sm text-ink-faint">No team members yet.</p>
        ) : null}
      </div>
    </section>
  );
}