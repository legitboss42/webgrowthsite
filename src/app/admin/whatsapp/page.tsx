import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import InternalUtilityUnlockForm from "@/components/internal/InternalUtilityUnlockForm";
import { getInternalUtilityLocalPassphrase } from "@/lib/internalUtilityAuth";
import { WhatsAppIcon, type WhatsAppIconName } from "@/components/whatsapp/icons";
import { hasWhatsAppAdminAccess } from "./auth";
import { countWhatsAppRows, getWhatsAppSenderConfig, readWhatsAppRows } from "./data";
import {
  describeWhatsAppMessagingTier,
  describeWhatsAppQuality,
  fetchWhatsAppPhoneNumbers,
  findConfiguredWhatsAppSender,
} from "@/lib/whatsapp/phoneNumbers";
import type { WhatsAppLeadRow } from "./dashboard";
import {
  buildWhatsAppActivitySeries,
  buildWhatsAppChartGeometry,
  buildWhatsAppOverviewMetrics,
  formatWhatsAppMetric,
  getWhatsAppActivityMax,
  type WhatsAppActivityMessage,
} from "./overview";

export const metadata: Metadata = {
  title: "WhatsApp Overview | Web Growth",
  robots: { index: false, follow: false },
};

const ACTIVITY_DAYS = 14;
const CHART_WIDTH = 640;
const CHART_HEIGHT = 170;

async function getConversationSummaries(): Promise<WhatsAppLeadRow[]> {
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

async function getRecentActivity(sinceIso: string): Promise<WhatsAppActivityMessage[]> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_messages?select=direction,message_timestamp&message_timestamp=gte.${encodeURIComponent(
      sinceIso,
    )}&order=message_timestamp.asc&limit=10000`,
  );
  if (!rows) return [];

  return rows.map((row) => ({
    direction: row.direction === "outbound" ? "outbound" : "inbound",
    message_timestamp: typeof row.message_timestamp === "string" ? row.message_timestamp : undefined,
  }));
}

function formatRelative(value: string | undefined, now: number) {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "—";

  const diffMinutes = Math.round((now - parsed) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(parsed).toLocaleDateString();
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

function MetricCard({
  label,
  value,
  icon,
  note,
}: {
  label: string;
  value: string;
  icon: WhatsAppIconName;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-rule bg-paper-raised p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.65rem] font-medium uppercase tracking-[.14em] text-ink-faint">{label}</p>
        <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-ledger-tint text-ledger">
          <WhatsAppIcon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2.5 font-display text-3xl font-semibold leading-none tabular-nums text-ink">{value}</p>
      <p className="mt-1.5 text-xs text-ink-faint">{note}</p>
    </div>
  );
}

export default async function WhatsAppOverviewPage() {
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

  const now = Date.now();
  const sinceIso = new Date(now - (ACTIVITY_DAYS - 1) * 24 * 60 * 60 * 1000).toISOString();
  const sender = getWhatsAppSenderConfig();

  const [leads, activityMessages, contacts, messagesSent, messagesReceived] = await Promise.all([
    getConversationSummaries(),
    getRecentActivity(sinceIso),
    countWhatsAppRows("whatsapp_contacts?select=id"),
    countWhatsAppRows("whatsapp_messages?select=id&direction=eq.outbound"),
    countWhatsAppRows("whatsapp_messages?select=id&direction=eq.inbound"),
  ]);

  // Quality rating, messaging limit, and the display number live at Meta, not in our
  // database. Cached briefly so the overview does not hit the Graph API on every load.
  const phoneResult = await fetchWhatsAppPhoneNumbers({ revalidateSeconds: 300 });
  const senderNumber = phoneResult.ok ? findConfiguredWhatsAppSender(phoneResult.phoneNumbers) : null;

  const metrics = buildWhatsAppOverviewMetrics({
    leads,
    contacts,
    messagesSent,
    messagesReceived,
    senderConnected: sender.senderConnected,
  });

  const series = buildWhatsAppActivitySeries({ messages: activityMessages, days: ACTIVITY_DAYS, now });
  const activityMax = getWhatsAppActivityMax(series);
  const sentGeometry = buildWhatsAppChartGeometry(
    series.map((point) => point.sent),
    { width: CHART_WIDTH, height: CHART_HEIGHT, max: activityMax },
  );
  const receivedGeometry = buildWhatsAppChartGeometry(
    series.map((point) => point.received),
    { width: CHART_WIDTH, height: CHART_HEIGHT, max: activityMax },
  );
  const hasActivity = activityMax > 0;
  const recentConversations = leads.slice(0, 5);

  const quickActions: Array<{ label: string; description: string; href: string; icon: WhatsAppIconName }> = [
    {
      label: "Open the inbox",
      description: "Read threads and reply",
      href: "/admin/whatsapp/conversations/",
      icon: "conversations",
    },
    {
      label: `Needs review (${metrics.needsReview})`,
      description: "Conversations flagged for a human",
      href: "/admin/whatsapp/conversations/?filter=REVIEW",
      icon: "automations",
    },
    {
      label: `Hot leads (${metrics.hotLeads})`,
      description: "Highest-intent conversations",
      href: "/admin/whatsapp/conversations/?filter=HOT",
      icon: "campaigns",
    },
  ];

  const configRows = [
    { label: "Sender credentials", ok: sender.senderConnected, okText: "Connected", badText: "Not configured" },
    { label: "Webhook verify token", ok: sender.webhookVerifyConfigured, okText: "Configured", badText: "Missing" },
    { label: "Signature app secret", ok: sender.appSecretConfigured, okText: "Configured", badText: "Missing" },
  ];

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Connected numbers"
          value={formatWhatsAppMetric(metrics.connectedNumbers)}
          icon="phoneNumbers"
          note={sender.senderConnected ? "Sender credentials present" : "Add credentials to send"}
        />
        <MetricCard
          label="Conversations"
          value={formatWhatsAppMetric(metrics.conversations)}
          icon="conversations"
          note={`${metrics.openConversations} open`}
        />
        <MetricCard
          label="Messages sent"
          value={formatWhatsAppMetric(metrics.messagesSent)}
          icon="campaigns"
          note={`${formatWhatsAppMetric(metrics.messagesReceived)} received`}
        />
        <MetricCard
          label="Unique contacts"
          value={formatWhatsAppMetric(metrics.contacts)}
          icon="contacts"
          note={`${metrics.hotLeads} hot · ${metrics.warmLeads} warm`}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Messages performance</h2>
              <p className="mt-0.5 text-xs text-ink-faint">
                Sent vs received · last {ACTIVITY_DAYS} days (UTC)
              </p>
            </div>
            <div className="flex items-center gap-4 text-[0.7rem] text-ink-faint">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-ledger-bright" />
                Sent
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-brass" />
                Received
              </span>
            </div>
          </div>

          {hasActivity ? (
            <>
              <div className="mt-4 overflow-x-auto">
                <svg
                  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                  className="h-44 w-full min-w-[420px]"
                  role="img"
                  aria-label={`Messages sent and received per day over the last ${ACTIVITY_DAYS} days. Peak of ${activityMax} messages in a day.`}
                >
                  {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                    <line
                      key={fraction}
                      x1={0}
                      x2={CHART_WIDTH}
                      y1={CHART_HEIGHT * fraction}
                      y2={CHART_HEIGHT * fraction}
                      stroke="currentColor"
                      strokeWidth={1}
                      className="text-rule"
                    />
                  ))}
                  <path d={receivedGeometry.area} className="fill-brass/10" />
                  <path d={sentGeometry.area} className="fill-ledger-bright/10" />
                  <path
                    d={receivedGeometry.line}
                    fill="none"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-brass"
                  />
                  <path
                    d={sentGeometry.line}
                    fill="none"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-ledger-bright"
                  />
                  {receivedGeometry.last ? (
                    <circle cx={receivedGeometry.last.x} cy={receivedGeometry.last.y} r={4} className="fill-brass" />
                  ) : null}
                  {sentGeometry.last ? (
                    <circle
                      cx={sentGeometry.last.x}
                      cy={sentGeometry.last.y}
                      r={4}
                      className="fill-ledger-bright"
                    />
                  ) : null}
                </svg>
              </div>
              <div className="mt-2 flex justify-between text-[0.65rem] tabular-nums text-ink-faint">
                <span>{series[0]?.label}</span>
                <span>{series[Math.floor(series.length / 2)]?.label}</span>
                <span>{series[series.length - 1]?.label}</span>
              </div>
              <p className="mt-3 text-xs text-ink-faint">
                Peak day: {activityMax} message{activityMax === 1 ? "" : "s"}
              </p>
            </>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-rule-strong px-4 py-12 text-center">
              <p className="text-sm text-ink-soft">No messages in the last {ACTIVITY_DAYS} days.</p>
              <p className="mt-1 text-xs text-ink-faint">
                This chart fills in from stored WhatsApp messages as conversations come in.
              </p>
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5">
          <h2 className="text-sm font-semibold text-ink">Integration status</h2>
          <p className="mt-0.5 text-xs text-ink-faint">Read from server configuration</p>

          <dl className="mt-3">
            {configRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 border-t border-rule py-2.5 text-sm first:border-t-0"
              >
                <dt className="text-ink-faint">{row.label}</dt>
                <dd
                  className={`inline-flex items-center gap-1.5 font-medium ${
                    row.ok ? "text-ledger" : "text-ink-faint"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 rounded-full ${row.ok ? "bg-ledger-bright" : "bg-rule-strong"}`}
                  />
                  {row.ok ? row.okText : row.badText}
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 border-t border-rule py-2.5 text-sm">
              <dt className="text-ink-faint">Graph API version</dt>
              <dd className="font-mono text-xs text-ink">{sender.graphApiVersion}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-rule py-2.5 text-sm">
              <dt className="text-ink-faint">Last activity</dt>
              <dd className="text-ink">{formatRelative(metrics.lastActivityAt, now)}</dd>
            </div>

            {/* Live from Meta. Absent only when the Graph API is unreachable. */}
            {senderNumber ? (
              <>
                <div className="flex items-center justify-between gap-3 border-t border-rule py-2.5 text-sm">
                  <dt className="text-ink-faint">Sender number</dt>
                  <dd className="font-mono text-xs text-ink">
                    {senderNumber.displayPhoneNumber || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-rule py-2.5 text-sm">
                  <dt className="text-ink-faint">Quality rating</dt>
                  <dd
                    className={`font-medium ${
                      senderNumber.qualityRating === "GREEN"
                        ? "text-ledger"
                        : senderNumber.qualityRating === "RED"
                          ? "text-rose-700"
                          : "text-ink"
                    }`}
                  >
                    {describeWhatsAppQuality(senderNumber.qualityRating)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 border-t border-rule py-2.5 text-sm">
                  <dt className="flex-none text-ink-faint">Messaging limit</dt>
                  <dd className="min-w-0 text-right text-ink">
                    {describeWhatsAppMessagingTier(senderNumber.messagingLimitTier) || "—"}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>

          <Link
            href="/admin/whatsapp/phone-numbers/"
            className="mt-3 inline-flex text-xs font-medium text-ledger underline decoration-ledger/30 underline-offset-4 hover:text-ledger-bright"
          >
            {senderNumber ? "All phone number details" : "Check phone number status"}
          </Link>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">Recent conversations</h2>
            <Link
              href="/admin/whatsapp/conversations/"
              className="text-xs font-medium text-ledger underline decoration-ledger/30 underline-offset-4 hover:text-ledger-bright"
            >
              View all
            </Link>
          </div>

          {recentConversations.length ? (
            <ul className="mt-1">
              {recentConversations.map((lead) => (
                <li key={lead.id} className="border-t border-rule first:border-t-0">
                  <Link
                    href={`/admin/whatsapp/conversations/?lead=${encodeURIComponent(lead.id)}`}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-paper-sunk text-[0.7rem] font-semibold text-ink-soft">
                      {getInitials(lead.display_name, lead.wa_id)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {lead.display_name || "Unknown"}
                      </span>
                      <span className="block truncate text-xs text-ink-faint">
                        {lead.intent || lead.wa_id}
                      </span>
                    </span>
                    <span className="flex-none text-right">
                      <span className="block text-[0.7rem] tabular-nums text-ink-faint">
                        {formatRelative(lead.last_message_at, now)}
                      </span>
                      {lead.lead_temperature !== "COLD" ? (
                        <span
                          className={`mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold ${
                            lead.lead_temperature === "HOT"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-brass-tint text-[#6f4f16]"
                          }`}
                        >
                          {lead.lead_temperature}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-rule-strong px-4 py-8 text-center text-sm text-ink-faint">
              No WhatsApp conversations stored yet.
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5">
          <h2 className="text-sm font-semibold text-ink">Quick actions</h2>
          <p className="mt-0.5 text-xs text-ink-faint">Jump straight into the inbox</p>
          <div className="mt-3 space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-lg border border-rule bg-paper px-3 py-2.5 transition hover:border-ledger hover:bg-ledger-tint/40"
              >
                <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-ledger-tint text-ledger">
                  <WhatsAppIcon name={action.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{action.label}</span>
                  <span className="block truncate text-xs text-ink-faint">{action.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5 lg:col-span-2 xl:col-span-1">
          <h2 className="text-sm font-semibold text-ink">Campaigns</h2>
          <p className="mt-0.5 text-xs text-ink-faint">Outbound template broadcasts</p>
          <div className="mt-3 rounded-lg border border-dashed border-rule-strong px-4 py-8 text-center">
            <p className="text-sm text-ink-soft">Not built yet.</p>
            <p className="mt-1 text-xs leading-5 text-ink-faint">
              Campaigns come after the inbox, contacts, and templates are solid — so broadcasts can
              only ever go out on approved templates.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
