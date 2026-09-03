import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import type { WhatsAppCallRow } from "@/lib/whatsapp/callHistory";

export const metadata: Metadata = { title: "WhatsApp Call History | Web Growth", robots: { index: false, follow: false } };

function formatWhen(value: string | null) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); }
function formatDuration(seconds: number | null) { if (!seconds || seconds < 1) return "—"; const minutes = Math.floor(seconds / 60); const rest = seconds % 60; return minutes ? `${minutes}m ${rest}s` : `${rest}s`; }
function statusClasses(status: string) { const value = status.toLowerCase(); if (["accepted","connected","completed"].includes(value)) return "border-ledger-bright/20 bg-ledger-tint text-ledger-bright"; if (["rejected","failed","missed"].includes(value)) return "border-rose-200 bg-rose-50 text-rose-700"; if (["ringing","connecting"].includes(value)) return "border-brass/20 bg-brass-tint text-brass"; return "border-rule bg-paper-sunk text-ink-faint"; }
function Metric({ label, value, note }: { label: string; value: number | string; note: string }) { return <div className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</p><p className="mt-1 text-xs text-ink-faint">{note}</p></div>; }

export default async function WhatsAppCallsPage({ searchParams }: { searchParams: Promise<{ direction?: string }> }) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white"><div className="w-full max-w-4xl"><GoogleAdminPrompt nextPath="/admin/whatsapp/calls/" adminEmail={getDefaultAdminGoogleEmail()} clientId={getGoogleClientId()} googleReady={isGoogleAuthConfigured()} workspaceTeamAccess /></div></div>;

  const params = await searchParams;
  const direction = params.direction === "inbound" || params.direction === "outbound" ? params.direction : "all";
  const query = ["select=call_id,direction,customer_wa_id,customer_name,status,started_at,answered_at,ended_at,duration_seconds,last_event_at","order=last_event_at.desc","limit=200"];
  if (direction !== "all") query.push(`direction=eq.${direction}`);
  const calls = (await readWhatsAppRows<WhatsAppCallRow>(`whatsapp_calls?${query.join("&")}`)) || [];
  const incoming = calls.filter((call) => call.direction === "inbound").length;
  const outgoing = calls.filter((call) => call.direction === "outbound").length;
  const connected = calls.filter((call) => ["accepted","connected","completed"].includes(call.status.toLowerCase())).length;
  const missed = calls.filter((call) => ["rejected","failed","missed"].includes(call.status.toLowerCase())).length;
  const tabs = [["all","All calls"],["inbound","Incoming"],["outbound","Outgoing"]] as const;

  return <div className="w-full p-3 sm:p-5 lg:p-6">
    <header className="mb-5 flex flex-col gap-4 border-b border-rule pb-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ledger-bright"><span className="h-1.5 w-1.5 rounded-full bg-ledger-bright" />Voice operations</div><h1 className="text-2xl font-semibold text-ink sm:text-3xl">Calls</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-ink-faint">Review incoming and outgoing WhatsApp Calling activity alongside the rest of the customer workspace.</p></div><Link href="/admin/whatsapp/settings/#connection" className="inline-flex w-fit items-center gap-2 rounded-xl border border-rule bg-paper-raised px-3.5 py-2.5 text-xs font-semibold text-ink-soft hover:border-rule-strong hover:text-ink"><WhatsAppIcon name="settings" className="h-4 w-4" />Calling settings</Link></header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Calls in view" value={calls.length} note="Latest 200 events"/><Metric label="Incoming" value={incoming} note="Customer initiated"/><Metric label="Outgoing" value={outgoing} note="Team initiated"/><Metric label="Connected / missed" value={`${connected} / ${missed}`} note="Outcome snapshot"/></section>

    <section className="mt-4 overflow-hidden rounded-2xl border border-rule bg-paper-raised"><div className="flex flex-col gap-3 border-b border-rule p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"><div><p className="text-sm font-semibold text-ink">Call history</p><p className="mt-0.5 text-xs text-ink-faint">Meta Calling API webhook events for this workspace.</p></div><nav className="inline-flex w-fit rounded-xl border border-rule bg-paper p-1">{tabs.map(([value,label])=>{const active=direction===value;const href=value==="all"?"/admin/whatsapp/calls/":`/admin/whatsapp/calls/?direction=${value}`;return <Link key={value} href={href} className={`rounded-lg px-3 py-2 text-xs font-semibold ${active?"bg-ledger-tint text-ledger-bright":"text-ink-faint hover:text-ink"}`}>{label}</Link>;})}</nav></div>
      <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-paper-sunk text-ink-faint"><tr>{["Direction","Contact","Status","Started","Answered","Ended","Duration"].map((h)=><th key={h} className="px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-[.1em]">{h}</th>)}</tr></thead><tbody>{calls.map((call)=><tr key={call.call_id} className="border-t border-rule hover:bg-paper-sunk/40"><td className="px-4 py-3"><span className="inline-flex items-center gap-2 font-medium text-ink"><span className="grid h-8 w-8 place-items-center rounded-lg border border-rule bg-paper"><WhatsAppIcon name="phoneNumbers" className="h-4 w-4" /></span>{call.direction==="inbound"?"Incoming":"Outgoing"}</span></td><td className="px-4 py-3"><p className="font-medium text-ink">{call.customer_name||"Unknown"}</p><p className="font-mono text-xs text-ink-faint">{call.customer_wa_id||"—"}</p></td><td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(call.status)}`}>{call.status}</span></td><td className="px-4 py-3 text-ink-soft">{formatWhen(call.started_at||call.last_event_at)}</td><td className="px-4 py-3 text-ink-soft">{formatWhen(call.answered_at)}</td><td className="px-4 py-3 text-ink-soft">{formatWhen(call.ended_at)}</td><td className="px-4 py-3 text-ink-soft">{formatDuration(call.duration_seconds)}</td></tr>)}{calls.length===0?<tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-ink-faint">No WhatsApp calls have been recorded yet.</td></tr>:null}</tbody></table></div>
      <ul className="divide-y divide-rule lg:hidden">{calls.map((call)=><li key={call.call_id} className="p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-rule bg-paper"><WhatsAppIcon name="phoneNumbers" className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-ink">{call.customer_name||call.customer_wa_id||"Unknown caller"}</p><p className="mt-0.5 text-xs text-ink-faint">{call.direction==="inbound"?"Incoming":"Outgoing"} · {formatWhen(call.started_at||call.last_event_at)}</p></div><span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-medium ${statusClasses(call.status)}`}>{call.status}</span></div><p className="mt-2 font-mono text-xs text-ink-faint">{call.customer_wa_id||"—"}</p><p className="mt-2 text-xs text-ink-soft">Duration: {formatDuration(call.duration_seconds)}</p></div></div></li>)}{calls.length===0?<li className="px-4 py-14 text-center text-sm text-ink-faint">No WhatsApp calls have been recorded yet.</li>:null}</ul>
    </section>
  </div>;
}
