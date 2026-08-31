import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, isGoogleAuthConfigured } from "@/lib/googleAuth";
import ContactAvatar from "@/components/whatsapp/ContactAvatar";
import MessageStatus from "@/components/whatsapp/MessageStatus";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import { loadWhatsAppSettings } from "@/lib/whatsapp/settingsStore";
import { hasWhatsAppAdminAccess } from "../auth";
import WhatsAppInboxAutoRefresh from "../AutoRefresh";
import MessageMedia, { hasRenderableWhatsAppMedia } from "../MessageMedia";
import OutboundQueueProvider, { PendingOutboundList } from "../OutboundQueue";
import ReplyComposer from "../ReplyComposer";
import ReplyTargetProvider, { ReplyToButton } from "../ReplyTarget";
import { readWhatsAppRows } from "../data";
import {
  buildWhatsAppDashboardModel,
  buildWhatsAppReplyComposerState,
  type WhatsAppLeadFilter,
  type WhatsAppLeadMessage,
  type WhatsAppLeadRow,
} from "../dashboard";
import {
  normalizeWhatsAppQuickReplyRow,
  sortWhatsAppQuickReplies,
  type WhatsAppQuickReply,
} from "../quickRepliesModel";

export const metadata: Metadata = {
  title: "WhatsApp Conversations | Web Growth",
  robots: { index: false, follow: false },
};

const filters: WhatsAppLeadFilter[] = ["ALL", "HOT", "WARM", "REVIEW", "PRICING", "MEETING", "PROPOSAL"];

/** Which single panel a phone shows. Desktop always shows all three. */
type MobilePanel = "list" | "thread" | "contact";

async function getLeads(): Promise<WhatsAppLeadRow[]> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_conversations?select=id,status,intent,human_review_required,last_message_at,first_message_at,assigned_to,whatsapp_contacts!inner(wa_id,display_name,business_name,email,phone,website,source,lead_temperature)&order=last_message_at.desc`,
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
      first_message_at: typeof row.first_message_at === "string" ? row.first_message_at : undefined,
      assigned_to: typeof row.assigned_to === "string" ? row.assigned_to : undefined,
      wa_id: String(contact?.wa_id || ""),
      display_name: typeof contact?.display_name === "string" ? contact.display_name : undefined,
      business_name: typeof contact?.business_name === "string" ? contact.business_name : undefined,
      email: typeof contact?.email === "string" ? contact.email : undefined,
      phone: typeof contact?.phone === "string" ? contact.phone : undefined,
      website: typeof contact?.website === "string" ? contact.website : undefined,
      source: typeof contact?.source === "string" ? contact.source : undefined,
      lead_temperature:
        contact?.lead_temperature === "HOT" || contact?.lead_temperature === "WARM"
          ? contact.lead_temperature
          : "COLD",
    };
  });
}

const MESSAGE_COLUMNS =
  "id,whatsapp_message_id,conversation_id,direction,message_type,message_text,message_timestamp,delivery_status,media_id,media_mime_type,media_voice,media_filename";

/**
 * Reads a thread, treating `delivery_error` as optional.
 *
 * That column arrives with migration 202608260002. PostgREST rejects a select that
 * names a column the table does not have, and that rejection would blank the whole
 * thread — so an unapplied migration costs the failure sentence on failed messages,
 * never the messages themselves. Same degrade-don't-break rule the writer uses.
 */
async function readConversationMessageRows(conversationId: string) {
  const scope = `whatsapp_messages?conversation_id=eq.${encodeURIComponent(conversationId)}`;
  const withError = await readWhatsAppRows<Record<string, unknown>>(
    `${scope}&select=${MESSAGE_COLUMNS},delivery_error&order=message_timestamp.asc`,
  );
  if (withError) return withError;
  return readWhatsAppRows<Record<string, unknown>>(
    `${scope}&select=${MESSAGE_COLUMNS}&order=message_timestamp.asc`,
  );
}

async function getConversationMessages(conversationId: string | undefined): Promise<WhatsAppLeadMessage[]> {
  if (!conversationId) return [];

  const rows = await readConversationMessageRows(conversationId);
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
    // Already sanitized on the way in by the webhook handler, so this is a plain
    // sentence rather than anything Meta said verbatim.
    delivery_error: typeof row.delivery_error === "string" ? row.delivery_error : undefined,
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

async function getQuickReplies(): Promise<WhatsAppQuickReply[]> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_quick_replies?select=id,shortcut,title,body&order=shortcut.asc",
  );
  if (!rows) return [];
  return sortWhatsAppQuickReplies(rows.map(normalizeWhatsAppQuickReplyRow));
}

function formatTime(value: string | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatRelative(value: string | undefined, now: number) {
  if (!value) return "";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "";

  const diffMinutes = Math.round((now - parsed) / 60000);
  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return new Date(parsed).toLocaleDateString([], { month: "short", day: "numeric" });
}

function getTemperatureClasses(temperature: WhatsAppLeadRow["lead_temperature"]) {
  if (temperature === "HOT") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  if (temperature === "WARM") return "bg-brass-tint text-[#6f4f16] ring-1 ring-brass/25";
  return "bg-paper-sunk text-ink-faint ring-1 ring-rule";
}

function getMessageFallbackText(message: WhatsAppLeadMessage) {
  if (message.message_type === "audio") return message.media_voice ? "Voice note" : "Audio message";
  if (message.message_type === "image") return "Image";
  if (message.message_type === "video") return "Video";
  if (message.message_type === "document") return message.media_filename || "Document";
  return "No text content stored.";
}

function getMessagePreview(message: WhatsAppLeadMessage | undefined) {
  if (!message) return "No messages yet";
  if (message.message_type === "audio") return message.media_voice ? "🎙 Voice note" : "🎧 Audio message";
  if (message.message_type === "image") return `🖼 ${message.message_text || "Image"}`;
  if (message.message_type === "video") return `🎬 ${message.message_text || "Video"}`;
  if (message.message_type === "document") {
    return `📄 ${message.message_text || message.media_filename || "Document"}`;
  }
  return message.message_text || getMessageFallbackText(message);
}

function buildHref(input: {
  filter: WhatsAppLeadFilter;
  leadId?: string;
  panel?: MobilePanel;
}) {
  const query = new URLSearchParams();
  if (input.filter !== "ALL") query.set("filter", input.filter);
  if (input.leadId) query.set("lead", input.leadId);
  if (input.panel === "contact") query.set("panel", "contact");
  const suffix = query.toString();
  return suffix ? `/admin/whatsapp/conversations/?${suffix}` : "/admin/whatsapp/conversations/";
}

function getFilterHref(filter: WhatsAppLeadFilter, selectedLeadId?: string) {
  return buildHref({ filter, leadId: selectedLeadId });
}

function getLeadHref(filter: WhatsAppLeadFilter, leadId: string) {
  return buildHref({ filter, leadId });
}

export default async function WhatsAppConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; lead?: string; panel?: string }>;
}) {
  const cookieStore = await cookies();
  const unlocked = hasWhatsAppAdminAccess(cookieStore);

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <GoogleAdminPrompt
            nextPath="/admin/whatsapp/conversations/"
            adminEmail={getDefaultAdminGoogleEmail()}
            googleReady={isGoogleAuthConfigured()}
          />
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const filter = filters.includes(params.filter as WhatsAppLeadFilter)
    ? (params.filter as WhatsAppLeadFilter)
    : "ALL";

  const leadRows = await getLeads();
  const quickReplies = await getQuickReplies();
  // Console settings drive the polling interval. The cache keeps this off the
  // critical path, and a missing table falls back to the built-in default.
  const { settings } = await loadWhatsAppSettings();
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

  const now = Date.now();
  const lead = model.selectedLead;
  // On a phone only one panel is visible, and which one is driven by the URL so the
  // browser's back button steps back through list → thread → details.
  const mobilePanel: MobilePanel =
    params.panel === "contact" && lead ? "contact" : params.lead ? "thread" : "list";

  const lastMessageByConversation = new Map<string, WhatsAppLeadMessage>();
  for (const message of selectedMessages) {
    lastMessageByConversation.set(message.conversation_id, message);
  }

  // The dedup key for optimistic replies: every WhatsApp id the rendered thread already
  // holds. A bubble whose id turns up here has become a real row and stops being drawn
  // twice — see OutboundQueue.
  const storedMessageIds = model.selectedMessages
    .map((message) => message.whatsapp_message_id)
    .filter((id): id is string => Boolean(id));

  const contactRows = lead
    ? [
        { label: "Intent", value: lead.intent || "—" },
        { label: "Status", value: lead.status.toUpperCase() },
        { label: "Temperature", value: lead.lead_temperature },
        { label: "Review", value: lead.human_review_required ? "Required" : "Not required" },
        { label: "Source", value: lead.source || "WhatsApp" },
        { label: "Business", value: lead.business_name || "—" },
        { label: "Email", value: lead.email || "—" },
        { label: "Assigned", value: lead.assigned_to || "Unassigned" },
        { label: "First contact", value: formatDateTime(lead.first_message_at) },
        { label: "Last contact", value: formatDateTime(lead.last_message_at) },
      ]
    : [];

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <WhatsAppInboxAutoRefresh refreshSeconds={settings.console.inboxRefreshSeconds} />

      {/* Column 1 — conversation list */}
      <section
        className={`min-h-0 w-full flex-col lg:flex lg:w-80 lg:flex-none lg:border-r lg:border-rule xl:w-[22rem] ${
          mobilePanel === "list" ? "flex" : "hidden"
        }`}
      >
        <div className="flex-none border-b border-rule px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Conversations</h2>
            <span className="text-xs tabular-nums text-ink-faint">
              {model.filteredLeads.length} of {model.filterCounts.ALL}
            </span>
          </div>
          <nav aria-label="Lead filters" className="-mx-4 mt-2.5 overflow-x-auto px-4">
            <div className="flex w-max gap-1.5 pb-1">
              {filters.map((item) => {
                const active = filter === item;
                return (
                  <Link
                    key={item}
                    href={getFilterHref(item, lead?.id)}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition ${
                      active
                        ? "bg-ledger-bright text-white"
                        : "border border-rule bg-paper-raised text-ink-soft hover:border-rule-strong hover:text-ink"
                    }`}
                  >
                    {item}
                    <span
                      className={`rounded-full px-1 text-[0.625rem] tabular-nums ${
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
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto">
          {model.filteredLeads.map((item) => {
            const active = lead?.id === item.id;
            const preview = getMessagePreview(lastMessageByConversation.get(item.id));
            return (
              <li key={item.id} className="border-b border-rule">
                <Link
                  href={getLeadHref(filter, item.id)}
                  aria-current={active ? "true" : undefined}
                  className={`flex gap-3 px-4 py-3 transition ${
                    active ? "bg-ledger-tint" : "hover:bg-paper-sunk/60"
                  }`}
                >
                  <ContactAvatar
                    identity={{
                      displayName: item.display_name,
                      businessName: item.business_name,
                      waId: item.wa_id,
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-ink">
                        {item.display_name || "Unknown"}
                      </span>
                      <span className="ml-auto flex-none text-[0.65rem] tabular-nums text-ink-faint">
                        {formatRelative(item.last_message_at, now)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-faint">
                      {active ? preview : item.wa_id}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1">
                      {item.lead_temperature !== "COLD" ? (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold ${getTemperatureClasses(
                            item.lead_temperature,
                          )}`}
                        >
                          {item.lead_temperature}
                        </span>
                      ) : null}
                      {item.human_review_required ? (
                        <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[0.6rem] font-semibold text-rose-700">
                          Review
                        </span>
                      ) : null}
                      {item.intent ? (
                        <span className="truncate rounded-full bg-paper-sunk px-1.5 py-0.5 text-[0.6rem] text-ink-faint">
                          {item.intent}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
          {model.filteredLeads.length === 0 ? (
            <li className="px-4 py-12 text-center text-sm text-ink-faint">
              No leads match this filter yet.
            </li>
          ) : null}
        </ul>
      </section>

      {/* Column 2 — thread */}
      <section
        className={`min-h-0 min-w-0 flex-1 flex-col lg:flex ${
          mobilePanel === "thread" ? "flex" : "hidden"
        }`}
      >
        {lead ? (
          // Keyed on the conversation: switching leads must not carry a half-typed draft
          // or an in-flight bubble across into someone else's thread.
          <OutboundQueueProvider key={lead.id} storedMessageIds={storedMessageIds}>
            <ReplyTargetProvider>
            <div className="flex flex-none items-center gap-3 border-b border-rule bg-paper-raised px-4 py-3">
              <Link
                href={getFilterHref(filter)}
                className="-ml-1 rounded-lg p-1.5 text-ink-soft transition hover:bg-paper-sunk hover:text-ink lg:hidden"
              >
                <WhatsAppIcon name="chevronLeft" className="h-5 w-5" />
                <span className="sr-only">Back to conversations</span>
              </Link>
              <ContactAvatar
                identity={{
                  displayName: lead.display_name,
                  businessName: lead.business_name,
                  waId: lead.wa_id,
                }}
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold text-ink">
                  {lead.display_name || "Unknown lead"}
                </h2>
                <p className="truncate font-mono text-[0.7rem] text-ink-faint">{lead.wa_id}</p>
              </div>
              <span
                className={`hidden flex-none rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${getTemperatureClasses(
                  lead.lead_temperature,
                )}`}
              >
                {lead.lead_temperature}
              </span>
              <Link
                href={buildHref({ filter, leadId: lead.id, panel: "contact" })}
                className="rounded-lg border border-rule px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-ledger hover:text-ledger lg:hidden"
              >
                Details
              </Link>
            </div>

            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-paper bg-[radial-gradient(circle_at_1px_1px,rgba(18,74,56,.06)_1px,transparent_0)] bg-[length:24px_24px] px-4 py-4">
              {model.selectedMessages.length ? (
                model.selectedMessages.map((message) => {
                  const outbound = message.direction === "outbound";
                  const showsMedia = hasRenderableWhatsAppMedia(message);
                  return (
                    <article
                      key={message.id}
                      className={`max-w-[min(32rem,85%)] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                        outbound
                          ? "ml-auto rounded-br-md bg-ledger-bright text-white"
                          : "mr-auto rounded-bl-md border border-rule bg-paper-raised text-ink"
                      }`}
                    >
                      {showsMedia ? <MessageMedia message={message} outbound={outbound} /> : null}
                      {message.message_text || !showsMedia ? (
                        <p className={`whitespace-pre-wrap text-sm leading-6 ${showsMedia ? "mt-2" : ""}`}>
                          {message.message_text || getMessageFallbackText(message)}
                        </p>
                      ) : null}
                      <p
                        className={`mt-1 flex items-center justify-end gap-1.5 text-[0.65rem] tabular-nums ${
                          outbound ? "text-white/70" : "text-ink-faint"
                        }`}
                      >
                        <span className="-my-1 mr-auto">
                          <ReplyToButton
                            message={message}
                            contactLabel={lead.display_name || "Customer"}
                            onDark={outbound}
                          />
                        </span>
                        <time dateTime={message.message_timestamp}>
                          {formatTime(message.message_timestamp)}
                        </time>
                        <MessageStatus
                          status={message.delivery_status}
                          direction={message.direction}
                          error={message.delivery_error}
                          onDark={outbound}
                        />
                      </p>
                    </article>
                  );
                })
              ) : (
                <div className="mx-auto mt-8 max-w-sm rounded-lg border border-dashed border-rule-strong bg-paper-raised px-4 py-8 text-center text-sm text-ink-faint">
                  No stored messages for this conversation yet.
                </div>
              )}
              <PendingOutboundList />
            </div>

            {/* No `overflow` here on purpose: the composer's own popovers (emoji, `+` menu,
                quick replies) sit above the row, and the editor bounds its own height. */}
            <div className="flex-none border-t border-rule bg-paper-raised">
              <ReplyComposer
                conversationId={lead.id}
                waId={lead.wa_id}
                composerState={composerState}
                quickReplies={quickReplies}
              />
            </div>
            </ReplyTargetProvider>
          </OutboundQueueProvider>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-16">
            <div className="max-w-sm text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-sunk text-ink-faint">
                <WhatsAppIcon name="conversations" className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-medium text-ink">No conversation selected</p>
              <p className="mt-1 text-xs text-ink-faint">
                {model.filterCounts.ALL === 0
                  ? "Inbound WhatsApp messages will appear here as they arrive."
                  : "Pick a conversation from the list to read the thread and reply."}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Column 3 — contact details */}
      <aside
        className={`min-h-0 w-full flex-col overflow-y-auto lg:flex lg:w-72 lg:flex-none lg:border-l lg:border-rule xl:w-80 ${
          mobilePanel === "contact" ? "flex" : "hidden"
        }`}
      >
        {lead ? (
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 lg:hidden">
              <Link
                href={getLeadHref(filter, lead.id)}
                className="-ml-1 rounded-lg p-1.5 text-ink-soft transition hover:bg-paper-sunk hover:text-ink"
              >
                <WhatsAppIcon name="chevronLeft" className="h-5 w-5" />
                <span className="sr-only">Back to conversation</span>
              </Link>
              <span className="text-sm font-semibold text-ink">Contact details</span>
            </div>

            <p className="hidden text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ink-faint lg:block">
              Contact details
            </p>

            <div className="mt-4 text-center">
              <ContactAvatar
                identity={{
                  displayName: lead.display_name,
                  businessName: lead.business_name,
                  waId: lead.wa_id,
                }}
                size="lg"
                labelled
                className="mx-auto"
              />
              <p className="mt-2.5 text-sm font-semibold text-ink">
                {lead.display_name || "Unknown lead"}
              </p>
              <p className="font-mono text-xs text-ink-faint">{lead.phone || lead.wa_id}</p>
              {lead.lead_temperature !== "COLD" ? (
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${getTemperatureClasses(
                    lead.lead_temperature,
                  )}`}
                >
                  {lead.lead_temperature} LEAD
                </span>
              ) : null}
            </div>

            {lead.website ? (
              <a
                href={lead.website}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block truncate rounded-lg border border-rule bg-paper px-3 py-2 text-center text-xs text-ledger underline decoration-ledger/30 underline-offset-4 hover:border-ledger"
              >
                {lead.website}
              </a>
            ) : null}

            <dl className="mt-4">
              {contactRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-3 border-t border-rule py-2 text-xs first:border-t-0"
                >
                  <dt className="flex-none text-ink-faint">{row.label}</dt>
                  <dd className="min-w-0 break-words text-right text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 rounded-lg bg-paper px-3 py-2.5 text-[0.7rem] leading-5 text-ink-faint">
              Notes, labels, and assignment need their own database columns. They arrive in a
              later stage rather than being mocked up here.
            </p>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-ink-faint">
            Select a conversation to see contact details.
          </div>
        )}
      </aside>
    </div>
  );
}
