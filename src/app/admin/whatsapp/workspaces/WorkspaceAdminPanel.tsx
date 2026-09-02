"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Row = Record<string, unknown>;
type Dashboard = { workspaces: Row[]; connections: Row[]; entitlements: Row[]; members: Row[] };

function text(value: unknown) { return typeof value === "string" ? value : ""; }
function number(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }

export default function WorkspaceAdminPanel() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [create, setCreate] = useState({ name: "", slug: "", ownerEmail: "" });
  const [owner, setOwner] = useState({ email: "", displayName: "" });
  const [connection, setConnection] = useState({ wabaId: "", phoneNumberId: "", displayPhoneNumber: "", businessName: "", accessToken: "", apiVersion: "v26.0" });
  const [plan, setPlan] = useState({ planCode: "FREE", maxTeamMembers: 3, maxAutomations: 5, maxCampaignRecipientsMonthly: 500, maxAiRequestsDaily: 0 });

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/whatsapp/workspaces/", { cache: "no-store" });
    const body = await response.json().catch(() => ({})) as Dashboard & { error?: string };
    if (!response.ok) throw new Error(body.error || "Unable to load workspaces.");
    setData(body);
    setSelectedId((current) => current || text(body.workspaces?.[0]?.id));
  }, []);

  useEffect(() => { void refresh().catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load workspaces.")); }, [refresh]);

  const selected = useMemo(() => data?.workspaces.find((row) => text(row.id) === selectedId), [data, selectedId]);
  const selectedConnection = useMemo(() => data?.connections.find((row) => text(row.workspace_id) === selectedId), [data, selectedId]);
  const selectedPlan = useMemo(() => data?.entitlements.find((row) => text(row.workspace_id) === selectedId), [data, selectedId]);
  const selectedMembers = useMemo(() => data?.members.filter((row) => text(row.workspace_id) === selectedId) || [], [data, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setConnection({
      wabaId: text(selectedConnection?.waba_id), phoneNumberId: text(selectedConnection?.phone_number_id), displayPhoneNumber: text(selectedConnection?.display_phone_number),
      businessName: text(selectedConnection?.business_name), accessToken: "", apiVersion: text(selectedConnection?.api_version) || "v26.0",
    });
    setPlan({
      planCode: text(selectedPlan?.plan_code) || "FREE", maxTeamMembers: number(selectedPlan?.max_team_members, 3), maxAutomations: number(selectedPlan?.max_automations, 5),
      maxCampaignRecipientsMonthly: number(selectedPlan?.max_campaign_recipients_monthly, 500), maxAiRequestsDaily: number(selectedPlan?.max_ai_requests_daily, 0),
    });
  }, [selectedId, selectedConnection, selectedPlan]);

  async function action(payload: Record<string, unknown>, success: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/whatsapp/workspaces/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json().catch(() => ({})) as { error?: string; workspace?: { id?: string } };
      if (!response.ok) throw new Error(body.error || "Workspace action failed.");
      await refresh();
      if (body.workspace?.id) setSelectedId(body.workspace.id);
      setMessage(success);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Workspace action failed."); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-ink-faint">Platform control plane</p><h2 className="mt-1 font-display text-2xl font-semibold text-ink">Workspaces</h2><p className="mt-1 text-sm text-ink-soft">Create client tenants, assign ownership, connect Meta and set plan limits.</p></div><a href="/admin/whatsapp/" className="rounded-xl border border-rule bg-paper-raised px-4 py-2 text-sm font-semibold text-ink">Back to workspace</a></div>

    {message ? <div className="rounded-xl border border-rule bg-paper-raised px-4 py-3 text-sm text-ink-soft">{message}</div> : null}

    <section className="grid gap-4 rounded-2xl border border-rule bg-paper-raised p-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="space-y-3"><h3 className="font-semibold text-ink">Create workspace</h3><input value={create.name} onChange={(e)=>setCreate({...create,name:e.target.value})} placeholder="Business name" className="w-full rounded-xl border border-rule bg-paper px-3 py-2 text-sm"/><input value={create.slug} onChange={(e)=>setCreate({...create,slug:e.target.value})} placeholder="Slug (optional)" className="w-full rounded-xl border border-rule bg-paper px-3 py-2 text-sm"/><input value={create.ownerEmail} onChange={(e)=>setCreate({...create,ownerEmail:e.target.value})} placeholder="Owner email" type="email" className="w-full rounded-xl border border-rule bg-paper px-3 py-2 text-sm"/><button disabled={busy||!create.name.trim()} onClick={()=>void action({action:"CREATE",...create},"Workspace created.")} className="rounded-xl bg-ledger px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Create workspace</button></div>
      <div><label className="text-xs font-semibold text-ink-soft">Selected workspace</label><select value={selectedId} onChange={(e)=>setSelectedId(e.target.value)} className="mt-2 w-full rounded-xl border border-rule bg-paper px-3 py-2 text-sm">{data?.workspaces.map((row)=><option key={text(row.id)} value={text(row.id)}>{text(row.name)} · {text(row.status)}</option>)}</select>{selected ? <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-soft"><div className="rounded-xl bg-paper-sunk p-3">Plan<br/><strong className="text-ink">{text(selected.plan_code)||text(selectedPlan?.plan_code)||"FREE"}</strong></div><div className="rounded-xl bg-paper-sunk p-3">Members<br/><strong className="text-ink">{selectedMembers.length}</strong></div></div>:null}<div className="mt-3 flex gap-2"><button disabled={busy||!selectedId} onClick={()=>void action({action:"STATUS",workspaceId:selectedId,status:text(selected?.status)==="SUSPENDED"?"ACTIVE":"SUSPENDED"},text(selected?.status)==="SUSPENDED"?"Workspace activated.":"Workspace suspended.")} className="rounded-xl border border-rule px-3 py-2 text-xs font-semibold text-ink">{text(selected?.status)==="SUSPENDED"?"Activate":"Suspend"}</button></div></div>
    </section>

    {selectedId ? <div className="grid gap-4 xl:grid-cols-3">
      <section className="rounded-2xl border border-rule bg-paper-raised p-4"><h3 className="font-semibold text-ink">Owner</h3><p className="mt-1 text-xs text-ink-faint">Add or promote the client owner for this workspace.</p><div className="mt-3 space-y-2"><input value={owner.email} onChange={(e)=>setOwner({...owner,email:e.target.value})} placeholder="owner@example.com" type="email" className="w-full rounded-xl border border-rule bg-paper px-3 py-2 text-sm"/><input value={owner.displayName} onChange={(e)=>setOwner({...owner,displayName:e.target.value})} placeholder="Display name" className="w-full rounded-xl border border-rule bg-paper px-3 py-2 text-sm"/><button disabled={busy||!owner.email.trim()} onClick={()=>void action({action:"OWNER",workspaceId:selectedId,...owner},"Workspace owner saved.")} className="rounded-xl bg-ledger px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save owner</button></div></section>

      <section className="rounded-2xl border border-rule bg-paper-raised p-4"><h3 className="font-semibold text-ink">Meta connection</h3><p className="mt-1 text-xs text-ink-faint">Client tokens are encrypted server-side. Leaving token blank preserves the stored credential.</p><div className="mt-3 space-y-2">{([['businessName','Business name'],['wabaId','WABA ID'],['phoneNumberId','Phone Number ID'],['displayPhoneNumber','Display phone'],['accessToken','Access token'],['apiVersion','API version']] as const).map(([key,label])=><input key={key} value={connection[key]} onChange={(e)=>setConnection({...connection,[key]:e.target.value})} placeholder={label} type={key==='accessToken'?'password':'text'} className="w-full rounded-xl border border-rule bg-paper px-3 py-2 text-sm"/>)}<button disabled={busy} onClick={()=>void action({action:"CONNECTION",workspaceId:selectedId,...connection},"Meta connection saved.")} className="rounded-xl bg-ledger px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save connection</button>{selectedConnection?.token_last_four ? <p className="text-[0.68rem] text-ink-faint">Stored token ends in ••••{text(selectedConnection.token_last_four)}</p>:null}</div></section>

      <section className="rounded-2xl border border-rule bg-paper-raised p-4"><h3 className="font-semibold text-ink">Plan limits</h3><div className="mt-3 space-y-2"><input value={plan.planCode} onChange={(e)=>setPlan({...plan,planCode:e.target.value})} placeholder="Plan code" className="w-full rounded-xl border border-rule bg-paper px-3 py-2 text-sm"/>{([['maxTeamMembers','Team members'],['maxAutomations','Automations'],['maxCampaignRecipientsMonthly','Campaign recipients / month'],['maxAiRequestsDaily','AI requests / day']] as const).map(([key,label])=><label key={key} className="block text-xs font-semibold text-ink-soft">{label}<input type="number" min="0" value={plan[key]} onChange={(e)=>setPlan({...plan,[key]:Number(e.target.value)})} className="mt-1 w-full rounded-xl border border-rule bg-paper px-3 py-2 text-sm"/></label>)}<button disabled={busy} onClick={()=>void action({action:"PLAN",workspaceId:selectedId,...plan},"Plan limits saved.")} className="rounded-xl bg-ledger px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save plan</button></div></section>
    </div>:null}
  </main>;
}
