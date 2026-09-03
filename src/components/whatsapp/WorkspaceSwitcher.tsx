"use client";

import { useState } from "react";
import Link from "next/link";
import type { WhatsAppWorkspace } from "@/lib/whatsapp/workspaceModel";

export default function WorkspaceSwitcher({ currentWorkspaceId, workspaces, platformAdmin }: { currentWorkspaceId: string; workspaces: WhatsAppWorkspace[]; platformAdmin: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canSwitch = workspaces.length > 1;

  if (!canSwitch && !platformAdmin) return null;

  async function changeWorkspace(workspaceId: string) {
    if (!workspaceId || workspaceId === currentWorkspaceId || busy) return;
    setBusy(true);
    setError("");
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
    <details className="wg-logo-workspace-switcher relative">
      <summary aria-label="Switch workspace" title="Switch workspace" className="grid h-7 w-5 cursor-pointer list-none place-items-center rounded-md text-white/42 transition hover:bg-white/[.055] hover:text-white/80 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="text-[0.7rem] leading-none">▾</span>
      </summary>
      <div className="absolute left-0 top-[calc(100%+.4rem)] z-[80] w-56 overflow-hidden rounded-xl border border-white/[.09] bg-[#09110e] p-1.5 text-white shadow-2xl">
        <p className="px-2 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[.14em] text-white/35">Workspace</p>
        <div className="space-y-1">
          {workspaces.map((workspace) => {
            const current = workspace.id === currentWorkspaceId;
            return (
              <button key={workspace.id} type="button" disabled={busy || current || workspace.status === "SUSPENDED"} onClick={() => void changeWorkspace(workspace.id)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${current ? "bg-[#103420] text-[#6ee59c]" : "text-white/72 hover:bg-white/[.055] hover:text-white"} disabled:cursor-default disabled:opacity-70`}>
                <span className={`h-2 w-2 flex-none rounded-full ${current ? "bg-[#22c55e]" : "bg-white/20"}`} />
                <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                {current ? <span className="text-[0.55rem] font-semibold uppercase tracking-[.1em]">Current</span> : null}
              </button>
            );
          })}
        </div>
        {platformAdmin ? <Link href="/admin/whatsapp/workspaces/" className="mt-1.5 block border-t border-white/[.07] px-2.5 py-2 text-xs font-semibold text-white/60 hover:text-white">Manage workspaces</Link> : null}
        {error ? <p className="px-2.5 py-2 text-[0.65rem] leading-4 text-rose-200">{error}</p> : null}
      </div>
    </details>
  );
}
