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

export default async function WhatsAppFlowsPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access || !canWhatsAppRoleSuperviseTeam(access.role)) return <div className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-800">Owner or Manager access is required to manage WhatsApp Flows.</div></div>;
  const [flowResult, submissions] = await Promise.all([getFlows(), getSubmissions()]);
  const encryptionConfigured = isWhatsAppFlowEncryptionConfigured();
  const published = flowResult.flows.filter((flow) => String(flow.status).toUpperCase() === "PUBLISHED").length;

  return <div className="w-full p-3 sm:p-5 lg:p-6">
    <header className="mb-5 flex flex-col gap-4 border-b border-rule pb-5 xl:flex-row xl:items-end xl:justify-between">
      <div><div className="mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ledger-bright"><span className="h-1.5 w-1.5 rounded-full bg-ledger-bright" />Interactive customer journeys</div><h1 className="text-2xl font-semibold text-ink sm:text-3xl">WhatsApp Flows</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-ink-faint">Build, publish and inspect interactive Meta Flow experiences from one application workspace.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin/whatsapp/automations/" className="inline-flex items-center gap-2 rounded-xl border border-rule bg-paper-raised px-3.5 py-2.5 text-xs font-semibold text-ink-soft hover:border-rule-strong hover:text-ink"><WhatsAppIcon name="automations" className="h-4 w-4" />Automations</Link><Link href="/admin/whatsapp/analytics/" className="inline-flex items-center gap-2 rounded-xl border border-ledger-bright/25 bg-ledger-tint px-3.5 py-2.5 text-xs font-semibold text-ledger-bright"><WhatsAppIcon name="analytics" className="h-4 w-4" />Flow analytics</Link></div>
    </header>

    <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Total flows</p><p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{flowResult.flows.length}</p><p className="mt-1 text-xs text-ink-faint">Saved in this workspace</p></article>
      <article className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Published</p><p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{published}</p><p className="mt-1 text-xs text-ink-faint">Available to customers</p></article>
      <article className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Submissions</p><p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{submissions.length}</p><p className="mt-1 text-xs text-ink-faint">Tracked responses</p></article>
      <article className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Encryption</p><p className={`mt-2 text-sm font-semibold ${encryptionConfigured ? "text-ledger-bright" : "text-amber-700"}`}>{encryptionConfigured ? "Configured" : "Needs attention"}</p><p className="mt-2 text-xs text-ink-faint">Dynamic Data protection</p></article>
    </section>

    <section className="min-w-0 overflow-hidden rounded-2xl border border-rule bg-paper-raised"><div className="border-b border-rule px-4 py-3 sm:px-5"><p className="text-sm font-semibold text-ink">Flow workspace</p><p className="mt-0.5 text-xs text-ink-faint">Manage designs, publishing, submissions and runtime configuration.</p></div><div className="min-w-0 p-3 sm:p-4"><FlowManager flows={flowResult.flows} submissions={submissions} storageReady={flowResult.ready} role={access.role} encryptionConfigured={encryptionConfigured} /></div></section>
  </div>;
}
