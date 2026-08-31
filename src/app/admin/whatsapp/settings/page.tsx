import type { Metadata } from "next";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { SITE_URL } from "@/lib/site";
import {
  WHATSAPP_PROFILE_FIELD_LABELS,
  fetchWhatsAppBusinessProfile,
  summarizeWhatsAppBusinessProfile,
} from "@/lib/whatsapp/businessProfile";
import { fetchWhatsAppPhoneNumbers } from "@/lib/whatsapp/phoneNumbers";
import { isWhatsAppBusinessHoursOpen, summarizeWhatsAppSettings } from "@/lib/whatsapp/settings";
import { loadWhatsAppSettings } from "@/lib/whatsapp/settingsStore";
import { probeWhatsAppTable, type WhatsAppTableProbe } from "../data";
import { hasWhatsAppAdminAccess } from "../auth";
import SettingsEditor from "../SettingsEditor";
import {
  WHATSAPP_EXPECTED_TABLES,
  buildWhatsAppCapabilities,
  buildWhatsAppSettingRows,
  buildWhatsAppWebhookUrl,
  countMissingRequiredWhatsAppSettings,
  describeWhatsAppSettingStatus,
  resolveWhatsAppVerifyTokenSource,
  summarizeWhatsAppCapabilities,
  type WhatsAppSettingRow,
  type WhatsAppSettingStatus,
} from "../integrationModel";

export const metadata: Metadata = {
  title: "WhatsApp Settings | Web Growth",
  robots: { index: false, follow: false },
};

type Tone = "good" | "warn" | "bad" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  good: "bg-ledger-tint text-ledger ring-1 ring-ledger/15",
  warn: "bg-brass-tint text-[#6f4f16] ring-1 ring-brass/25",
  bad: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  neutral: "bg-paper-sunk text-ink-faint ring-1 ring-rule",
};

function StatusChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`inline-flex flex-none items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${TONE_CLASSES[tone]}`}>{children}</span>;
}

function settingTone(status: WhatsAppSettingStatus): Tone {
  if (status === "set") return "good";
  if (status === "legacy") return "warn";
  if (status === "default") return "neutral";
  return "bad";
}

function Card({ title, description, children, action }: { title: string; description: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-rule bg-paper-raised p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-ink-faint">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-rule py-3 text-sm first:border-t-0">
      <dt className="flex-none text-ink-faint">{label}</dt>
      <dd className="min-w-0 break-words text-right text-ink">{value}</dd>
    </div>
  );
}

function describeTableProbe(probe: WhatsAppTableProbe): { tone: Tone; label: string; note: string } {
  if (probe === "ok") return { tone: "good", label: "Present", note: "Readable" };
  if (probe === "missing") return { tone: "bad", label: "Missing", note: "Migration required" };
  if (probe === "unconfigured") return { tone: "neutral", label: "Unknown", note: "Database not configured" };
  return { tone: "warn", label: "Unreachable", note: "Database did not answer" };
}

function SettingRow({ row }: { row: WhatsAppSettingRow }) {
  return (
    <tr className="border-b border-rule last:border-b-0 align-top">
      <th scope="row" className="py-3 pr-3 font-normal">
        <span className="block break-all font-mono text-xs text-ink">{row.name}</span>
        <span className="mt-0.5 block text-xs leading-5 text-ink-faint">{row.purpose}</span>
      </th>
      <td className="py-3 pr-3 text-xs text-ink-soft">{row.value ? <span className="break-all font-mono">{row.value}</span> : row.kind === "secret" ? "Hidden" : "—"}</td>
      <td className="py-3"><StatusChip tone={settingTone(row.status)}>{describeWhatsAppSettingStatus(row.status)}</StatusChip></td>
    </tr>
  );
}

export default async function WhatsAppSettingsPage() {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <GoogleAdminPrompt nextPath="/admin/whatsapp/settings/" adminEmail={getDefaultAdminGoogleEmail()} clientId={getGoogleClientId()} googleReady={isGoogleAuthConfigured()} />
        </div>
      </div>
    );
  }

  const rows = buildWhatsAppSettingRows(process.env);
  const capabilities = buildWhatsAppCapabilities(process.env);
  const summary = summarizeWhatsAppCapabilities(capabilities);
  const missingRequired = countMissingRequiredWhatsAppSettings(rows);
  const verifySource = resolveWhatsAppVerifyTokenSource(process.env);
  const webhookUrl = buildWhatsAppWebhookUrl(SITE_URL);

  const [phoneResult, profileResult, tableProbes, settingsLoad] = await Promise.all([
    fetchWhatsAppPhoneNumbers({ revalidateSeconds: 300 }),
    fetchWhatsAppBusinessProfile({ revalidateSeconds: 300 }),
    Promise.all(WHATSAPP_EXPECTED_TABLES.map(async (table) => ({ table, probe: await probeWhatsAppTable(table) }))),
    loadWhatsAppSettings({ maxAgeMs: 0 }),
  ]);

  const settings = settingsLoad.settings;
  const settingsSummary = summarizeWhatsAppSettings(settings);
  const openNow = isWhatsAppBusinessHoursOpen(settings.businessHours, new Date());
  const storageReady = settingsLoad.reason !== "missing-table";
  const missingTables = tableProbes.filter((entry) => entry.probe === "missing");

  const credentialCheck = phoneResult.ok
    ? { tone: "good" as Tone, label: "Connected", note: `${phoneResult.phoneNumbers.length} WhatsApp number${phoneResult.phoneNumbers.length === 1 ? "" : "s"} connected and accepted by Meta.` }
    : phoneResult.reason === "NOT_CONFIGURED"
      ? { tone: "neutral" as Tone, label: "Not configured", note: "The WhatsApp connection has not been fully configured." }
      : phoneResult.reason === "PERMISSION_DENIED"
        ? { tone: "bad" as Tone, label: "Connection issue", note: "Meta rejected the current credential. Reconnection is required." }
        : { tone: "warn" as Tone, label: "Check failed", note: "Meta could not be reached during this check." };

  const profileSummary = profileResult.ok ? summarizeWhatsAppBusinessProfile(profileResult.profile) : null;
  const hasPicture = Boolean(profileSummary?.customerVisiblePicture);
  const setFields = profileSummary?.set ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[.16em] text-ledger">WhatsApp Business</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Settings</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage your business identity, messaging preferences and WhatsApp connection.</p>
        </div>
        <StatusChip tone={credentialCheck.tone}>{credentialCheck.label}</StatusChip>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <div className="grid min-w-0 gap-5">
          <Card
            title="Business profile"
            description="The business identity customers see on WhatsApp. Profile data is read live from Meta."
            action={<StatusChip tone={profileResult.ok ? "good" : "warn"}>{profileResult.ok ? "Synced with Meta" : "Unavailable"}</StatusChip>}
          >
            {profileResult.ok ? (
              <>
                <div className="flex items-center gap-4 rounded-xl border border-rule bg-paper p-4">
                  {hasPicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/api/admin/whatsapp/profile-photo/" alt="Web Growth WhatsApp Business profile" width={72} height={72} className="h-[72px] w-[72px] flex-none rounded-full border border-rule object-cover" />
                  ) : (
                    <span className="grid h-[72px] w-[72px] flex-none place-items-center rounded-full border border-dashed border-rule-strong bg-paper-sunk text-xs text-ink-faint">No photo</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-ink">Web Growth</p>
                    <p className="mt-1 text-xs leading-5 text-ink-soft">{profileSummary ? `${profileSummary.set.length} of ${profileSummary.set.length + profileSummary.missing.length} profile fields are complete.` : "Profile loaded."}</p>
                    <p className="mt-1 text-[0.7rem] text-ink-faint">Profile changes are managed in WhatsApp Manager and reflected here after Meta syncs them.</p>
                  </div>
                </div>
                <dl className="mt-3">
                  {WHATSAPP_PROFILE_FIELD_LABELS.map((field) => {
                    const populated = setFields.includes(field.label);
                    return <Row key={field.label} label={field.label} value={<StatusChip tone={populated ? "good" : "neutral"}>{populated ? "Set" : "Not set"}</StatusChip>} />;
                  })}
                </dl>
              </>
            ) : (
              <p className="rounded-xl border border-brass/25 bg-brass-tint p-4 text-sm text-ink-soft">Meta did not return the business profile during this request. Your saved configuration has not been changed.</p>
            )}
          </Card>

          <Card title="Messaging & response" description="Control business hours, response targets, inbox behaviour and lead classification.">
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusChip tone={openNow === null ? "neutral" : openNow ? "good" : "warn"}>{openNow === null ? "Hours not tracked" : openNow ? "Open now" : "Closed now"}</StatusChip>
              <StatusChip tone={settingsSummary.changedFromDefaults ? "good" : "neutral"}>{settingsSummary.changedFromDefaults ? "Customised" : "Defaults"}</StatusChip>
            </div>
            <SettingsEditor settings={settings} storageReady={storageReady} />
          </Card>
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <Card title="WhatsApp connection" description="Live connection health for the production WhatsApp account." action={<StatusChip tone={credentialCheck.tone}>{credentialCheck.label}</StatusChip>}>
            <p className="text-sm leading-6 text-ink-soft">{credentialCheck.note}</p>
            <dl className="mt-3">
              <Row label="API" value={<StatusChip tone={credentialCheck.tone}>{phoneResult.ok ? "Healthy" : "Check required"}</StatusChip>} />
              <Row label="Capabilities" value={`${summary.available}/${summary.total} available`} />
              <Row label="Configuration" value={<StatusChip tone={missingRequired === 0 ? "good" : "bad"}>{missingRequired === 0 ? "Complete" : `${missingRequired} missing`}</StatusChip>} />
              <Row label="Database" value={<StatusChip tone={missingTables.length === 0 ? "good" : "bad"}>{missingTables.length === 0 ? "Healthy" : `${missingTables.length} issue${missingTables.length === 1 ? "" : "s"}`}</StatusChip>} />
            </dl>
          </Card>

          <Card title="Connection health" description="The checks that matter day to day, without making you read environment variables for sport.">
            <div className="grid gap-2">
              {capabilities.map((capability) => (
                <div key={capability.key} className="flex items-center justify-between gap-3 rounded-xl border border-rule bg-paper px-3.5 py-3">
                  <span className="text-sm text-ink">{capability.label}</span>
                  <StatusChip tone={capability.available ? "good" : "bad"}>{capability.available ? "Working" : "Blocked"}</StatusChip>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Webhook & API" description="Read-only production routing information.">
            <dl>
              <Row label="Webhook" value={<span className="max-w-[190px] break-all font-mono text-[0.68rem] text-ink-soft">{webhookUrl}</span>} />
              <Row label="Signature" value={<StatusChip tone={capabilities.find((item) => item.key === "signature")?.available ? "good" : "bad"}>{capabilities.find((item) => item.key === "signature")?.available ? "Enforced" : "Off"}</StatusChip>} />
              <Row label="Verify token" value={<StatusChip tone={verifySource === null ? "bad" : verifySource === "WHATSAPP_VERIFY_TOKEN" ? "warn" : "good"}>{verifySource === null ? "Missing" : verifySource === "WHATSAPP_VERIFY_TOKEN" ? "Legacy name" : "Set"}</StatusChip>} />
              <Row label="Subscribed field" value={<span className="font-mono text-xs">messages</span>} />
            </dl>
          </Card>
        </aside>
      </div>

      <details className="mt-6 rounded-2xl border border-rule bg-paper-raised">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink sm:px-6">Advanced diagnostics <span className="ml-2 text-xs font-normal text-ink-faint">Technical configuration and database checks</span></summary>
        <div className="grid gap-5 border-t border-rule p-5 sm:p-6 xl:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold text-ink">Environment configuration</h2>
            <p className="mt-1 text-xs leading-5 text-ink-faint">Secrets stay hidden. This area is for troubleshooting, not normal account management.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead><tr className="border-b border-rule text-[0.68rem] uppercase tracking-wide text-ink-faint"><th className="pb-2 pr-3 font-medium">Variable</th><th className="pb-2 pr-3 font-medium">Value</th><th className="pb-2 font-medium">Status</th></tr></thead>
                <tbody>{rows.map((row) => <SettingRow key={row.name} row={row} />)}</tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ink">Database tables</h2>
            <p className="mt-1 text-xs leading-5 text-ink-faint">Confirms the tables required by the WhatsApp console can be read.</p>
            <dl className="mt-3">
              {tableProbes.map(({ table, probe }) => {
                const result = describeTableProbe(probe);
                return <Row key={table} label={<span className="font-mono text-xs">{table}</span>} value={<span className="inline-flex items-center gap-2"><span className="text-xs text-ink-faint">{result.note}</span><StatusChip tone={result.tone}>{result.label}</StatusChip></span>} />;
              })}
            </dl>
          </section>
        </div>
      </details>

      <section className="mt-5 rounded-2xl border border-rule bg-paper-raised p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Account & safety</h2>
            <p className="mt-1 text-xs leading-5 text-ink-faint">Connection-changing and destructive controls will live here only when they have a safe, real backend action.</p>
          </div>
          <StatusChip tone="neutral">Protected</StatusChip>
        </div>
        <div className="mt-4 rounded-xl border border-rule bg-paper p-4">
          <p className="text-sm font-medium text-ink">No destructive actions are exposed yet</p>
          <p className="mt-1 text-xs leading-5 text-ink-soft">The console will not show fake Disconnect, Reset or Delete buttons. Those controls will be added only with confirmation, audit logging and a working server-side operation.</p>
        </div>
      </section>
    </div>
  );
}
