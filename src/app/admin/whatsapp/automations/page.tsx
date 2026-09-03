import type { Metadata } from "next";
import { cookies } from "next/headers";
import { WorkspaceActionLink, WorkspaceRail, WorkspaceStat, WorkspaceSurface, WorkspaceToolbar } from "@/components/whatsapp/WorkspaceChrome";
import { canWhatsAppRoleSuperviseTeam, normalizeWhatsAppTeamMember, type WhatsAppTeamRole } from "@/lib/whatsapp/teamModel";
import { normalizeWhatsAppAutomationJobRow, normalizeWhatsAppAutomationRow, normalizeWhatsAppAutomationRunRow, type WhatsAppAutomation, type WhatsAppAutomationJob, type WhatsAppAutomationRun } from "@/lib/whatsapp/automationModel";
import { fetchWhatsAppTemplates } from "@/lib/whatsapp/templates";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import AutomationManager from "../AutomationManager";
import AIAutomationManager from "../AIAutomationManager";

export const metadata: Metadata = { title: "WhatsApp Automations | Web Growth", robots: { index: false, follow: false } };
const AUTOMATION_SELECT = "id,name,description,status,trigger_type,trigger_config,condition_join,conditions,actions,version,created_by_member_id,updated_by_member_id,activated_at,paused_at,created_at,updated_at";

async function getAutomations(): Promise<{ automations: WhatsAppAutomation[]; ready: boolean }> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_automations?select=${AUTOMATION_SELECT}&order=updated_at.desc`);
  return rows === null ? { automations: [], ready: false } : { automations: rows.map(normalizeWhatsAppAutomationRow), ready: true };
}
async function getRuns(): Promise<WhatsAppAutomationRun[]> {
  const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_automation_runs?select=id,automation_id,automation_version,status,trigger_type,trigger_event_key,contact_id,conversation_id,next_action_index,started_at,completed_at,error_code,error_message,created_at,updated_at&order=created_at.desc&limit=100");
  return (rows || []).map(normalizeWhatsAppAutomationRunRow);
}
async function getJobs(): Promise<WhatsAppAutomationJob[]> {
  const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_automation_jobs?status=in.(PENDING,PROCESSING,WAITING_INPUT)&select=id,run_id,automation_id,status,due_at,action_index,attempts,max_attempts,last_error,created_at&order=created_at.desc&limit=100");
  return (rows || []).map(normalizeWhatsAppAutomationJobRow);
}
async function getTeam() {
  const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_team_members?active=eq.true&select=id,google_email,display_name,role,availability,active,google_user_id,last_seen_at,created_at,updated_at&order=display_name.asc");
  return (rows || []).map(normalizeWhatsAppTeamMember);
}
async function getSavedReplies() {
  const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_quick_replies?scope=eq.TEAM&select=id,shortcut,title,category&order=shortcut.asc");
  return (rows || []).map((row) => ({ shortcut: typeof row.shortcut === "string" ? row.shortcut : "", title: typeof row.title === "string" ? row.title : "", category: typeof row.category === "string" ? row.category : "General" })).filter((item) => item.shortcut);
}

export default async function WhatsAppAutomationsPage({ searchParams }: { searchParams?: Promise<{ section?: string }> }) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access || !canWhatsAppRoleSuperviseTeam(access.role)) {
    return <div className="p-6"><div className="mx-auto max-w-xl rounded-xl border border-rose-900/40 bg-rose-950/30 px-5 py-6 text-sm text-rose-200">Owner or Manager access is required to manage automations.</div></div>;
  }
  const params = searchParams ? await searchParams : {};
  const section = params.section === "ai" ? "ai" : "workflows";

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <WorkspaceToolbar
        eyebrow="Operations"
        title={section === "ai" ? "AI Agents" : "Automations"}
        description={section === "ai" ? "Configure autonomous assistance, objectives, knowledge and human handoff." : "Build event-driven customer journeys with triggers, conditions, actions and run history."}
        actions={
          <>
            <WorkspaceActionLink href="/admin/whatsapp/flows/" icon="templates">Flows</WorkspaceActionLink>
            <WorkspaceActionLink href="/admin/whatsapp/analytics/" icon="analytics" primary>Analytics</WorkspaceActionLink>
          </>
        }
      />
      <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <WorkspaceRail
          label="Automation workspace"
          items={[
            { label: "Workflows", href: "/admin/whatsapp/automations/?section=workflows", icon: "automations", note: "Rules, triggers and actions", active: section === "workflows" },
            { label: "AI Agents", href: "/admin/whatsapp/automations/?section=ai", icon: "quickReplies", note: "Objectives and handoff", active: section === "ai" },
            { label: "WhatsApp Flows", href: "/admin/whatsapp/flows/", icon: "templates", note: "Interactive journeys" },
            { label: "Templates", href: "/admin/whatsapp/templates/", icon: "templates", note: "Approved messages" },
          ]}
        />
        <main className="min-h-0 min-w-0 bg-[#060a0e] p-3 sm:p-4">
          {section === "ai" ? <WorkspaceSurface className="min-h-[70vh]"><AIAutomationManager /></WorkspaceSurface> : <WorkflowSection role={access.role} />}
        </main>
      </div>
    </div>
  );
}

async function WorkflowSection({ role }: { role: WhatsAppTeamRole }) {
  const [automationResult, runs, jobs, team, savedReplies, templatesResult] = await Promise.all([getAutomations(), getRuns(), getJobs(), getTeam(), getSavedReplies(), fetchWhatsAppTemplates()]);
  const templates = templatesResult.ok ? templatesResult.templates.filter((template) => template.status === "APPROVED").map((template) => ({ name: template.name, language: template.language || "en_US" })) : [];
  const active = automationResult.automations.filter((automation) => automation.status === "ACTIVE").length;
  const paused = automationResult.automations.filter((automation) => automation.status === "PAUSED").length;
  const failedRuns = runs.filter((run) => run.status === "FAILED").length;

  return (
    <div className="min-w-0 space-y-3">
      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <WorkspaceStat label="Workflows" value={automationResult.automations.length} note="Saved" icon="automations" />
        <WorkspaceStat label="Active" value={active} note="Eligible to run" icon="statusDelivered" tone="good" />
        <WorkspaceStat label="Paused" value={paused} note="Held" icon="statusPending" tone="warn" />
        <WorkspaceStat label="Failures" value={failedRuns} note={`${jobs.length} queued / waiting`} icon="statusFailed" tone={failedRuns ? "bad" : "default"} />
      </section>
      <WorkspaceSurface className="min-h-[68vh]">
        <div className="border-b border-rule px-3 py-2.5 sm:px-4">
          <p className="text-xs font-semibold text-ink">Workflow library & builder</p>
          <p className="mt-0.5 text-[0.68rem] text-ink-faint">The existing automation engine remains connected behind this rebuilt workspace.</p>
        </div>
        <div className="min-w-0 p-2 sm:p-3">
          <AutomationManager
            automations={automationResult.automations}
            storageReady={automationResult.ready}
            role={role}
            runs={runs}
            jobs={jobs}
            teamMembers={team.map((member) => ({ id: member.id, name: member.displayName, availability: member.availability }))}
            templates={templates}
            savedReplies={savedReplies}
          />
        </div>
      </WorkspaceSurface>
    </div>
  );
}
