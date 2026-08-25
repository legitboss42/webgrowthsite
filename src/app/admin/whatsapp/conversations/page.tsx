import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import InternalUtilityUnlockForm from "@/components/internal/InternalUtilityUnlockForm";
import { getInternalUtilityLocalPassphrase } from "@/lib/internalUtilityAuth";
import { hasWhatsAppAdminAccess } from "../auth";
import WhatsAppInboxAutoRefresh from "../AutoRefresh";
import ReplyComposer from "../ReplyComposer";
import { readWhatsAppRows } from "../data";
import {
  buildWhatsAppDashboardModel,
  buildWhatsAppReplyComposerState,
  type WhatsAppLeadFilter,
  type WhatsAppLeadMessage,
  type WhatsAppLeadRow,
} from "../dashboard";

export const metadata: Metadata = {
  title: "WhatsApp Leads | Web Growth",
  robots: { index: false, follow: false },
};

const filters: WhatsAppLeadFilter[] = ["ALL", "HOT", "WARM", "REVIEW", "PRICING", "MEETING", "PROPOSAL"];

async function getLeads(): Promise<WhatsAppLeadRow[]> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_conversations?select=id,status,intent,human_review_required,last_message_at,whatsapp_contacts!inner(wa_id,display_name,website,source,lead_temperature)&order=last_message_at.desc`,
  );
  if (!rows) return [];

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
}

async function getConversationMessages(conversationId: string | undefined): Promise<WhatsAppLeadMessage[]> {
  if (!conversationId) return [];

  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=id,whatsapp_message_id,conversation_id,direction,message_type,message_text,message_timestamp,delivery_status,media_id,media_mime_type,media_voice,media_filename&order=message_timestamp.asc`,
  );
  if (!rows) return [];

  return rows.map((row) => ({
    id: String(row.id),
    whatsapp_message_id: typeof row.whatsapp_message_id === "string" ? row.whatsapp_message_id : undefined,
    conversation_id: String(row.conversation_id || conversationId),
    direction: row.direction === "outbound" ? "outbound" : "inbound",
    message_type: typeof row.message_type === "string" ? row.message_type : undefined,
    message_text: typeof row.message_text === "string" ? row.message_text : undefined,
    message_timestamp: typeof row.message_timestamp === "string" ? row.message_timestamp : undefined,
    delivery_status: typeof row.delivery_status === "string" ? row.delivery_status : undefined,
    media_id: typeof row.media_id === "string" ? row.media_id : undefined,
    media_mime_type: typeof row.media_mime_type === "string" ? row.media_mime_type : undefined,
    media_voice: row.media_voice === true,
    media_filename: typeof row.media_filename === "string" ? row.media_filename : undefined,
  }));
}

function formatDateTime(value: string | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function getInitials(name: string | undefined, waId: string) {
  const source = (name || "").trim();
  if (!source) return waId.slice(-2) || "??";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getTemperatureClasses(temperature: WhatsAppLeadRow["lead_temperature"]) {
  if (temperature === "HOT") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  if (temperature === "WARM") return "bg-brass-tint text-[#6f4f16] ring-1 ring-brass/25";
  return "bg-paper-sunk text-ink-faint ring-1 ring-rule";
}

function getReviewClasses(needsReview: boolean) {
  return needsReview
    ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
    : "bg-ledger-tint text-ledger ring-1 ring-ledger/15";
}

function getMessageFallbackText(message: WhatsAppLeadMessage) {
  if (message.message_type === "audio") return message.media_voice ? "Voice note" : "Audio message";
  return "No text content stored.";
}

function getFilterHref(filter: WhatsAppLeadFilter, selectedLeadId?: string) {
  const query = new URLSearchParams();
  if (filter !== "ALL") query.set("filter", filter);
  if (selectedLeadId) query.set("lead", selectedLeadId);
  const suffix = query.toString();
  return suffix ? `/admin/whatsapp/conversations/?${suffix}` : "/admin/whatsapp/conversations/";
}

function getLeadHref(filter: WhatsAppLeadFilter, leadId: string) {
  const query = new URLSearchParams();
  if (filter !== "ALL") query.set("filter", filter);
  query.set("lead", leadId);
  return `/admin/whatsapp/conversations/?${query.toString()}`;
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
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <InternalUtilityUnlockForm localHint={getInternalUtilityLocalPassphrase() || undefined} />
        </div>
      </div>
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

  const summaryCards = [
    { label: "All leads", value: model.filterCounts.ALL },
    { label: "Hot leads", value: model.filterCounts.HOT },
    { label: "Needs review", value: model.filterCounts.REVIEW },
    { label: "Open", value: model.filteredLeads.filter((lead) => lead.status === "open").length },
  ];

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <WhatsAppInboxAutoRefresh />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map((item) => (
          <div key={item.label} className="rounded-xl border border-rule bg-paper-raised px-4 py-3">
            <p className="text-[0.65rem] font-medium uppercase tracking-[.14em] text-ink-faint">
              {item.label}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <nav aria-label="Lead filters" className="mt-5 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 pb-1 sm:w-auto sm:flex-wrap">
          {filters.map((item) => {
            const active = filter === item;
            return (
              <Link
                key={item}
                href={getFilterHref(item, model.selectedLead?.id)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex flex-none items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-ledger-bright text-white"
                    : "border border-rule bg-paper-raised text-ink-soft hover:border-rule-strong hover:text-ink"
                }`}
              >
                {item}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[0.65rem] tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-paper-sunk text-ink-faint"
                  }`}
                >
                  {model.filterCounts[item]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-rule bg-paper-raised">
          {/* Mobile + tablet: a tap-friendly card list instead of a wide table */}
          <ul className="divide-y divide-rule lg:hidden">
            {model.filteredLeads.map((lead) => {
              const active = model.selectedLead?.id === lead.id;
              return (
                <li key={lead.id} className={active ? "bg-ledger-tint/50" : undefined}>
                  <Link href={getLeadHref(filter, lead.id)} className="flex gap-3 px-4 py-3.5">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-paper-sunk text-xs font-semibold text-ink-soft">
                      {getInitials(lead.display_name, lead.wa_id)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-ink">
                          {lead.display_name || "Unknown"}
                        </span>
                        <span
                          className={`ml-auto flex-none rounded-full px-2 py-0.5 text-[0.625rem] font-semibold ${getTemperatureClasses(
                            lead.lead_temperature,
                          )}`}
                        >
                          {lead.lead_temperature}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-xs text-ink-faint">
                        {lead.wa_id}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-ink-faint">
                        <span className="uppercase tracking-[.1em]">{lead.status}</span>
                        <span aria-hidden="true">·</span>
                        <span>{lead.intent || "No intent"}</span>
                        {lead.human_review_required ? (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
                            Needs review
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-[0.7rem] text-ink-faint">
                        {formatDateTime(lead.last_message_at)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
            {model.filteredLeads.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-ink-faint">
                No leads match this filter yet.
              </li>
            ) : null}
          </ul>

          {/* Desktop: the full lead table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-paper-sunk text-ink-faint">
                <tr>
                  {["Lead", "WhatsApp", "Website", "Source", "Intent", "Temperature", "Review", "Last contact", "Status"].map(
                    (heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[.1em]"
                      >
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
                      className={`border-t border-rule transition ${
                        active ? "bg-ledger-tint/60" : "hover:bg-paper-sunk/60"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link href={getLeadHref(filter, lead.id)} className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-paper-sunk text-[0.7rem] font-semibold text-ink-soft">
                            {getInitials(lead.display_name, lead.wa_id)}
                          </span>
                          <span className="font-medium text-ink">{lead.display_name || "Unknown"}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-soft">{lead.wa_id}</td>
                      <td className="px-4 py-3">
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ledger underline decoration-ledger/30 underline-offset-4 hover:text-ledger-bright"
                          >
                            {lead.website}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{lead.source || "WhatsApp"}</td>
                      <td className="px-4 py-3 text-ink-soft">{lead.intent || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTemperatureClasses(
                            lead.lead_temperature,
                          )}`}
                        >
                          {lead.lead_temperature}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getReviewClasses(
                            lead.human_review_required,
                          )}`}
                        >
                          {lead.human_review_required ? "Needs review" : "Clear"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-faint">{formatDateTime(lead.last_message_at)}</td>
                      <td className="px-4 py-3 text-xs uppercase tracking-[.12em] text-ink-faint">
                        {lead.status}
                      </td>
                    </tr>
                  );
                })}
                {model.filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-ink-faint">
                      No leads match this filter yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5">
          {model.selectedLead ? (
            <>
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-ledger text-sm font-semibold text-on-dark">
                  {getInitials(model.selectedLead.display_name, model.selectedLead.wa_id)}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-xl font-semibold text-ink">
                    {model.selectedLead.display_name || "Unknown lead"}
                  </h2>
                  <p className="mt-0.5 truncate font-mono text-xs text-ink-faint">
                    {model.selectedLead.wa_id}
                  </p>
                </div>
                <span
                  className={`flex-none rounded-full px-2.5 py-1 text-xs font-medium ${getTemperatureClasses(
                    model.selectedLead.lead_temperature,
                  )}`}
                >
                  {model.selectedLead.lead_temperature}
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
                <div className="rounded-lg border border-rule bg-paper px-3 py-2.5">
                  <dt className="text-[0.65rem] uppercase tracking-[.14em] text-ink-faint">Intent</dt>
                  <dd className="mt-1 text-ink">{model.selectedLead.intent || "—"}</dd>
                </div>
                <div className="rounded-lg border border-rule bg-paper px-3 py-2.5">
                  <dt className="text-[0.65rem] uppercase tracking-[.14em] text-ink-faint">Status</dt>
                  <dd className="mt-1 uppercase tracking-[.1em] text-ink">
                    {model.selectedLead.status}
                  </dd>
                </div>
                <div className="rounded-lg border border-rule bg-paper px-3 py-2.5">
                  <dt className="text-[0.65rem] uppercase tracking-[.14em] text-ink-faint">
                    Last contact
                  </dt>
                  <dd className="mt-1 text-ink">{formatDateTime(model.selectedLead.last_message_at)}</dd>
                </div>
                <div className="rounded-lg border border-rule bg-paper px-3 py-2.5">
                  <dt className="text-[0.65rem] uppercase tracking-[.14em] text-ink-faint">Review</dt>
                  <dd className="mt-1 text-ink">
                    {model.selectedLead.human_review_required ? "Required" : "Not required"}
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[0.7rem] font-semibold uppercase tracking-[.16em] text-ink-faint">
                    Conversation history
                  </h3>
                  <span className="text-xs tabular-nums text-ink-faint">
                    {model.selectedMessages.length} message(s)
                  </span>
                </div>
                <div className="mt-3 space-y-2.5">
                  {model.selectedMessages.length ? (
                    model.selectedMessages.map((message) => (
                      <article
                        key={message.id}
                        className={`rounded-xl px-3.5 py-2.5 ${
                          message.direction === "outbound"
                            ? "ml-5 bg-ledger-bright text-white"
                            : "mr-5 border border-rule bg-paper text-ink"
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between gap-3 text-[0.65rem] uppercase tracking-[.12em] ${
                            message.direction === "outbound" ? "text-white/70" : "text-ink-faint"
                          }`}
                        >
                          <span>{message.direction === "outbound" ? "Outbound" : "Inbound"}</span>
                          <span>{formatDateTime(message.message_timestamp)}</span>
                        </div>
                        {message.message_type === "audio" && message.media_id ? (
                          <div
                            className={`mt-2.5 rounded-lg p-2.5 ${
                              message.direction === "outbound"
                                ? "bg-white/15"
                                : "border border-rule bg-paper-sunk"
                            }`}
                          >
                            <p
                              className={`mb-2 text-[0.65rem] font-medium uppercase tracking-[.12em] ${
                                message.direction === "outbound" ? "text-white/80" : "text-ink-faint"
                              }`}
                            >
                              {message.media_voice ? "Voice note" : "Audio message"}
                            </p>
                            <audio
                              controls
                              preload="none"
                              src={`/api/admin/whatsapp/media/${encodeURIComponent(message.media_id)}`}
                              className="w-full"
                            >
                              Your browser cannot play this WhatsApp audio message.
                            </audio>
                            {message.media_filename || message.media_mime_type ? (
                              <p
                                className={`mt-2 text-[0.7rem] ${
                                  message.direction === "outbound" ? "text-white/65" : "text-ink-faint"
                                }`}
                              >
                                {[message.media_filename, message.media_mime_type].filter(Boolean).join(" · ")}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6">
                            {message.message_text || getMessageFallbackText(message)}
                          </p>
                        )}
                        {message.delivery_status ? (
                          <p
                            className={`mt-1.5 text-[0.7rem] ${
                              message.direction === "outbound" ? "text-white/65" : "text-ink-faint"
                            }`}
                          >
                            Delivery status: {message.delivery_status}
                          </p>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-rule-strong px-4 py-6 text-sm text-ink-faint">
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
            <div className="rounded-lg border border-dashed border-rule-strong px-4 py-12 text-center text-sm text-ink-faint">
              Select a lead to view conversation details.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
