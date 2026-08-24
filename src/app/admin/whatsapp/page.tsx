import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import InternalUtilityUnlockForm from "@/components/internal/InternalUtilityUnlockForm";
import { getInternalUtilityLocalPassphrase } from "@/lib/internalUtilityAuth";
import { hasWhatsAppAdminAccess } from "./auth";
import WhatsAppInboxAutoRefresh from "./AutoRefresh";
import ReplyComposer from "./ReplyComposer";
import {
  buildWhatsAppDashboardModel,
  buildWhatsAppReplyComposerState,
  type WhatsAppLeadFilter,
  type WhatsAppLeadMessage,
  type WhatsAppLeadRow,
} from "./dashboard";

export const metadata: Metadata = {
  title: "WhatsApp Leads | Web Growth",
  robots: { index: false, follow: false },
};

const filters: WhatsAppLeadFilter[] = ["ALL", "HOT", "WARM", "REVIEW", "PRICING", "MEETING", "PROPOSAL"];

async function readJson<T>(url: string, key: string) {
  const response = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`WhatsApp admin fetch failed: ${response.status}`);
  return response.json() as Promise<T>;
}

async function getLeads(): Promise<WhatsAppLeadRow[]> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return [];

  try {
    const rows = await readJson<Array<Record<string, unknown>>>(
      `${url.replace(/\/$/, "")}/rest/v1/whatsapp_conversations?select=id,status,intent,human_review_required,last_message_at,whatsapp_contacts!inner(wa_id,display_name,website,source,lead_temperature)&order=last_message_at.desc`,
      key,
    );

    return rows.map((row) => {
      const contact = row.whatsapp_contacts as Record<string, unknown> | undefined;
      return {
        id: String(row.id),
        status: String(row.status || "open"),
        intent: typeof row.intent === "string" ? row.intent : undefined,
        human_review_required: row.human_review_required === true,
        last_message_at: typeof row.last_message_at === "string" ? row.last_message_at : undefined,
        wa_id: String(contact?.wa_id || ""),
        display_name: typeof contact?.display_name === "string" ? contact.display_name : undefined,
        website: typeof contact?.website === "string" ? contact.website : undefined,
        source: typeof contact?.source === "string" ? contact.source : undefined,
        lead_temperature:
          contact?.lead_temperature === "HOT" || contact?.lead_temperature === "WARM"
            ? contact.lead_temperature
            : "COLD",
      };
    });
  } catch (error) {
    console.error("Unable to load WhatsApp leads", error);
    return [];
  }
}

async function getConversationMessages(conversationId: string | undefined): Promise<WhatsAppLeadMessage[]> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key || !conversationId) return [];

  try {
    const rows = await readJson<Array<Record<string, unknown>>>(
      `${url.replace(/\/$/, "")}/rest/v1/whatsapp_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=id,whatsapp_message_id,conversation_id,direction,message_text,message_timestamp,delivery_status&order=message_timestamp.asc`,
      key,
    );

    return rows.map((row) => ({
      id: String(row.id),
      whatsapp_message_id: typeof row.whatsapp_message_id === "string" ? row.whatsapp_message_id : undefined,
      conversation_id: String(row.conversation_id || conversationId),
      direction: row.direction === "outbound" ? "outbound" : "inbound",
      message_text: typeof row.message_text === "string" ? row.message_text : undefined,
      message_timestamp: typeof row.message_timestamp === "string" ? row.message_timestamp : undefined,
      delivery_status: typeof row.delivery_status === "string" ? row.delivery_status : undefined,
    }));
  } catch (error) {
    console.error("Unable to load WhatsApp conversation messages", error);
    return [];
  }
}

function formatDateTime(value: string | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function getTemperatureClasses(temperature: WhatsAppLeadRow["lead_temperature"]) {
  if (temperature === "HOT") return "bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/40";
  if (temperature === "WARM") return "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40";
  return "bg-white/10 text-white/70 ring-1 ring-white/10";
}

function getReviewClasses(needsReview: boolean) {
  return needsReview
    ? "bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/30"
    : "bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/30";
}

function getFilterHref(filter: WhatsAppLeadFilter, selectedLeadId?: string) {
  const query = new URLSearchParams();
  if (filter !== "ALL") query.set("filter", filter);
  if (selectedLeadId) query.set("lead", selectedLeadId);
  const suffix = query.toString();
  return suffix ? `/admin/whatsapp/?${suffix}` : "/admin/whatsapp/";
}

function getLeadHref(filter: WhatsAppLeadFilter, leadId: string) {
  const query = new URLSearchParams();
  if (filter !== "ALL") query.set("filter", filter);
  query.set("lead", leadId);
  return `/admin/whatsapp/?${query.toString()}`;
}

export default async function WhatsAppAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; lead?: string }>;
}) {
  const cookieStore = await cookies();
  const unlocked = hasWhatsAppAdminAccess(cookieStore);

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-[#050806] px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <InternalUtilityUnlockForm localHint={getInternalUtilityLocalPassphrase() || undefined} />
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const filter = filters.includes(params.filter as WhatsAppLeadFilter)
    ? (params.filter as WhatsAppLeadFilter)
    : "ALL";

  const leadRows = await getLeads();
  const initialModel = buildWhatsAppDashboardModel({
    leads: leadRows,
    messages: [],
    filter,
    selectedLeadId: params.lead,
  });
  const selectedMessages = await getConversationMessages(initialModel.selectedLead?.id);
  const model = buildWhatsAppDashboardModel({
    leads: leadRows,
    messages: selectedMessages,
    filter,
    selectedLeadId: params.lead,
  });
  const composerState = buildWhatsAppReplyComposerState({
    selectedLead: model.selectedLead,
    selectedMessages: model.selectedMessages,
    senderConfigured: Boolean(
      process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
    ),
  });

  return (
    <main className="min-h-screen bg-[#050806] px-6 py-12 text-white">
      <WhatsAppInboxAutoRefresh />
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[.2em] text-emerald-300">Internal lead queue</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">WhatsApp leads</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70">
              Review inbound WhatsApp leads, spot commercial escalations quickly, and read the most recent
              conversation context before replying.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "All leads", value: model.filterCounts.ALL },
              { label: "Hot leads", value: model.filterCounts.HOT },
              { label: "Needs review", value: model.filterCounts.REVIEW },
              { label: "Open conversations", value: model.filteredLeads.filter((lead) => lead.status === "open").length },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[.18em] text-white/45">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <nav className="mt-8 flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = filter === item;
            return (
              <Link
                key={item}
                href={getFilterHref(item, model.selectedLead?.id)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active ? "bg-emerald-400 text-black" : "bg-white/10 text-white/80 hover:bg-white/15"
                }`}
              >
                {item}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active ? "bg-black/15" : "bg-black/20 text-white/65"}`}>
                  {model.filterCounts[item]}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-white/5 text-white/60">
                  <tr>
                    {["Lead", "WhatsApp", "Website", "Source", "Intent", "Temperature", "Review", "Last contact", "Status"].map(
                      (heading) => (
                        <th key={heading} className="px-4 py-3 font-medium">
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {model.filteredLeads.map((lead) => {
                    const active = model.selectedLead?.id === lead.id;
                    return (
                      <tr
                        key={lead.id}
                        className={`border-t border-white/10 transition ${
                          active ? "bg-emerald-500/10" : "hover:bg-white/[0.035]"
                        }`}
                      >
                        <td className="px-4 py-4">
                          <Link href={getLeadHref(filter, lead.id)} className="block">
                            <span className="font-medium text-white">{lead.display_name || "Unknown"}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-white/80">{lead.wa_id}</td>
                        <td className="px-4 py-4">
                          {lead.website ? (
                            <a href={lead.website} target="_blank" rel="noreferrer" className="text-emerald-200 underline decoration-emerald-500/40 underline-offset-4">
                              {lead.website}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-4">{lead.source || "WhatsApp"}</td>
                        <td className="px-4 py-4">{lead.intent || "—"}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTemperatureClasses(lead.lead_temperature)}`}>
                            {lead.lead_temperature}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getReviewClasses(lead.human_review_required)}`}>
                            {lead.human_review_required ? "Needs review" : "Clear"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-white/70">{formatDateTime(lead.last_message_at)}</td>
                        <td className="px-4 py-4 uppercase tracking-[.14em] text-white/65">{lead.status}</td>
                      </tr>
                    );
                  })}
                  {model.filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-white/60">
                        No leads match this filter yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            {model.selectedLead ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[.18em] text-emerald-300">Selected conversation</p>
                    <h2 className="mt-2 text-2xl font-semibold">{model.selectedLead.display_name || "Unknown lead"}</h2>
                    <p className="mt-2 font-mono text-xs text-white/60">{model.selectedLead.wa_id}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTemperatureClasses(
                      model.selectedLead.lead_temperature,
                    )}`}
                  >
                    {model.selectedLead.lead_temperature}
                  </span>
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                    <dt className="text-xs uppercase tracking-[.18em] text-white/45">Intent</dt>
                    <dd className="mt-2 text-white">{model.selectedLead.intent || "—"}</dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                    <dt className="text-xs uppercase tracking-[.18em] text-white/45">Status</dt>
                    <dd className="mt-2 uppercase tracking-[.14em] text-white/75">{model.selectedLead.status}</dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                    <dt className="text-xs uppercase tracking-[.18em] text-white/45">Last contact</dt>
                    <dd className="mt-2 text-white">{formatDateTime(model.selectedLead.last_message_at)}</dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                    <dt className="text-xs uppercase tracking-[.18em] text-white/45">Review</dt>
                    <dd className="mt-2 text-white">{model.selectedLead.human_review_required ? "Required" : "Not required"}</dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[.18em] text-white/70">Conversation history</h3>
                    <span className="text-xs text-white/45">{model.selectedMessages.length} message(s)</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {model.selectedMessages.length ? (
                      model.selectedMessages.map((message) => (
                        <article
                          key={message.id}
                          className={`rounded-2xl px-4 py-3 ${
                            message.direction === "outbound"
                              ? "ml-6 bg-emerald-500/15 text-emerald-50"
                              : "mr-6 bg-white/8 text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[.14em] text-white/50">
                            <span>{message.direction === "outbound" ? "Outbound" : "Inbound"}</span>
                            <span>{formatDateTime(message.message_timestamp)}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.message_text || "No text content stored."}</p>
                          {message.delivery_status ? (
                            <p className="mt-2 text-xs text-white/45">Delivery status: {message.delivery_status}</p>
                          ) : null}
                        </article>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-white/55">
                        No stored conversation messages for this lead yet.
                      </div>
                    )}
                  </div>
                </div>

                <ReplyComposer
                  conversationId={model.selectedLead.id}
                  waId={model.selectedLead.wa_id}
                  composerState={composerState}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/55">
                Select a lead to view conversation details.
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
