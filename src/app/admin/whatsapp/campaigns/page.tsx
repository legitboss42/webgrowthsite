import type { Metadata } from "next";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { WorkspaceActionLink, WorkspaceRail, WorkspaceStat, WorkspaceSurface, WorkspaceToolbar } from "@/components/whatsapp/WorkspaceChrome";
import { normalizeWhatsAppCampaignRow, normalizeWhatsAppSegmentRow } from "@/lib/whatsapp/campaignModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { fetchWhatsAppTemplates } from "@/lib/whatsapp/templates";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { probeWhatsAppTable, readWhatsAppRows } from "../data";
import CampaignManager from "../CampaignManager";

export const metadata: Metadata = { title: "WhatsApp Campaigns | Web Growth", robots: { index: false, follow: false } };
const CAMPAIGN_SELECT = "id,name,description,status,segment_id,audience_snapshot,template_id,template_name,template_language,template_category,template_snapshot,variable_mappings,scheduled_at,started_at,completed_at,paused_at,cancelled_at,audience_count,eligible_count,sent_count,delivered_count,read_count,replied_count,failed_count,skipped_count,created_at,updated_at";

export default async function WhatsAppCampaignsPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white"><div className="w-full max-w-4xl"><GoogleAdminPrompt nextPath="/admin/whatsapp/campaigns/" adminEmail={getDefaultAdminGoogleEmail()} clientId={getGoogleClientId()} googleReady={isGoogleAuthConfigured()} workspaceTeamAccess /></div></div>;
  if (!canWhatsAppRoleSuperviseTeam(access.role)) return <div className="p-6 text-sm text-ink-faint">Campaigns are available to Owners and Managers.</div>;

  const [campaignProbe, segmentProbe, campaignRows, segmentRows, liveTemplates] = await Promise.all([
    probeWhatsAppTable("whatsapp_campaigns"),
    probeWhatsAppTable("whatsapp_segments"),
    readWhatsAppRows<Record<string, unknown>>(`whatsapp_campaigns?select=${CAMPAIGN_SELECT}&order=created_at.desc&limit=500`),
    readWhatsAppRows<Record<string, unknown>>("whatsapp_segments?select=id,name,description,condition_join,conditions,created_at,updated_at&order=updated_at.desc&limit=500"),
    fetchWhatsAppTemplates(),
  ]);
  const campaigns = (campaignRows || []).map(normalizeWhatsAppCampaignRow);
  const segments = (segmentRows || []).map(normalizeWhatsAppSegmentRow);
  const active = campaigns.filter((campaign) => campaign.status === "RUNNING" || campaign.status === "SCHEDULED").length;
  const completed = campaigns.filter((campaign) => campaign.status === "COMPLETED").length;
  const failed = campaigns.reduce((sum, campaign) => sum + (campaign.failedCount || 0), 0);

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <WorkspaceToolbar
        eyebrow="Broadcasts"
        title="Campaigns"
        description="Build opt-in broadcasts, schedule delivery and track results from one operational workspace."
        actions={
          <>
            <WorkspaceActionLink href="/admin/whatsapp/templates/" icon="templates">Templates</WorkspaceActionLink>
            <WorkspaceActionLink href="/admin/whatsapp/analytics/" icon="analytics" primary>Analytics</WorkspaceActionLink>
          </>
        }
      />
      <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[13.5rem_minmax(0,1fr)] 2xl:grid-cols-[13.5rem_minmax(0,1fr)_17rem]">
        <WorkspaceRail
          label="Broadcast workspace"
          items={[
            { label: "Campaigns", href: "/admin/whatsapp/campaigns/", icon: "campaigns", note: `${campaigns.length} total`, active: true },
            { label: "Templates", href: "/admin/whatsapp/templates/", icon: "templates", note: "Approved messages" },
            { label: "Contacts", href: "/admin/whatsapp/contacts/", icon: "contacts", note: `${segments.length} saved audiences` },
            { label: "Analytics", href: "/admin/whatsapp/analytics/", icon: "analytics", note: "Delivery performance" },
          ]}
        />
        <main className="min-h-0 min-w-0 bg-[#060a0e] p-3 sm:p-4 2xl:border-r 2xl:border-rule">
          <section className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <WorkspaceStat label="Campaigns" value={campaigns.length} note="Total" icon="campaigns" />
            <WorkspaceStat label="Active" value={active} note="Running / scheduled" icon="statusPending" tone="good" />
            <WorkspaceStat label="Completed" value={completed} note="Finished" icon="statusDelivered" />
            <WorkspaceStat label="Failed sends" value={failed} note="Across campaigns" icon="statusFailed" tone={failed ? "bad" : "default"} />
          </section>
          <WorkspaceSurface className="min-h-[68vh]">
            <CampaignManager
              initialCampaigns={campaigns}
              initialSegments={segments}
              approvedTemplates={liveTemplates.ok ? liveTemplates.templates.filter((template) => template.status === "APPROVED") : []}
              storageReady={campaignProbe === "ok" && segmentProbe === "ok"}
              templateError={liveTemplates.ok ? undefined : "Meta template status could not be loaded. Campaign launches stay blocked until approved templates are available."}
            />
          </WorkspaceSurface>
        </main>
        <aside className="wg-inspector-rail hidden min-h-0 overflow-y-auto p-4 2xl:block">
          <p className="text-xs font-semibold text-ink">Broadcast guardrails</p>
          <div className="mt-4 space-y-3 text-[0.7rem] leading-5 text-ink-faint">
            <div className="rounded-lg border border-rule bg-paper-sunk p-3"><p className="font-semibold text-ink">Approved templates only</p><p className="mt-1">Campaign sending remains tied to Meta-approved templates and the existing eligibility checks.</p></div>
            <div className="rounded-lg border border-rule bg-paper-sunk p-3"><p className="font-semibold text-ink">Audience storage</p><p className="mt-1">{campaignProbe === "ok" && segmentProbe === "ok" ? "Campaign and segment storage are ready." : "Campaign storage needs attention before launch."}</p></div>
            <div className="rounded-lg border border-rule bg-paper-sunk p-3"><p className="font-semibold text-ink">Current activity</p><p className="mt-1">{active} campaign{active === 1 ? " is" : "s are"} running or scheduled.</p></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
