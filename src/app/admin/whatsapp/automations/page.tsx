import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import { canWhatsAppRoleSuperviseTeam, normalizeWhatsAppTeamMember, type WhatsAppTeamRole } from "@/lib/whatsapp/teamModel";
import { normalizeWhatsAppAutomationJobRow, normalizeWhatsAppAutomationRow, normalizeWhatsAppAutomationRunRow, type WhatsAppAutomation, type WhatsAppAutomationJob, type WhatsAppAutomationRun } from "@/lib/whatsapp/automationModel";
import { fetchWhatsAppTemplates } from "@/lib/whatsapp/templates";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import AutomationManager from "../AutomationManager";
import AIAutomationManager from "../AIAutomationManager";

export const metadata: Metadata = { title: "WhatsApp Automations | Web Growth", robots: { index: false, follow: false } };
const AUTOMATION_SELECT = "id,name,description,status,trigger_type,trigger_config,condition_join,conditions,actions,version,created_by_member_id,updated_by_member_id,activated_at,paused_at,created_at,updated_at";

async function getAutomations(): Promise<{ automations: WhatsAppAutomation[]; ready: boolean }> { const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_automations?select=${AUTOMATION_SELECT}&order=updated_at.desc`); return rows === null ? { automations: [], ready: false } : { automations: rows.map(normalizeWhatsAppAutomationRow), ready: true }; }
async function getRuns(): Promise<WhatsAppAutomationRun[]> { const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_automation_runs?select=id,automation_id,automation_version,status,trigger_type,trigger_event_key,contact_id,conversation_id,next_action_index,started_at,completed_at,error_code,error_message,created_at,updated_at&order=created_at.desc&limit=100"); return (rows || []).map(normalizeWhatsAppAutomationRunRow); }
async function getJobs(): Promise<WhatsAppAutomationJob[]> { const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_automation_jobs?status=in.(PENDING,PROCESSING,WAITING_INPUT)&select=id,run_id,automation_id,status,due_at,action_index,attempts,max_attempts,last_error,created_at&order=created_at.desc&limit=100"); return (rows || []).map(normalizeWhatsAppAutomationJobRow); }
async function getTeam() { const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_team_members?active=eq.true&select=id,google_email,display_name,role,availability,active,google_user_id,last_seen_at,created_at,updated_at&order=display_name.asc"); return (rows || []).map(normalizeWhatsAppTeamMember); }
async function getSavedReplies() { const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_quick_replies?scope=eq.TEAM&select=id,shortcut,title,category&order=shortcut.asc"); return (rows || []).map((row) => ({ shortcut: typeof row.shortcut === "string" ? row.shortcut : "", title: typeof row.title === "string" ? row.title : "", category: typeof row.category === "string" ? row.category : "General" })).filter((item) => item.shortcut); }

function HubMetric({ label, value, note, icon }: { label: string; value: number | string; note: string; icon: "automations" | "statusDelivered" | "statusPending" | "statusFailed" }) {
  return <article className="group rounded-2xl border border-rule bg-paper-raised p-4 transition hover:border-rule-strong"><div className="flex items-start justify-between gap-3"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[.12em] text-ink-faint">{label}</p><p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{value}</p><p className="mt-1 text-xs text-ink-faint">{note}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl border border-ledger-bright/15 bg-ledger-tint text-ledger-bright"><WhatsAppIcon name={icon} className="h-4 w-4" /></span></div></article>;
}

function HubRail({ section }: { section: "workflows" | "ai" }) {
  return <aside className="rounded-2xl border border-rule bg-paper-raised p-2 lg:sticky lg:top-24 lg:self-start">
    <p className="px-3 pb-2 pt-2 text-[0.62rem] font-semibold uppercase tracking-[.16em] text-ink-faint">Automation workspace</p>
    <nav className="space-y-1" aria-label="Automation sections">
      <Link href="/admin/whatsapp/automations/?section=workflows" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${section === "workflows" ? "bg-ledger-tint text-ledger-bright" : "text-ink-soft hover:bg-paper-sunk hover:text-ink"}`}><span className="grid h-8 w-8 place-items-center rounded-lg border border-rule bg-paper"><WhatsAppIcon name="automations" className="h-4 w-4" /></span><span><span className="block">Workflows</span><span className="mt-0.5 block text-[0.68rem] font-normal text-ink-faint">Rules, triggers and actions</span></span></Link>
      <Link href="/admin/whatsapp/automations/?section=ai" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${section === "ai" ? "bg-ledger-tint text-ledger-bright" : "text-ink-soft hover:bg-paper-sunk hover:text-ink"}`}><span className="grid h-8 w-8 place-items-center rounded-lg border border-rule bg-paper"><WhatsAppIcon name="quickReplies" className="h-4 w-4" /></span><span><span className="block">AI Agents</span><span className="mt-0.5 block text-[0.68rem] font-normal text-ink-faint">Objectives and handoff</span></span></Link>
    </nav>
    <div className="mt-3 border-t border-rule px-3 pb-2 pt-4"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Related tools</p><div className="mt-2 grid gap-1"><Link href="/admin/whatsapp/flows/" className="rounded-lg px-2 py-2 text-xs text-ink-soft hover:bg-paper-sunk hover:text-ink">WhatsApp Flows</Link><Link href="/admin/whatsapp/templates/" className="rounded-lg px-2 py-2 text-xs text-ink-soft hover:bg-paper-sunk hover:text-ink">Message templates</Link><Link href="/admin/whatsapp/analytics/" className="rounded-lg px-2 py-2 text-xs text-ink-soft hover:bg-paper-sunk hover:text-ink">Performance analytics</Link></div></div>
  </aside>;
}

export default async function WhatsAppAutomationsPage({ searchParams }: { searchParams?: Promise<{ section?: string }> }) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access || !canWhatsAppRoleSuperviseTeam(access.role)) return <div className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-800">Owner or Manager access is required to manage automations.</div></div>;
  const params = searchParams ? await searchParams : {};
  const section = params.section === "ai" ? "ai" : "workflows";

  return <div className="w-full p-3 sm:p-5 lg:p-6">
    <header className="mb-5 flex flex-col gap-4 border-b border-rule pb-5 xl:flex-row xl:items-end xl:justify-between">
      <div><div className="mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ledger-bright"><span className="h-1.5 w-1.5 rounded-full bg-ledger-bright" />Automation control centre</div><h1 className="text-2xl font-semibold text-ink sm:text-3xl">Automations</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-ink-faint">Build operational workflows and AI agents without leaving the WhatsApp app.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin/whatsapp/flows/" className="inline-flex items-center gap-2 rounded-xl border border-rule bg-paper-raised px-3.5 py-2.5 text-xs font-semibold text-ink-soft hover:border-rule-strong hover:text-ink"><WhatsAppIcon name="automations" className="h-4 w-4" />Open Flows</Link><Link href="/admin/whatsapp/analytics/" className="inline-flex items-center gap-2 rounded-xl border border-ledger-bright/25 bg-ledger-tint px-3.5 py-2.5 text-xs font-semibold text-ledger-bright"><WhatsAppIcon name="analytics" className="h-4 w-4" />View analytics</Link></div>
    </header>
    <div className="grid min-w-0 gap-4 lg:grid-cols-[15.5rem_minmax(0,1fr)] xl:gap-5">
      <HubRail section={section} />
      <main className="min-w-0">{section === "ai" ? <AIAutomationManager /> : <WorkflowSection role={access.role} />}</main>
    </div>
  </div>;
}

async function WorkflowSection({ role }: { role: WhatsAppTeamRole }) {
  const [automationResult, runs, jobs, team, savedReplies, templatesResult] = await Promise.all([getAutomations(), getRuns(), getJobs(), getTeam(), getSavedReplies(), fetchWhatsAppTemplates()]);
  const templates = templatesResult.ok ? templatesResult.templates.filter((template) => template.status === "APPROVED").map((template) => ({ name: template.name, language: template.language || "en_US" })) : [];
  const active = automationResult.automations.filter((automation) => automation.status === "ACTIVE").length;
  const paused = automationResult.automations.filter((automation) => automation.status === "PAUSED").length;
  const failedRuns = runs.filter((run) => run.status === "FAILED").length;
  return <div className="min-w-0 space-y-4">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <HubMetric label="All automations" value={automationResult.automations.length} note="Saved workflows" icon="automations" />
      <HubMetric label="Active" value={active} note="Currently eligible to run" icon="statusDelivered" />
      <HubMetric label="Paused" value={paused} note="Held from execution" icon="statusPending" />
      <HubMetric label="Recent failures" value={failedRuns} note={`${jobs.length} queued or waiting`} icon="statusFailed" />
    </section>
    <section className="min-w-0 overflow-hidden rounded-2xl border border-rule bg-paper-raised"><div className="border-b border-rule px-4 py-3 sm:px-5"><p className="text-sm font-semibold text-ink">Workflow library</p><p className="mt-0.5 text-xs text-ink-faint">Create, inspect and operate automation logic from the same app workspace.</p></div><div className="min-w-0 p-3 sm:p-4"><AutomationManager automations={automationResult.automations} storageReady={automationResult.ready} role={role} runs={runs} jobs={jobs} teamMembers={team.map((member) => ({ id: member.id, name: member.displayName, availability: member.availability }))} templates={templates} savedReplies={savedReplies} /></div></section>
  </div>;
}
