import { DashboardHeading, MetricCard, ModuleCard } from "@/components/dashboard/DashboardShell";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { requireWebGrowthDashboardSession } from "@/lib/dashboardSession";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";
import { canonicalContentAutomationAccess } from "@/lib/unifiedAuthorization";

export default async function DashboardOverviewPage() {
  const { cookieStore: jar, session } = await requireWebGrowthDashboardSession();
  const contentAllowed = canonicalContentAutomationAccess(session);
  let tiktokTotal: number | null = null;
  let tiktokAttention: number | null = null;
  let automationTotal: number | null = null;
  let whatsappWorkspace: string | null = null;

  try {
    const db = createSchedulerSupabaseClient();
    if (session.schedulerUserId) {
      const [all, attention] = await Promise.all([
        db.from("scheduled_posts").select("id", { count: "exact", head: true }).eq("user_id", session.schedulerUserId),
        db.from("scheduled_posts").select("id", { count: "exact", head: true }).eq("user_id", session.schedulerUserId).in("status", ["FAILED_RETRYABLE", "NEEDS_ATTENTION", "NEEDS_CONNECTION"]),
      ]);
      tiktokTotal = all.count ?? 0;
      tiktokAttention = attention.count ?? 0;
    }
    if (contentAllowed) automationTotal = (await createSocialAutomationStore().listRecentJobs(100)).length;
  } catch {
    tiktokTotal = tiktokTotal ?? null;
  }

  try {
    const access = await getWhatsAppWorkspaceAccess(jar);
    whatsappWorkspace = access?.workspaceName || null;
  } catch {}

  return <main>
    <DashboardHeading eyebrow="Overview" title="One place to run Web Growth automation" description="Content creation, TikTok publishing and WhatsApp operations share one account and control plane while their execution engines stay independently maintainable." />
    <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Automation summary">
      <MetricCard label="TikTok posts" value={tiktokTotal ?? "—"} hint={session.schedulerUserId ? "All publishing queue records" : "Connect TikTok to activate"} />
      <MetricCard label="Needs attention" value={tiktokAttention ?? "—"} hint="TikTok failures or connection issues" />
      <MetricCard label="Content jobs" value={contentAllowed ? (automationTotal ?? "—") : "Restricted"} hint="Blog-to-social automation history" />
      <MetricCard label="WhatsApp workspace" value={whatsappWorkspace || "Not linked"} hint="Current accessible workspace" />
    </section>
    <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Automation modules">
      <ModuleCard href="/dashboard/content/" title="Content Automation" description="Track published articles, generated social media, Meta delivery and TikTok handoff." status={contentAllowed ? "Available" : "Restricted"} />
      <ModuleCard href="/dashboard/tiktok/" title="TikTok Publishing" description="Create posts, approve generated content, schedule publishing and resolve failures." status={session.schedulerUserId ? "Linked" : "Not linked"} />
      <ModuleCard href="/dashboard/whatsapp/" title="WhatsApp Business" description="Enter the existing WhatsApp operations workspace without another login." status={whatsappWorkspace ? "Linked" : "Unavailable"} />
      <ModuleCard href="/dashboard/media/" title="Media Library" description="View scheduler uploads and generated automation assets from one shared surface." />
      <ModuleCard href="/dashboard/connections/" title="Connections" description="Manage TikTok, Facebook, Instagram and WhatsApp connection state." />
      <ModuleCard href="/dashboard/settings/" title="Settings" description="Review account identity and module-specific controls without losing the unified session." />
    </section>
  </main>;
}
