import { DashboardHeading, MetricCard } from "@/components/dashboard/DashboardShell";
import { requireWebGrowthDashboardSession } from "@/lib/dashboardSession";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { canonicalContentAutomationAccess } from "@/lib/unifiedAuthorization";

function assetCard(asset: Record<string, unknown>, source: string) {
  return <article key={`${source}-${String(asset.id)}`} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-medium">{String(asset.original_filename || asset.storage_path || "Media asset")}</h2><p className="mt-1 text-xs text-white/40">{source}</p></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">{String(asset.kind || asset.profile || "MEDIA")}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-white/35">Type</dt><dd className="mt-1 text-white/65">{String(asset.mime_type || "Unknown")}</dd></div><div><dt className="text-white/35">Size</dt><dd className="mt-1 text-white/65">{asset.byte_size ? `${Math.max(1, Math.round(Number(asset.byte_size) / 1024))} KB` : "—"}</dd></div></dl></article>;
}

export default async function DashboardMediaPage() {
  const { session } = await requireWebGrowthDashboardSession();
  const db = createSchedulerSupabaseClient();
  let schedulerAssets: Record<string, unknown>[] = [];
  let automationAssets: Record<string, unknown>[] = [];
  try {
    if (session.schedulerUserId) {
      const read = await db.from("media_assets").select("id,kind,storage_path,original_filename,mime_type,byte_size,validation_status,created_at").eq("user_id", session.schedulerUserId).order("created_at", { ascending: false }).limit(40);
      if (!read.error) schedulerAssets = (read.data || []) as Record<string, unknown>[];
    }
    if (canonicalContentAutomationAccess(session)) {
      const read = await db.from("social_media_assets").select("id,profile,storage_path,original_filename,mime_type,byte_size,created_at").order("created_at", { ascending: false }).limit(40);
      if (!read.error) automationAssets = (read.data || []) as Record<string, unknown>[];
    }
  } catch {}
  return <main><DashboardHeading eyebrow="Shared Media Library" title="Media across automation engines" description="Scheduler uploads and Content Automation renders stay in their own storage models but are visible from one library." /><section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><MetricCard label="TikTok assets" value={schedulerAssets.length} /><MetricCard label="Generated assets" value={automationAssets.length} /><MetricCard label="Visible total" value={schedulerAssets.length + automationAssets.length} /></section><section className="mt-8"><h2 className="mb-4 font-semibold">Recent media</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[...schedulerAssets.map((a) => assetCard(a, "TikTok Publishing")), ...automationAssets.map((a) => assetCard(a, "Content Automation"))]}</div>{schedulerAssets.length + automationAssets.length === 0 ? <p className="rounded-2xl border border-white/10 p-6 text-sm text-white/45">No media assets are visible for this account yet.</p> : null}</section></main>;
}
