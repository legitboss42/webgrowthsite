import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail } from "@/lib/googleAuth";
import { WhatsAppIcon, type WhatsAppIconName } from "@/components/whatsapp/icons";
import { hasWhatsAppAdminAccess } from "../auth";
import { countWhatsAppRows, readWhatsAppRows } from "../data";
import {
  buildWhatsAppActivitySeries,
  buildWhatsAppChartGeometry,
  formatWhatsAppMetric,
  getWhatsAppActivityMax,
} from "../overview";
import {
  WHATSAPP_ANALYTICS_RANGES,
  WHATSAPP_DELIVERY_STATUS_KEYS,
  buildWhatsAppAnalyticsTotals,
  buildWhatsAppDeliveryBreakdown,
  buildWhatsAppResponseTimes,
  describeWhatsAppAnalyticsRange,
  formatWhatsAppDuration,
  formatWhatsAppRate,
  resolveWhatsAppAnalyticsRange,
  type WhatsAppAnalyticsMessage,
  type WhatsAppDeliveryStatusKey,
} from "../analyticsModel";
import { compareWhatsAppResponseToTarget } from "@/lib/whatsapp/settings";
import { loadWhatsAppSettings } from "@/lib/whatsapp/settingsStore";

export const metadata: Metadata = {
  title: "WhatsApp Analytics | Web Growth",
  robots: { index: false, follow: false },
};

const CHART_WIDTH = 640;
const CHART_HEIGHT = 170;

/**
 * Analytics reads raw message rows rather than aggregating in SQL, because response
 * time needs the ordered sequence within each conversation. The cap keeps one page
 * load bounded; rows come back newest-first so a capped read loses the oldest days
 * rather than the days an administrator is most likely looking at.
 */
const ROW_LIMIT = 20000;

type AnalyticsRead = {
  messages: WhatsAppAnalyticsMessage[];
  /** True when the database could not be read at all — distinct from "no messages". */
  unavailable: boolean;
  /** True when the row cap was reached, so the oldest part of the range is missing. */
  capped: boolean;
};

async function getAnalyticsMessages(sinceIso: string): Promise<AnalyticsRead> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_messages?select=direction,message_timestamp,delivery_status,conversation_id&message_timestamp=gte.${encodeURIComponent(
      sinceIso,
    )}&order=message_timestamp.desc&limit=${ROW_LIMIT}`,
  );
  if (!rows) return { messages: [], unavailable: true, capped: false };

  return {
    messages: rows.map((row) => ({
      direction: row.direction === "outbound" ? "outbound" : "inbound",
      message_timestamp:
        typeof row.message_timestamp === "string" ? row.message_timestamp : undefined,
      delivery_status: typeof row.delivery_status === "string" ? row.delivery_status : null,
      conversation_id: typeof row.conversation_id === "string" ? row.conversation_id : undefined,
    })),
    unavailable: false,
    capped: rows.length >= ROW_LIMIT,
  };
}

type TemperatureMix = { HOT: number; WARM: number; COLD: number } | null;

async function getNewContactTemperatures(sinceIso: string): Promise<TemperatureMix> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_contacts?select=lead_temperature&created_at=gte.${encodeURIComponent(
      sinceIso,
    )}&limit=${ROW_LIMIT}`,
  );
  if (!rows) return null;

  const mix = { HOT: 0, WARM: 0, COLD: 0 };
  for (const row of rows) {
    if (row.lead_temperature === "HOT") mix.HOT += 1;
    else if (row.lead_temperature === "WARM") mix.WARM += 1;
    else mix.COLD += 1;
  }
  return mix;
}

const DELIVERY_LABELS: Record<WhatsAppDeliveryStatusKey, string> = {
  queued: "Queued",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed",
  unknown: "Other",
};

const DELIVERY_NOTES: Record<WhatsAppDeliveryStatusKey, string> = {
  queued: "No status from Meta yet",
  sent: "Left our sender",
  delivered: "Reached the handset",
  read: "Opened by the customer",
  failed: "Meta could not deliver",
  unknown: "Status we do not model yet",
};

const DELIVERY_BAR_CLASSES: Record<WhatsAppDeliveryStatusKey, string> = {
  queued: "bg-rule-strong",
  sent: "bg-brass",
  delivered: "bg-ledger",
  read: "bg-ledger-bright",
  failed: "bg-rose-400",
  unknown: "bg-ink-faint",
};

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
        <p className="text-[0.65rem] font-medium uppercase tracking-[.14em] text-ink-faint">
          {label}
        </p>
        <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-ledger-tint text-ledger">
          <WhatsAppIcon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2.5 font-display text-3xl font-semibold leading-none tabular-nums text-ink">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-ink-faint">{note}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-rule py-2.5 text-sm first:border-t-0">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-rule bg-paper-raised px-6 py-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-sunk text-ink-faint">
        <WhatsAppIcon name="analytics" className="h-6 w-6" />
      </span>
      <p className="mt-3 text-sm font-medium text-ink">{title}</p>
      <div className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-ink-faint">{children}</div>
    </div>
  );
}

function RangeSwitcher({ active }: { active: number }) {
  return (
    <nav aria-label="Reporting range" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex w-max gap-2 pb-1">
        {WHATSAPP_ANALYTICS_RANGES.map((range) => {
          const isActive = range === active;
          return (
            <Link
              key={range}
              href={`/admin/whatsapp/analytics/?days=${range}`}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex flex-none items-center rounded-full px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "bg-ledger-bright text-white"
                  : "border border-rule bg-paper-raised text-ink-soft hover:border-rule-strong hover:text-ink"
              }`}
            >
              {range} days
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default async function WhatsAppAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const cookieStore = await cookies();
  const unlocked = hasWhatsAppAdminAccess(cookieStore);

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <GoogleAdminPrompt
            nextPath="/admin/whatsapp/analytics/"
            adminEmail={getDefaultAdminGoogleEmail()}
          />
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const range = resolveWhatsAppAnalyticsRange(params.days);

  const now = Date.now();
  const sinceIso = new Date(now - (range - 1) * 24 * 60 * 60 * 1000).toISOString();

  const [read, newContacts, temperatureMix, settingsLoad] = await Promise.all([
    getAnalyticsMessages(sinceIso),
    countWhatsAppRows(`whatsapp_contacts?select=id&created_at=gte.${encodeURIComponent(sinceIso)}`),
    getNewContactTemperatures(sinceIso),
    loadWhatsAppSettings(),
  ]);

  if (read.unavailable) {
    return (
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <RangeSwitcher active={range} />
        <div className="mt-4">
          <EmptyState title="Analytics could not be read">
            The WhatsApp database is not reachable from this deployment, so no figures can be shown.
            Nothing is being estimated in the meantime. The server log has the detail.
          </EmptyState>
        </div>
      </div>
    );
  }

  const totals = buildWhatsAppAnalyticsTotals(read.messages);
  const delivery = buildWhatsAppDeliveryBreakdown(read.messages);
  const responseTimes = buildWhatsAppResponseTimes(read.messages);
  // The target is an operator setting; the model measures in milliseconds and the
  // comparison takes seconds, so the conversion happens here rather than in either.
  const responseTarget = compareWhatsAppResponseToTarget(
    responseTimes.medianMs === null ? null : responseTimes.medianMs / 1000,
    settingsLoad.settings.targetFirstResponseMinutes,
  );

  const series = buildWhatsAppActivitySeries({ messages: read.messages, days: range, now });
  const activityMax = getWhatsAppActivityMax(series);
  const hasActivity = activityMax > 0;
  const sentGeometry = buildWhatsAppChartGeometry(
    series.map((point) => point.sent),
    { width: CHART_WIDTH, height: CHART_HEIGHT, max: activityMax },
  );
  const receivedGeometry = buildWhatsAppChartGeometry(
    series.map((point) => point.received),
    { width: CHART_WIDTH, height: CHART_HEIGHT, max: activityMax },
  );

  const busiestDay = series.reduce(
    (best, point) =>
      point.sent + point.received > best.sent + best.received ? point : best,
    series[0],
  );
  const totalMessages = totals.sent + totals.received;
  const dailyAverage = totalMessages > 0 ? Math.round((totalMessages / range) * 10) / 10 : 0;

  // Zero outbound messages means there is nothing to divide by, so the funnel is
  // hidden rather than drawn as six empty bars.
  const funnelKeys = WHATSAPP_DELIVERY_STATUS_KEYS.filter(
    (key) => key !== "unknown" || delivery.counts.unknown > 0,
  );
  const temperatureTotal = temperatureMix
    ? temperatureMix.HOT + temperatureMix.WARM + temperatureMix.COLD
    : 0;

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-faint">
          {describeWhatsAppAnalyticsRange(range)} · counted from stored messages in UTC days
        </p>
        <RangeSwitcher active={range} />
      </div>

      {read.capped ? (
        <p className="mt-3 rounded-lg bg-brass-tint px-3 py-2.5 text-xs leading-5 text-[#6f4f16]">
          This range holds more than {ROW_LIMIT.toLocaleString("en-US")} messages, so the figures
          below cover the most recent {ROW_LIMIT.toLocaleString("en-US")} only. Choose a shorter
          range for an exact count.
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Messages sent"
          value={formatWhatsAppMetric(totals.sent)}
          icon="campaigns"
          note={
            delivery.total > 0
              ? `${formatWhatsAppRate(delivery.deliveredRate)} reached the handset`
              : "Nothing sent in this range"
          }
        />
        <MetricCard
          label="Messages received"
          value={formatWhatsAppMetric(totals.received)}
          icon="conversations"
          note={`${dailyAverage.toLocaleString("en-US")} messages per day both ways`}
        />
        <MetricCard
          label="Active conversations"
          value={formatWhatsAppMetric(totals.activeConversations)}
          icon="overview"
          note="At least one message in this range"
        />
        <MetricCard
          label="New contacts"
          value={formatWhatsAppMetric(newContacts)}
          icon="contacts"
          note={
            temperatureMix && temperatureTotal > 0
              ? `${temperatureMix.HOT} hot · ${temperatureMix.WARM} warm`
              : "First messaged us in this range"
          }
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Message volume</h2>
              <p className="mt-0.5 text-xs text-ink-faint">
                Sent vs received per day · {range} days (UTC)
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
                  aria-label={`Messages sent and received per day over the last ${range} days. Peak of ${activityMax} messages in a day.`}
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
                    <circle
                      cx={receivedGeometry.last.x}
                      cy={receivedGeometry.last.y}
                      r={4}
                      className="fill-brass"
                    />
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
                Busiest day: {busiestDay?.label} ·{" "}
                <span className="tabular-nums">
                  {(busiestDay?.sent || 0) + (busiestDay?.received || 0)}
                </span>{" "}
                messages
              </p>
            </>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-rule-strong px-4 py-12 text-center">
              <p className="text-sm text-ink-soft">No messages in the last {range} days.</p>
              <p className="mt-1 text-xs text-ink-faint">
                This chart fills in from stored WhatsApp messages as conversations come in.
              </p>
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5">
          <h2 className="text-sm font-semibold text-ink">Delivery</h2>
          <p className="mt-0.5 text-xs text-ink-faint">
            Outbound messages by the furthest status Meta reported
          </p>

          {delivery.total > 0 ? (
            <>
              <ul className="mt-4 space-y-3">
                {funnelKeys.map((key) => {
                  const count = delivery.counts[key];
                  const share = count / delivery.total;
                  return (
                    <li key={key}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-ink">{DELIVERY_LABELS[key]}</span>
                        <span className="flex-none tabular-nums text-ink-soft">
                          {count.toLocaleString("en-US")}
                          <span className="ml-1.5 text-xs text-ink-faint">
                            {formatWhatsAppRate(share)}
                          </span>
                        </span>
                      </div>
                      <div
                        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-sunk"
                        role="presentation"
                      >
                        <div
                          className={`h-full rounded-full ${DELIVERY_BAR_CLASSES[key]}`}
                          style={{ width: `${Math.max(share * 100, count > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[0.65rem] text-ink-faint">{DELIVERY_NOTES[key]}</p>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-4 border-t border-rule pt-3 text-xs leading-5 text-ink-faint">
                Meta overwrites a message&apos;s status as it progresses, so each message is counted
                once at the furthest point it reached. Queued means no status webhook has arrived
                yet.
              </p>
            </>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-rule-strong px-4 py-8 text-center">
              <p className="text-sm text-ink-soft">Nothing sent in this range.</p>
              <p className="mt-1 text-xs text-ink-faint">
                Delivery and read rates need outbound messages before they mean anything, so they
                are left blank rather than shown as zero.
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5">
          <h2 className="text-sm font-semibold text-ink">Response time</h2>
          <p className="mt-0.5 text-xs text-ink-faint">How long customers waited for a reply</p>

          {responseTimes.measured > 0 ? (
            <>
              <p className="mt-3 font-display text-3xl font-semibold leading-none tabular-nums text-ink">
                {formatWhatsAppDuration(responseTimes.medianMs)}
              </p>
              <p className="mt-1.5 text-xs text-ink-faint">
                Median across{" "}
                <span className="tabular-nums">
                  {responseTimes.measured.toLocaleString("en-US")}
                </span>{" "}
                answered message{responseTimes.measured === 1 ? "" : "s"}
              </p>

              {responseTarget.status === "unset" ? (
                <p className="mt-2.5 text-xs text-ink-faint">
                  No first-reply target set.{" "}
                  <Link href="/admin/whatsapp/settings/" className="font-medium text-ledger underline">
                    Set one in Settings
                  </Link>{" "}
                  to judge this against a number.
                </p>
              ) : (
                <p
                  className={`mt-2.5 inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${
                    responseTarget.status === "met"
                      ? "bg-ledger-tint text-ledger ring-1 ring-ledger/15"
                      : responseTarget.status === "missed"
                        ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                        : "bg-paper-sunk text-ink-faint ring-1 ring-rule"
                  }`}
                >
                  {responseTarget.label}
                </p>
              )}

              <dl className="mt-3">
                <StatRow label="Average" value={formatWhatsAppDuration(responseTimes.averageMs)} />
                <StatRow label="Fastest" value={formatWhatsAppDuration(responseTimes.fastestMs)} />
                <StatRow label="Slowest" value={formatWhatsAppDuration(responseTimes.slowestMs)} />
              </dl>

              <p className="mt-3 border-t border-rule pt-3 text-[0.65rem] leading-5 text-ink-faint">
                Measured per conversation from the first unanswered customer message to the next
                reply. A run of messages from one customer counts as a single wait.
              </p>
            </>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-rule-strong px-4 py-8 text-center">
              <p className="text-sm text-ink-soft">Nothing to measure yet.</p>
              <p className="mt-1 text-xs text-ink-faint">
                A response time needs an inbound message answered by an outbound one inside this
                range.
              </p>
              {responseTarget.status === "unknown" ? (
                <p className="mt-2 text-[0.65rem] text-ink-faint">
                  A {responseTarget.targetMinutes} minute target is set and will be judged once there
                  is something to measure.
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5">
          <h2 className="text-sm font-semibold text-ink">New contact quality</h2>
          <p className="mt-0.5 text-xs text-ink-faint">
            Lead temperature of contacts first seen in this range
          </p>

          {temperatureMix && temperatureTotal > 0 ? (
            <>
              <div
                className="mt-4 flex h-2 overflow-hidden rounded-full bg-paper-sunk"
                role="presentation"
              >
                {(["HOT", "WARM", "COLD"] as const).map((key) =>
                  temperatureMix[key] > 0 ? (
                    <span
                      key={key}
                      className={
                        key === "HOT"
                          ? "bg-rose-400"
                          : key === "WARM"
                            ? "bg-brass"
                            : "bg-rule-strong"
                      }
                      style={{ width: `${(temperatureMix[key] / temperatureTotal) * 100}%` }}
                    />
                  ) : null,
                )}
              </div>

              <dl className="mt-3">
                <StatRow
                  label="Hot"
                  value={`${temperatureMix.HOT} · ${formatWhatsAppRate(
                    temperatureMix.HOT / temperatureTotal,
                  )}`}
                />
                <StatRow
                  label="Warm"
                  value={`${temperatureMix.WARM} · ${formatWhatsAppRate(
                    temperatureMix.WARM / temperatureTotal,
                  )}`}
                />
                <StatRow
                  label="Cold"
                  value={`${temperatureMix.COLD} · ${formatWhatsAppRate(
                    temperatureMix.COLD / temperatureTotal,
                  )}`}
                />
              </dl>

              <Link
                href="/admin/whatsapp/contacts/"
                className="mt-3 inline-flex text-xs font-medium text-ledger underline decoration-ledger/30 underline-offset-4 hover:text-ledger-bright"
              >
                Open the contact directory
              </Link>
            </>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-rule-strong px-4 py-8 text-center text-sm text-ink-faint">
              {temperatureMix
                ? "No new contacts in this range."
                : "Contact records could not be read."}
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5 lg:col-span-2 xl:col-span-1">
          <h2 className="text-sm font-semibold text-ink">What these figures are</h2>
          <ul className="mt-3 space-y-2.5 text-xs leading-5 text-ink-faint">
            <li>
              Everything is counted from messages this deployment stored — nothing is pulled from
              Meta&apos;s own insights, so the numbers match what the inbox shows.
            </li>
            <li>
              Days are UTC days, matching the overview chart, so a late-evening message locally may
              land on the following day here.
            </li>
            <li>
              Delivery statuses only exist for messages sent after status webhooks were wired up.
              Older outbound messages sit in Queued because Meta never reported on them to us.
            </li>
            <li>
              Rates are left blank rather than shown as 0% when there is nothing to divide by.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
