"use client";

import { useState } from "react";
import Link from "next/link";
import type { WhatsAppWorkspace } from "@/lib/whatsapp/workspaceModel";

export default function WorkspaceSwitcher({
  currentWorkspaceId,
  workspaces,
  platformAdmin,
}: {
  currentWorkspaceId: string;
  workspaces: WhatsAppWorkspace[];
  platformAdmin: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function changeWorkspace(workspaceId: string) {
    if (!workspaceId || workspaceId === currentWorkspaceId || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/whatsapp/workspaces/select/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to switch workspace.");
      window.location.assign("/admin/whatsapp/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to switch workspace.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
      <label className="block text-[0.58rem] font-semibold uppercase tracking-[.16em] text-white/40">Workspace</label>
      <div className="mt-1.5 flex items-center gap-2">
        <select
          value={currentWorkspaceId}
          disabled={busy}
          onChange={(event) => void changeWorkspace(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0a2c20] px-2.5 py-2 text-xs font-semibold text-white outline-none disabled:opacity-60"
          aria-label="Current WhatsApp workspace"
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>{workspace.name}{workspace.status === "SUSPENDED" ? " · Suspended" : ""}</option>
          ))}
        </select>
        {platformAdmin ? (
          <Link href="/admin/whatsapp/workspaces/" className="rounded-lg border border-white/10 px-2.5 py-2 text-[0.65rem] font-semibold text-white/75 hover:bg-white/10 hover:text-white">Manage</Link>
        ) : null}
      </div>
      {error ? <p className="mt-1.5 text-[0.62rem] leading-4 text-rose-200">{error}</p> : null}
    </div>
  );
}
