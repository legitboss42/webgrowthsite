"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  WHATSAPP_TEAM_AVAILABILITY,
  WHATSAPP_TEAM_ROLES,
  type WhatsAppTeamAvailability,
  type WhatsAppTeamMember,
  type WhatsAppTeamRole,
} from "@/lib/whatsapp/teamModel";

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

export default function TeamSettingsPanel() {
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
          ? { tone: "success", text: `Member added. Invitation sent to ${inviteAddress}.` }
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
    patch: Partial<Pick<WhatsAppTeamMember, "role" | "availability" | "active">>,
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

  return (
    <section className="mx-4 mt-4 rounded-2xl border border-rule bg-paper-raised p-4 shadow-sm sm:mx-6 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ink-faint">
            Stage 2 · Team & assignment
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">Team members</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {active} active · Google accounts only · adding a member sends a branded email invitation automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-lg border border-rule px-3 py-2 text-xs font-semibold text-ink-soft disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
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

      <form onSubmit={addMember} className="mt-4 grid gap-3 rounded-xl border border-rule bg-paper p-3 lg:grid-cols-[1fr_1.2fr_.7fr_auto]">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          required
          className="rounded-lg border border-rule bg-paper-raised px-3 py-2.5 text-sm outline-none focus:border-ledger"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Google email"
          type="email"
          required
          className="rounded-lg border border-rule bg-paper-raised px-3 py-2.5 text-sm outline-none focus:border-ledger"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as WhatsAppTeamRole)}
          className="rounded-lg border border-rule bg-paper-raised px-3 py-2.5 text-sm"
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
          {adding ? "Adding…" : "Add member"}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {members.map((member) => {
          const busy = busyId === member.id;
          return (
            <div key={member.id} className="grid gap-3 rounded-xl border border-rule bg-paper px-3 py-3 md:grid-cols-[1.4fr_1.4fr_.8fr_.9fr_auto] md:items-center">
              <div>
                <p className="text-sm font-semibold text-ink">{member.displayName}</p>
                <p className="text-xs text-ink-faint">{member.active ? "Active" : "Deactivated"}</p>
              </div>
              <p className="break-all font-mono text-xs text-ink-soft">{member.googleEmail}</p>
              <select
                value={member.role}
                disabled={busy}
                onChange={(event) => void updateMember(member, { role: event.target.value as WhatsAppTeamRole })}
                className="rounded-lg border border-rule bg-paper-raised px-2.5 py-2 text-xs"
              >
                {WHATSAPP_TEAM_ROLES.map((item) => (
                  <option key={item} value={item}>{label(item)}</option>
                ))}
              </select>
              <select
                value={member.availability}
                disabled={busy || !member.active}
                onChange={(event) => void updateMember(member, { availability: event.target.value as WhatsAppTeamAvailability })}
                className="rounded-lg border border-rule bg-paper-raised px-2.5 py-2 text-xs"
              >
                {WHATSAPP_TEAM_AVAILABILITY.map((item) => (
                  <option key={item} value={item}>{label(item)}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy}
                onClick={() => void updateMember(member, { active: !member.active })}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                  member.active ? "border-rose-200 bg-rose-50 text-rose-700" : "border-ledger/20 bg-ledger-tint text-ledger"
                }`}
              >
                {busy ? "Saving…" : member.active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          );
        })}
        {!loading && members.length === 0 && !error ? (
          <p className="rounded-xl border border-dashed border-rule px-4 py-8 text-center text-sm text-ink-faint">
            No team members yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
