import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import { normalizeWhatsAppCampaignRow, normalizeWhatsAppSegmentRow } from "@/lib/whatsapp/campaignModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { fetchWhatsAppTemplates } from "@/lib/whatsapp/templates";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { probeWhatsAppTable, readWhatsAppRows } from "../data";
import CampaignManager from "../CampaignManager";

export const metadata: Metadata = { title: "WhatsApp Campaigns | Web Growth", robots: { index: false, follow: false } };

const CAMPAIGN_SELECT = "id,name,description,status,segment_id,audience_snapshot,template_id,template_name,template_language,template_category,template_snapshot,variable_mappings,scheduled_at,started_at,completed_at,paused_at,cancelled_at,audience_count,eligible_count,sent_count,delivered_count,read_count,replied_count,failed_count,skipped_count,created_at,updated_at";

function CampaignRail({ campaigns, segments }: { campaigns: Array<ReturnType<typeof normalizeWhatsAppCampaignRow>>; segments: Array<ReturnType<typeof normalizeWhatsAppSegmentRow>> }) {
  const running = campaigns.filter((campaign) => campaign.status === "RUNNING" || campaign.status === "SCHEDULED").length;
  const completed = campaigns.filter((campaign) => campaign.status === "COMPLETED").length;
  return <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
    <section className="rounded-2xl border border-rule bg-paper-raised p-3"><p className="px-2 pb-2 text-[0.62rem] font-semibold uppercase tracking-[.16em] text-ink-faint">Broadcast workspace</p><nav className="grid gap-1 text-sm"><Link href="/admin/whatsapp/campaigns/" className="flex items-center gap-3 rounded-xl bg-ledger-tint px-3 py-3 font-semibold text-ledger-bright"><WhatsAppIcon name="campaigns" className="h-4 w-4" />Campaigns</Link><Link href="/admin/whatsapp/templates/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-ink-soft hover:bg-paper-sunk hover:text-ink"><WhatsAppIcon name="templates" className="h-4 w-4" />Templates</Link><Link href="/admin/whatsapp/analytics/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-ink-soft hover:bg-paper-sunk hover:text-ink"><WhatsAppIcon name="analytics" className="h-4 w-4" />Analytics</Link></nav></section>
    <section className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Broadcast snapshot</p><dl className="mt-3 space-y-3">{[["Total campaigns", campaigns.length], ["Running / scheduled", running], ["Completed", completed], ["Saved audiences", segments.length]].map(([label, value]) => <div key={String(label)} className="flex items-center justify-between gap-3"><dt className="text-xs text-ink-faint">{label}</dt><dd className="text-sm font-semibold tabular-nums text-ink">{value}</dd></div>)}</dl></section>
  </aside>;
}

export default async function WhatsAppCampaignsPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white"><div className="w-full max-w-4xl"><GoogleAdminPrompt nextPath="/admin/whatsapp/campaigns/" adminEmail={getDefaultAdminGoogleEmail()} clientId={getGoogleClientId()} googleReady={isGoogleAuthConfigured()} workspaceTeamAccess /></div></div>;
  if (!canWhatsAppRoleSuperviseTeam(access.role)) return <div className="px-6 py-12 text-sm text-ink-faint">Campaigns are available to Owners and Managers.</div>;

  const [campaignProbe, segmentProbe, campaignRows, segmentRows, liveTemplates] = await Promise.all([
    probeWhatsAppTable("whatsapp_campaigns"), probeWhatsAppTable("whatsapp_segments"),
    readWhatsAppRows<Record<string, unknown>>(`whatsapp_campaigns?select=${CAMPAIGN_SELECT}&order=created_at.desc&limit=500`),
    readWhatsAppRows<Record<string, unknown>>("whatsapp_segments?select=id,name,description,condition_join,conditions,created_at,updated_at&order=updated_at.desc&limit=500"), fetchWhatsAppTemplates(),
  ]);
  const campaigns = (campaignRows || []).map(normalizeWhatsAppCampaignRow);
  const segments = (segmentRows || []).map(normalizeWhatsAppSegmentRow);

  return <div className="w-full p-3 sm:p-5 lg:p-6">
    <header className="mb-5 flex flex-col gap-4 border-b border-rule pb-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ledger-bright"><span className="h-1.5 w-1.5 rounded-full bg-ledger-bright" />Outbound messaging</div><h1 className="text-2xl font-semibold text-ink sm:text-3xl">Campaigns</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-ink-faint">Plan broadcasts, manage consented audiences and inspect delivery performance without leaving the app.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/whatsapp/templates/" className="inline-flex items-center gap-2 rounded-xl border border-rule bg-paper-raised px-3.5 py-2.5 text-xs font-semibold text-ink-soft hover:border-rule-strong hover:text-ink"><WhatsAppIcon name="templates" className="h-4 w-4" />Templates</Link><Link href="/admin/whatsapp/analytics/" className="inline-flex items-center gap-2 rounded-xl border border-ledger-bright/25 bg-ledger-tint px-3.5 py-2.5 text-xs font-semibold text-ledger-bright"><WhatsAppIcon name="analytics" className="h-4 w-4" />Analytics</Link></div></header>
    <div className="grid min-w-0 gap-4 lg:grid-cols-[15.5rem_minmax(0,1fr)] xl:gap-5"><CampaignRail campaigns={campaigns} segments={segments} /><main className="min-w-0 overflow-hidden rounded-2xl border border-rule bg-paper-raised"><CampaignManager initialCampaigns={campaigns} initialSegments={segments} approvedTemplates={liveTemplates.ok ? liveTemplates.templates.filter((template) => template.status === "APPROVED") : []} storageReady={campaignProbe === "ok" && segmentProbe === "ok"} templateError={liveTemplates.ok ? undefined : "Meta template status could not be loaded. Campaign launches stay blocked until approved templates are available."} /></main></div>
  </div>;
}
