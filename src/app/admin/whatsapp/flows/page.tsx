import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { isWhatsAppFlowEncryptionConfigured } from "@/lib/whatsapp/flowCrypto";
import { normalizeWhatsAppFlowRow, normalizeWhatsAppFlowSubmissionRow, type WhatsAppFlow, type WhatsAppFlowSubmission } from "@/lib/whatsapp/flowModel";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import FlowManager from "../FlowManager";

export const metadata: Metadata = { title: "WhatsApp Flows | Web Growth", robots: { index: false, follow: false } };

async function getFlows(): Promise<{ flows: WhatsAppFlow[]; ready: boolean }> {
  const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_flows?select=*&order=updated_at.desc&limit=500");
  if (rows === null) return { flows: [], ready: false };
  return { flows: rows.map(normalizeWhatsAppFlowRow), ready: true };
}

async function getSubmissions(): Promise<WhatsAppFlowSubmission[]> {
  const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_flow_submissions?select=*&order=created_at.desc&limit=500");
  return (rows || []).map(normalizeWhatsAppFlowSubmissionRow);
}

function RailRow({ icon, label, value, active = false }: { icon: "automations" | "analytics" | "statusDelivered" | "statusPending"; label: string; value?: string | number; active?: boolean }) {
  return <div className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs ${active ? "bg-ledger-tint text-ledger-bright" : "text-ink-soft"}`}><WhatsAppIcon name={icon} className="h-4 w-4 flex-none" /><span className="min-w-0 flex-1 truncate">{label}</span>{value !== undefined ? <span className="text-[0.65rem] font-semibold tabular-nums text-ink-faint">{value}</span> : null}</div>;
}

export default async function WhatsAppFlowsPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access || !canWhatsAppRoleSuperviseTeam(access.role)) return <div className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-xl rounded-xl border border-rose-900/40 bg-rose-950/30 px-5 py-6 text-sm text-rose-200">Owner or Manager access is required to manage WhatsApp Flows.</div></div>;

  const [flowResult, submissions] = await Promise.all([getFlows(), getSubmissions()]);
  const encryptionConfigured = isWhatsAppFlowEncryptionConfigured();
  const published = flowResult.flows.filter((flow) => String(flow.status).toUpperCase() === "PUBLISHED").length;
  const drafts = flowResult.flows.filter((flow) => String(flow.status).toUpperCase() !== "PUBLISHED").length;

  return (
    <div className="wg-app-page flex min-h-full min-w-0 flex-col">
      <header className="wg-page-commandbar flex flex-none flex-col gap-3 border-b border-rule px-4 py-3 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ledger-bright"><span className="h-1.5 w-1.5 rounded-full bg-ledger-bright" />Interactive journeys</div>
          <div className="mt-1 flex min-w-0 items-center gap-3"><h2 className="truncate text-lg font-semibold text-ink">WhatsApp Flows</h2><span className="rounded-md border border-rule bg-paper-sunk px-2 py-0.5 text-[0.62rem] font-medium text-ink-faint">{flowResult.flows.length} flows</span></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/whatsapp/automations/" className="wg-btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold"><WhatsAppIcon name="automations" className="h-4 w-4" />Automations</Link>
          <Link href="/admin/whatsapp/analytics/" className="wg-btn-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold"><WhatsAppIcon name="analytics" className="h-4 w-4" />Flow analytics</Link>
        </div>
      </header>

      <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[13.5rem_minmax(0,1fr)] 2xl:grid-cols-[13.5rem_minmax(0,1fr)_18rem]">
        <aside className="wg-context-rail border-b border-rule p-2.5 lg:border-b-0 lg:border-r">
          <p className="px-2.5 pb-1.5 pt-1 text-[0.58rem] font-semibold uppercase tracking-[.15em] text-ink-faint">Flow workspace</p>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">
            <RailRow icon="automations" label="All flows" value={flowResult.flows.length} active />
            <RailRow icon="statusDelivered" label="Published" value={published} />
            <RailRow icon="statusPending" label="Draft / review" value={drafts} />
            <RailRow icon="analytics" label="Submissions" value={submissions.length} />
          </div>
          <div className="mt-3 hidden border-t border-rule px-2.5 pt-3 lg:block">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Related</p>
            <div className="mt-1.5 grid gap-0.5"><Link href="/admin/whatsapp/templates/" className="rounded-md px-2 py-1.5 text-xs text-ink-soft hover:bg-paper-sunk hover:text-ink">Message templates</Link><Link href="/admin/whatsapp/campaigns/" className="rounded-md px-2 py-1.5 text-xs text-ink-soft hover:bg-paper-sunk hover:text-ink">Campaigns</Link></div>
          </div>
        </aside>

        <main className="wg-editor-surface min-h-0 min-w-0 overflow-hidden border-rule 2xl:border-r">
          <FlowManager flows={flowResult.flows} submissions={submissions} storageReady={flowResult.ready} role={access.role} encryptionConfigured={encryptionConfigured} />
        </main>

        <aside className="wg-inspector-rail hidden min-h-0 overflow-y-auto p-4 2xl:block">
          <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${flowResult.ready ? "bg-ledger-bright" : "bg-amber-400"}`} /><p className="text-xs font-semibold text-ink">Publishing readiness</p></div>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-rule bg-paper-sunk p-3"><p className="text-[0.6rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Storage</p><p className="mt-1.5 text-xs font-medium text-ink">{flowResult.ready ? "Ready" : "Unavailable"}</p></div>
            <div className="rounded-lg border border-rule bg-paper-sunk p-3"><p className="text-[0.6rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Dynamic Data encryption</p><p className={`mt-1.5 text-xs font-medium ${encryptionConfigured ? "text-ledger-bright" : "text-amber-300"}`}>{encryptionConfigured ? "Configured" : "Needs attention"}</p></div>
            <div className="rounded-lg border border-rule bg-paper-sunk p-3"><p className="text-[0.6rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Published</p><p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{published}</p><p className="mt-1 text-[0.68rem] leading-5 text-ink-faint">Published Flows can be launched from conversations and automations.</p></div>
          </div>
          <div className="mt-4 border-t border-rule pt-4"><p className="text-[0.6rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Runtime</p><p className="mt-2 text-[0.7rem] leading-5 text-ink-faint">Builder actions below remain connected to the existing Meta Flow integration. This panel is presentation-only.</p></div>
        </aside>
      </div>
    </div>
  );
}
