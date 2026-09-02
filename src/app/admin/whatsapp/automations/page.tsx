import type { Metadata } from "next";
import { cookies } from "next/headers";
import { canWhatsAppRoleSuperviseTeam, normalizeWhatsAppTeamMember } from "@/lib/whatsapp/teamModel";
import {
  normalizeWhatsAppAutomationJobRow,
  normalizeWhatsAppAutomationRow,
  normalizeWhatsAppAutomationRunRow,
  type WhatsAppAutomation,
  type WhatsAppAutomationJob,
  type WhatsAppAutomationRun,
} from "@/lib/whatsapp/automationModel";
import { fetchWhatsAppTemplates } from "@/lib/whatsapp/templates";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import AutomationManager from "../AutomationManager";

export const metadata: Metadata = {
  title: "WhatsApp Automations | Web Growth",
  robots: { index: false, follow: false },
};

const AUTOMATION_SELECT = "id,name,description,status,trigger_type,trigger_config,condition_join,conditions,actions,version,created_by_member_id,updated_by_member_id,activated_at,paused_at,created_at,updated_at";

async function getAutomations(): Promise<{ automations: WhatsAppAutomation[]; ready: boolean }> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_automations?select=${AUTOMATION_SELECT}&order=updated_at.desc`,
  );
  if (rows === null) return { automations: [], ready: false };
  return { automations: rows.map(normalizeWhatsAppAutomationRow), ready: true };
}

async function getRuns(): Promise<WhatsAppAutomationRun[]> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_automation_runs?select=id,automation_id,automation_version,status,trigger_type,trigger_event_key,contact_id,conversation_id,next_action_index,started_at,completed_at,error_code,error_message,created_at,updated_at&order=created_at.desc&limit=100",
  );
  return (rows || []).map(normalizeWhatsAppAutomationRunRow);
}

async function getJobs(): Promise<WhatsAppAutomationJob[]> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_automation_jobs?status=in.(PENDING,PROCESSING)&select=id,run_id,automation_id,status,due_at,action_index,attempts,max_attempts,last_error,created_at&order=due_at.asc&limit=100",
  );
  return (rows || []).map(normalizeWhatsAppAutomationJobRow);
}

async function getTeam() {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_team_members?active=eq.true&select=id,google_email,display_name,role,availability,active,google_user_id,last_seen_at,created_at,updated_at&order=display_name.asc",
  );
  return (rows || []).map(normalizeWhatsAppTeamMember);
}

async function getSavedReplies() {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_quick_replies?scope=eq.TEAM&select=id,shortcut,title,category&order=shortcut.asc",
  );
  return (rows || []).map((row) => ({
    shortcut: typeof row.shortcut === "string" ? row.shortcut : "",
    title: typeof row.title === "string" ? row.title : "",
    category: typeof row.category === "string" ? row.category : "General",
  })).filter((item) => item.shortcut);
}

export default async function WhatsAppAutomationsPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access || !canWhatsAppRoleSuperviseTeam(access.role)) {
    return (
      <div className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-800">
          Owner or Manager access is required to manage automations.
        </div>
      </div>
    );
  }

  const [automationResult, runs, jobs, team, savedReplies, templatesResult] = await Promise.all([
    getAutomations(),
    getRuns(),
    getJobs(),
    getTeam(),
    getSavedReplies(),
    fetchWhatsAppTemplates(),
  ]);
  const templates = templatesResult.ok
    ? templatesResult.templates.filter((template) => template.status === "APPROVED").map((template) => ({ name: template.name, language: template.language || "en_US" }))
    : [];

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-5">
      <AutomationManager
        automations={automationResult.automations}
        storageReady={automationResult.ready}
        role={access.role}
        runs={runs}
        jobs={jobs}
        teamMembers={team.map((member) => ({ id: member.id, name: member.displayName, availability: member.availability }))}
        templates={templates}
        savedReplies={savedReplies}
      />
    </div>
  );
}
