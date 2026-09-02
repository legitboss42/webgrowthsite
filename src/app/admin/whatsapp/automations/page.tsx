import type { Metadata } from "next";
import { cookies } from "next/headers";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { normalizeWhatsAppAutomationRow, type WhatsAppAutomation } from "@/lib/whatsapp/automationModel";
import AutomationManager from "../AutomationManager";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { readWhatsAppRows } from "../data";

export const metadata: Metadata = {
  title: "WhatsApp Automations | Web Growth",
  robots: { index: false, follow: false },
};

const SELECT = "id,name,description,status,trigger_type,trigger_config,condition_join,conditions,actions,version,created_by_member_id,updated_by_member_id,activated_at,paused_at,created_at,updated_at";

async function getAutomations(): Promise<{ automations: WhatsAppAutomation[]; ready: boolean }> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_automations?select=${SELECT}&order=updated_at.desc`,
  );
  if (rows === null) return { automations: [], ready: false };
  return { automations: rows.map(normalizeWhatsAppAutomationRow), ready: true };
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

  const result = await getAutomations();
  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <AutomationManager automations={result.automations} storageReady={result.ready} role={access.role} />
    </div>
  );
}
