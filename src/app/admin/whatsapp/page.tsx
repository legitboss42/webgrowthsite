import type { Metadata } from "next";
import { cookies } from "next/headers";
import InternalUtilityUnlockForm from "@/components/internal/InternalUtilityUnlockForm";
import {
  getInternalUtilityCookieName,
  getInternalUtilityLocalPassphrase,
  readInternalUtilityCookie,
} from "@/lib/internalUtilityAuth";
import { filterWhatsAppLeads, type WhatsAppLeadFilter, type WhatsAppLeadRow } from "./dashboard";

export const metadata: Metadata = {
  title: "WhatsApp Leads | Web Growth",
  robots: { index: false, follow: false },
};

const filters: WhatsAppLeadFilter[] = ["ALL", "HOT", "WARM", "REVIEW", "PRICING", "MEETING", "PROPOSAL"];

async function getLeads(): Promise<WhatsAppLeadRow[]> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return [];
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/whatsapp_conversations?select=id,status,intent,human_review_required,last_message_at,whatsapp_contacts!inner(wa_id,display_name,website,source,lead_temperature)&order=last_message_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store",
  });
  if (!response.ok) { console.error("Unable to load WhatsApp leads", { status: response.status }); return []; }
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const contact = row.whatsapp_contacts as Record<string, unknown> | undefined;
    return { id: String(row.id), status: String(row.status || "open"), intent: typeof row.intent === "string" ? row.intent : undefined, human_review_required: row.human_review_required === true, last_message_at: typeof row.last_message_at === "string" ? row.last_message_at : undefined, wa_id: String(contact?.wa_id || ""), display_name: typeof contact?.display_name === "string" ? contact.display_name : undefined, website: typeof contact?.website === "string" ? contact.website : undefined, source: typeof contact?.source === "string" ? contact.source : undefined, lead_temperature: contact?.lead_temperature === "HOT" || contact?.lead_temperature === "WARM" ? contact.lead_temperature : "COLD" };
  });
}

export default async function WhatsAppAdminPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const cookieStore = await cookies();
  const unlocked = Boolean(readInternalUtilityCookie(cookieStore.get(getInternalUtilityCookieName())?.value));
  if (!unlocked) return <main className="min-h-screen bg-[#050806] px-6 py-16 text-white"><div className="mx-auto max-w-4xl"><InternalUtilityUnlockForm localHint={getInternalUtilityLocalPassphrase() || undefined} /></div></main>;
  const params = await searchParams;
  const filter = filters.includes(params.filter as WhatsAppLeadFilter) ? params.filter as WhatsAppLeadFilter : "ALL";
  const leads = filterWhatsAppLeads(await getLeads(), filter);
  return <main className="min-h-screen bg-[#050806] px-6 py-12 text-white"><div className="mx-auto max-w-6xl"><p className="text-xs uppercase tracking-[.2em] text-emerald-300">Internal lead queue</p><h1 className="mt-3 text-4xl font-semibold">WhatsApp leads</h1><nav className="mt-6 flex flex-wrap gap-2">{filters.map((item) => <a key={item} href={`/admin/whatsapp/?filter=${item}`} className={`rounded-full px-4 py-2 text-sm ${filter === item ? "bg-emerald-500 text-black" : "bg-white/10 text-white/80"}`}>{item}</a>)}</nav><div className="mt-8 overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-white/5 text-white/60"><tr>{["Lead", "WhatsApp", "Website", "Source", "Intent", "Temperature", "Review", "Last contact", "Status"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{leads.map((lead) => <tr key={lead.id} className="border-t border-white/10"><td className="px-4 py-4">{lead.display_name || "Unknown"}</td><td className="px-4 py-4">{lead.wa_id}</td><td className="px-4 py-4">{lead.website || "—"}</td><td className="px-4 py-4">{lead.source || "WhatsApp"}</td><td className="px-4 py-4">{lead.intent || "—"}</td><td className="px-4 py-4">{lead.lead_temperature}</td><td className="px-4 py-4">{lead.human_review_required ? "Needs review" : "—"}</td><td className="px-4 py-4">{lead.last_message_at ? new Date(lead.last_message_at).toLocaleString() : "—"}</td><td className="px-4 py-4">{lead.status}</td></tr>)}{leads.length === 0 ? <tr><td colSpan={9} className="px-4 py-10 text-center text-white/60">No leads match this filter yet.</td></tr> : null}</tbody></table></div></div></main>;
}
