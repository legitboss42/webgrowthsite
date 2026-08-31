import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { hasWhatsAppAdminAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import type { WhatsAppCallRow } from "@/lib/whatsapp/callHistory";

export const metadata: Metadata = {
  title: "WhatsApp Call History | Web Growth",
  robots: { index: false, follow: false },
};

function formatWhen(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds < 1) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes}m ${rest}s` : `${rest}s`;
}

function statusClasses(status: string) {
  const value = status.toLowerCase();
  if (value === "accepted" || value === "connected" || value === "completed") return "bg-ledger-tint text-ledger";
  if (value === "rejected" || value === "failed" || value === "missed") return "bg-rose-50 text-rose-700";
  if (value === "ringing" || value === "connecting") return "bg-brass-tint text-[#6f4f16]";
  return "bg-paper-sunk text-ink-faint";
}

export default async function WhatsAppCallsPage({ searchParams }: { searchParams: Promise<{ direction?: string }> }) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <GoogleAdminPrompt nextPath="/admin/whatsapp/calls/" adminEmail={getDefaultAdminGoogleEmail()} clientId={getGoogleClientId()} googleReady={isGoogleAuthConfigured()} />
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const direction = params.direction === "inbound" || params.direction === "outbound" ? params.direction : "all";
  const query = [
    "select=call_id,direction,customer_wa_id,customer_name,status,started_at,answered_at,ended_at,duration_seconds,last_event_at",
    "order=last_event_at.desc",
    "limit=200",
  ];
  if (direction !== "all") query.push(`direction=eq.${direction}`);
  const calls = (await readWhatsAppRows<WhatsAppCallRow>(`whatsapp_calls?${query.join("&")}`)) || [];

  const tabs = [
    ["all", "All calls"],
    ["inbound", "Incoming"],
    ["outbound", "Outgoing"],
  ] as const;

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map(([value, label]) => {
          const active = direction === value;
          const href = value === "all" ? "/admin/whatsapp/calls/" : `/admin/whatsapp/calls/?direction=${value}`;
          return <Link key={value} href={href} className={`rounded-full px-3 py-1.5 text-xs font-medium ${active ? "bg-ledger-bright text-white" : "border border-rule bg-paper-raised text-ink-soft"}`}>{label}</Link>;
        })}
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-rule bg-paper-raised">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-paper-sunk text-ink-faint"><tr>{["Direction", "Contact", "Status", "Started", "Answered", "Ended", "Duration"].map((h) => <th key={h} className="px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[.1em]">{h}</th>)}</tr></thead>
            <tbody>
              {calls.map((call) => <tr key={call.call_id} className="border-t border-rule">
                <td className="px-4 py-3 font-medium text-ink">{call.direction === "inbound" ? "Incoming" : "Outgoing"}</td>
                <td className="px-4 py-3"><p className="font-medium text-ink">{call.customer_name || "Unknown"}</p><p className="font-mono text-xs text-ink-faint">{call.customer_wa_id || "—"}</p></td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(call.status)}`}>{call.status}</span></td>
                <td className="px-4 py-3 text-ink-soft">{formatWhen(call.started_at || call.last_event_at)}</td>
                <td className="px-4 py-3 text-ink-soft">{formatWhen(call.answered_at)}</td>
                <td className="px-4 py-3 text-ink-soft">{formatWhen(call.ended_at)}</td>
                <td className="px-4 py-3 text-ink-soft">{formatDuration(call.duration_seconds)}</td>
              </tr>)}
              {calls.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-ink-faint">No WhatsApp calls have been recorded yet.</td></tr> : null}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-rule lg:hidden">
          {calls.map((call) => <li key={call.call_id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-ink">{call.customer_name || call.customer_wa_id || "Unknown caller"}</p><p className="mt-0.5 text-xs text-ink-faint">{call.direction === "inbound" ? "Incoming" : "Outgoing"} · {formatWhen(call.started_at || call.last_event_at)}</p></div><span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${statusClasses(call.status)}`}>{call.status}</span></div>
            <p className="mt-2 font-mono text-xs text-ink-faint">{call.customer_wa_id || "—"}</p>
            <p className="mt-2 text-xs text-ink-soft">Duration: {formatDuration(call.duration_seconds)}</p>
          </li>)}
          {calls.length === 0 ? <li className="px-4 py-12 text-center text-sm text-ink-faint">No WhatsApp calls have been recorded yet.</li> : null}
        </ul>
      </section>

      <p className="mt-4 text-xs leading-5 text-ink-faint">History is built from Meta Calling API webhook events. Incoming and outgoing calls appear here once the WABA is subscribed to the <span className="font-mono">calls</span> webhook field.</p>
    </div>
  );
}
