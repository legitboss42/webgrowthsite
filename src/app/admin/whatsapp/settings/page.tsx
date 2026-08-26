import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import InternalUtilityUnlockForm from "@/components/internal/InternalUtilityUnlockForm";
import { getInternalUtilityLocalPassphrase } from "@/lib/internalUtilityAuth";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import { WHATSAPP_NAV_SECTIONS } from "@/components/whatsapp/nav";
import { SITE_URL } from "@/lib/site";
import { fetchWhatsAppPhoneNumbers } from "@/lib/whatsapp/phoneNumbers";
import { probeWhatsAppTable, type WhatsAppTableProbe } from "../data";
import { hasWhatsAppAdminAccess } from "../auth";
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
} from "../settingsModel";

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
  return (
    <span
      className={`inline-flex flex-none items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

function settingTone(status: WhatsAppSettingStatus): Tone {
  if (status === "set") return "good";
  if (status === "legacy") return "warn";
  if (status === "default") return "neutral";
  return "bad";
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-0.5 text-xs leading-5 text-ink-faint">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-rule py-2.5 text-sm first:border-t-0">
      <dt className="flex-none text-ink-faint">{label}</dt>
      <dd className="min-w-0 break-words text-right text-ink">{value}</dd>
    </div>
  );
}

function describeTableProbe(probe: WhatsAppTableProbe): { tone: Tone; label: string; note: string } {
  if (probe === "ok") return { tone: "good", label: "Present", note: "Readable with the service role." };
  if (probe === "missing") {
    return {
      tone: "bad",
      label: "Not created",
      note: "Its migration has not been applied to this project yet.",
    };
  }
  if (probe === "unconfigured") {
    return { tone: "neutral", label: "Unknown", note: "Supabase credentials are not set, so it cannot be checked." };
  }
  return { tone: "warn", label: "Unreachable", note: "The database did not answer. The server log has the detail." };
}

/** Nav hrefs omit the trailing slash; `trailingSlash: true` would redirect without it. */
function withTrailingSlash(href: string) {
  return href.endsWith("/") ? href : `${href}/`;
}

function SettingRow({ row }: { row: WhatsAppSettingRow }) {
  return (
    <tr className="border-b border-rule last:border-b-0 align-top">
      <th scope="row" className="py-2.5 pr-3 font-normal">
        <span className="block break-all font-mono text-xs text-ink">{row.name}</span>
        <span className="mt-0.5 block text-xs leading-5 text-ink-faint">{row.purpose}</span>
        {row.suppliedBy ? (
          <span className="mt-0.5 block text-xs text-ink-faint">
            Supplied by the deprecated{" "}
            <span className="font-mono text-[0.7rem]">{row.suppliedBy}</span>
          </span>
        ) : null}
      </th>
      <td className="py-2.5 pr-3">
        {row.value ? (
          <span className="break-all font-mono text-xs text-ink-soft">{row.value}</span>
        ) : row.kind === "secret" ? (
          <span className="text-xs text-ink-faint">Not shown</span>
        ) : (
          <span className="text-xs text-ink-faint">—</span>
        )}
      </td>
      <td className="py-2.5">
        <StatusChip tone={settingTone(row.status)}>
          {describeWhatsAppSettingStatus(row.status)}
        </StatusChip>
      </td>
    </tr>
  );
}

export default async function WhatsAppSettingsPage() {
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

  const rows = buildWhatsAppSettingRows(process.env);
  const capabilities = buildWhatsAppCapabilities(process.env);
  const summary = summarizeWhatsAppCapabilities(capabilities);
  const missingRequired = countMissingRequiredWhatsAppSettings(rows);
  const verifySource = resolveWhatsAppVerifyTokenSource(process.env);
  const webhookUrl = buildWhatsAppWebhookUrl(SITE_URL);

  // Presence of a token is not proof it still works, so the one live check worth
  // making is the same cached Graph read the overview already performs.
  const [phoneResult, tableProbes] = await Promise.all([
    fetchWhatsAppPhoneNumbers({ revalidateSeconds: 300 }),
    Promise.all(
      WHATSAPP_EXPECTED_TABLES.map(async (table) => ({
        table,
        probe: await probeWhatsAppTable(table),
      })),
    ),
  ]);

  const credentialCheck = phoneResult.ok
    ? { tone: "good" as Tone, label: "Accepted by Meta", note: `Read ${phoneResult.phoneNumbers.length} number${phoneResult.phoneNumbers.length === 1 ? "" : "s"} from the business account.` }
    : phoneResult.reason === "NOT_CONFIGURED"
      ? { tone: "neutral" as Tone, label: "Not checked", note: "The token or business account ID is missing, so there was nothing to test." }
      : phoneResult.reason === "PERMISSION_DENIED"
        ? { tone: "bad" as Tone, label: "Rejected by Meta", note: "The token was refused. It has expired or lost WhatsApp business management permission." }
        : { tone: "warn" as Tone, label: "Could not reach Meta", note: "The Graph API did not answer. This is usually temporary." };

  const missingTables = tableProbes.filter((entry) => entry.probe === "missing");

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div
        className={`rounded-xl border p-5 ${
          missingRequired === 0
            ? "border-ledger/20 bg-ledger-tint"
            : "border-rose-200 bg-rose-50"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-ink">
              {missingRequired === 0
                ? "Every required variable is set"
                : `${missingRequired} required variable${missingRequired === 1 ? "" : "s"} missing`}
            </h1>
            <p className="mt-0.5 text-xs leading-5 text-ink-soft">
              <span className="tabular-nums">{summary.available}</span> of{" "}
              <span className="tabular-nums">{summary.total}</span> integration capabilities
              available on this deployment.
            </p>
          </div>
          <StatusChip tone={missingRequired === 0 ? "good" : "bad"}>
            {missingRequired === 0 ? "Configured" : "Incomplete"}
          </StatusChip>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
        <div className="grid min-w-0 gap-5">
          <Section
            title="What works right now"
            description="Each capability lists only the variables it needs. A blocked one names the symptom you would actually see."
          >
            <ul className="grid gap-2.5">
              {capabilities.map((capability) => (
                <li
                  key={capability.key}
                  className="rounded-lg border border-rule bg-paper px-3.5 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 text-sm font-medium text-ink">{capability.label}</p>
                    <StatusChip tone={capability.available ? "good" : "bad"}>
                      {capability.available ? "Available" : "Blocked"}
                    </StatusChip>
                  </div>
                  {capability.available ? null : (
                    <>
                      <p className="mt-1.5 text-xs leading-5 text-ink-soft">
                        {capability.consequence}
                      </p>
                      <p className="mt-1 text-xs text-ink-faint">
                        Needs{" "}
                        {capability.missing.map((name, index) => (
                          <span key={name}>
                            {index > 0 ? " and " : ""}
                            <span className="font-mono text-[0.7rem] text-ink-soft">{name}</span>
                          </span>
                        ))}
                      </p>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </Section>

          <Section
            title="Configuration"
            description="Variable names and whether they are set. Secrets are never displayed — only whether a value exists. Identifiers are shown because they are configuration, not credentials."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-rule text-[0.7rem] uppercase tracking-wide text-ink-faint">
                    <th scope="col" className="pb-2 pr-3 font-medium">
                      Variable
                    </th>
                    <th scope="col" className="pb-2 pr-3 font-medium">
                      Value
                    </th>
                    <th scope="col" className="pb-2 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <SettingRow key={row.name} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 rounded-lg bg-paper-sunk px-3 py-2.5 text-xs leading-5 text-ink-faint">
              Values are set in the hosting environment, not here. This page cannot change them, and
              a variable being set is not proof it is still valid — see the live credential check.
            </p>
          </Section>

          <Section
            title="Database"
            description="Whether each table the console reads has actually been created in this project."
          >
            <dl>
              {tableProbes.map(({ table, probe }) => {
                const described = describeTableProbe(probe);
                return (
                  <Row
                    key={table}
                    label={<span className="font-mono text-xs">{table}</span>}
                    value={
                      <span className="inline-flex flex-wrap items-center justify-end gap-2">
                        <span className="text-xs text-ink-faint">{described.note}</span>
                        <StatusChip tone={described.tone}>{described.label}</StatusChip>
                      </span>
                    }
                  />
                );
              })}
            </dl>
            {missingTables.length > 0 ? (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-800">
                Run the matching migration from{" "}
                <span className="font-mono">supabase/migrations/</span> in the Supabase SQL editor.
                Until then, any page backed by{" "}
                {missingTables.map((entry, index) => (
                  <span key={entry.table}>
                    {index > 0 ? " and " : ""}
                    <span className="font-mono">{entry.table}</span>
                  </span>
                ))}{" "}
                cannot read or save anything.
              </p>
            ) : null}
          </Section>
        </div>

        <div className="grid min-w-0 gap-5">
          <Section
            title="Live credential check"
            description="Read from Meta through the same cached call the overview uses."
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 text-sm text-ink-soft">{credentialCheck.note}</p>
              <StatusChip tone={credentialCheck.tone}>{credentialCheck.label}</StatusChip>
            </div>
          </Section>

          <Section
            title="Webhook"
            description="Where Meta delivers inbound messages and status updates."
          >
            <dl>
              <Row
                label="Endpoint"
                value={<span className="break-all font-mono text-xs text-ink-soft">{webhookUrl}</span>}
              />
              <Row
                label="Verify token"
                value={
                  verifySource === null ? (
                    <StatusChip tone="bad">Missing</StatusChip>
                  ) : verifySource === "WHATSAPP_VERIFY_TOKEN" ? (
                    <StatusChip tone="warn">Legacy name</StatusChip>
                  ) : (
                    <StatusChip tone="good">Set</StatusChip>
                  )
                }
              />
              <Row
                label="Signature check"
                value={
                  capabilities.find((capability) => capability.key === "signature")?.available ? (
                    <StatusChip tone="good">Enforced</StatusChip>
                  ) : (
                    <StatusChip tone="bad">Off</StatusChip>
                  )
                }
              />
              <Row label="Subscribed field" value={<span className="font-mono text-xs">messages</span>} />
            </dl>
            <p className="mt-3 rounded-lg bg-paper-sunk px-3 py-2.5 text-xs leading-5 text-ink-faint">
              Shown for reference. Whatever is already registered in Meta is what receives traffic —
              changing it there will interrupt delivery.
            </p>
          </Section>

          <Section
            title="Access"
            description="How this console decides who gets in."
          >
            <dl>
              <Row label="Indexing" value="Excluded from search engines and the sitemap" />
              <Row label="Unlock" value="Internal passphrase, or an owner session" />
              <Row label="Checked on" value="Every page in this console, server-side" />
            </dl>
            <p className="mt-3 rounded-lg bg-paper-sunk px-3 py-2.5 text-xs leading-5 text-ink-faint">
              Access is re-checked on the server for each request, so a stale browser tab cannot keep
              a revoked session alive.
            </p>
          </Section>

          <Section
            title="Console pages"
            description="What exists today, straight from the navigation model."
          >
            <div className="grid gap-3">
              {WHATSAPP_NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-faint">
                    {section.label}
                  </p>
                  <ul className="mt-1.5 grid gap-1">
                    {section.items.map((item) => (
                      <li
                        key={item.href}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        {item.status === "live" ? (
                          <Link
                            href={withTrailingSlash(item.href)}
                            className="min-w-0 truncate text-ink underline decoration-rule underline-offset-2 hover:decoration-ledger"
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <span className="min-w-0 truncate text-ink-faint">{item.label}</span>
                        )}
                        <StatusChip tone={item.status === "live" ? "good" : "neutral"}>
                          {item.status === "live" ? "Live" : "Soon"}
                        </StatusChip>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-rule bg-paper-raised p-5">
        <h2 className="text-sm font-semibold text-ink">What this page does and does not do</h2>
        <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-ink-faint">
          <li>
            It is read-only. Nothing here writes to the database, to Meta, or to the environment.
          </li>
          <li>
            It never displays a secret. Access tokens, the app secret, the verify token, and the
            service role key are reported as set or missing and nothing more.
          </li>
          <li>
            Identifiers and the Graph API version are shown in full — they are configuration, and on
            their own cannot send or read anything.
          </li>
          <li>
            A variable being set means a value exists, not that it still works. The live credential
            check is the only real test on this page.
          </li>
          <li>
            Table checks distinguish a missing migration from an unreachable database, which is the
            difference between work you need to do and a fault you should wait out.
          </li>
        </ul>
      </div>
    </div>
  );
}
