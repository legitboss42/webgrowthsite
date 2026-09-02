import type { Metadata } from "next";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { normalizeWhatsAppCampaignRow, normalizeWhatsAppSegmentRow } from "@/lib/whatsapp/campaignModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { fetchWhatsAppTemplates } from "@/lib/whatsapp/templates";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { probeWhatsAppTable, readWhatsAppRows } from "../data";
import CampaignManager from "../CampaignManager";

export const metadata: Metadata = {
  title: "WhatsApp Campaigns | Web Growth",
  robots: { index: false, follow: false },
};

const CAMPAIGN_SELECT = "id,name,description,status,segment_id,audience_snapshot,template_id,template_name,template_language,template_category,template_snapshot,variable_mappings,scheduled_at,started_at,completed_at,paused_at,cancelled_at,audience_count,eligible_count,sent_count,delivered_count,read_count,replied_count,failed_count,skipped_count,created_at,updated_at";

export default async function WhatsAppCampaignsPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <GoogleAdminPrompt
            nextPath="/admin/whatsapp/campaigns/"
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
  if (!canManage) {
    return <div className="px-6 py-12 text-sm text-ink-faint">Campaigns are available to Owners and Managers.</div>;
  }

  const [campaignProbe, segmentProbe, campaignRows, segmentRows, liveTemplates] = await Promise.all([
    probeWhatsAppTable("whatsapp_campaigns"),
    probeWhatsAppTable("whatsapp_segments"),
    readWhatsAppRows<Record<string, unknown>>(`whatsapp_campaigns?select=${CAMPAIGN_SELECT}&order=created_at.desc&limit=500`),
    readWhatsAppRows<Record<string, unknown>>("whatsapp_segments?select=id,name,description,condition_join,conditions,created_at,updated_at&order=updated_at.desc&limit=500"),
    fetchWhatsAppTemplates(),
  ]);

  return (
    <CampaignManager
      initialCampaigns={(campaignRows || []).map(normalizeWhatsAppCampaignRow)}
      initialSegments={(segmentRows || []).map(normalizeWhatsAppSegmentRow)}
      approvedTemplates={liveTemplates.ok ? liveTemplates.templates.filter((template) => template.status === "APPROVED") : []}
      storageReady={campaignProbe === "ok" && segmentProbe === "ok"}
      templateError={liveTemplates.ok ? undefined : "Meta template status could not be loaded. Campaign launches stay blocked until approved templates are available."}
    />
  );
}
