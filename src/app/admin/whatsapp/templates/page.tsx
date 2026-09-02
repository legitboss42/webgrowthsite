import type { Metadata } from "next";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { fetchWhatsAppTemplates, type WhatsAppTemplate } from "@/lib/whatsapp/templates";
import { normalizeWhatsAppTemplateDraftRow, type WhatsAppTemplateDraft } from "@/lib/whatsapp/templateModel";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import TemplateManager from "../TemplateManager";

export const metadata: Metadata = {
  title: "WhatsApp Template Manager | Web Growth",
  robots: { index: false, follow: false },
};

const DRAFT_SELECT = "id,name,language,category,header_text,body_text,footer_text,buttons,variable_examples,meta_template_id,submitted_at,created_by_member_id,updated_by_member_id,created_at,updated_at";

async function getDrafts(): Promise<{ drafts: WhatsAppTemplateDraft[]; ready: boolean }> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_template_drafts?select=${DRAFT_SELECT}&order=updated_at.desc`);
  if (rows === null) return { drafts: [], ready: false };
  return { drafts: rows.map(normalizeWhatsAppTemplateDraftRow), ready: true };
}

function liveErrorCopy(reason: "NOT_CONFIGURED" | "PERMISSION_DENIED" | "API_ERROR") {
  if (reason === "NOT_CONFIGURED") return "Meta template access is not configured on this deployment.";
  if (reason === "PERMISSION_DENIED") return "Meta refused template access. Check the current access token and WhatsApp business-management permissions.";
  return "Meta did not return the live template list. Refresh after checking the server log if this persists.";
}

export default async function WhatsAppTemplatesPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <GoogleAdminPrompt
            nextPath="/admin/whatsapp/templates/"
            adminEmail={getDefaultAdminGoogleEmail()}
            clientId={getGoogleClientId()}
            googleReady={isGoogleAuthConfigured()}
            workspaceTeamAccess
          />
        </div>
      </div>
    );
  }

  const canManage = canWhatsAppRoleSuperviseTeam(access.role);
  const [live, local] = await Promise.all([
    fetchWhatsAppTemplates(),
    canManage ? getDrafts() : Promise.resolve({ drafts: [] as WhatsAppTemplateDraft[], ready: true }),
  ]);
  const liveTemplates: WhatsAppTemplate[] = live.ok ? live.templates : [];

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <TemplateManager
        liveTemplates={liveTemplates}
        drafts={local.drafts}
        draftsReady={local.ready}
        canManage={canManage}
        role={access.role}
        liveError={live.ok ? undefined : liveErrorCopy(live.reason)}
      />
    </div>
  );
}
