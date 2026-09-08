import Link from "next/link";
import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { requireWebGrowthDashboardSession } from "@/lib/dashboardSession";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";
import { canonicalContentAutomationAccess } from "@/lib/unifiedAuthorization";

function ConnectionCard({ name, state, detail, children }: { name: string; state: string; detail: string; children?: React.ReactNode }) {
  return <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-start justify-between gap-3"><h2 className="font-semibold">{name}</h2><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{state}</span></div><p className="mt-3 text-sm leading-6 text-white/50">{detail}</p>{children ? <div className="mt-5">{children}</div> : null}</article>;
}

export default async function DashboardConnectionsPage() {
  const { cookieStore: jar, session } = await requireWebGrowthDashboardSession();
  let tiktok: Record<string, unknown> | null = null;
  let meta: Awaited<ReturnType<ReturnType<typeof createSocialAutomationStore>["getConnectionSummary"]>> = null;
  let whatsapp: Awaited<ReturnType<typeof getWhatsAppWorkspaceAccess>> = null;
  let whatsappChannel: Record<string, unknown> | null = null;
  try {
    const db = createSchedulerSupabaseClient();
    if (session.schedulerUserId) {
      const read = await db.from("tiktok_connections").select("scopes,access_expires_at,reconnect_required,connected_at").eq("user_id", session.schedulerUserId).maybeSingle();
      if (!read.error) tiktok = read.data;
    }
    if (canonicalContentAutomationAccess(session)) meta = await createSocialAutomationStore().getConnectionSummary("META");
    whatsapp = await getWhatsAppWorkspaceAccess(jar);
    if (whatsapp) {
      const read = await db.from("whatsapp_workspace_connections").select("status,business_name,display_phone_number,last_verified_at").eq("workspace_id", whatsapp.workspaceId).maybeSingle();
      if (!read.error) whatsappChannel = read.data;
    }
  } catch {}
  const whatsappWorkspaceName = whatsapp?.workspaceName || "WhatsApp workspace";
  return <main><DashboardHeading eyebrow="Connections" title="Publishing and messaging connections" description="Provider credentials remain inside their existing engines. This page gives the account one place to understand connection health and reconnect when necessary." /><section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><ConnectionCard name="TikTok" state={tiktok ? (tiktok.reconnect_required ? "Reconnect" : "Connected") : "Not connected"} detail={tiktok ? `Scopes: ${Array.isArray(tiktok.scopes) ? tiktok.scopes.join(", ") : "unknown"}` : "Connect TikTok to create, approve and schedule posts from the unified account."}><Link href="/api/scheduler/auth/authorize/?mode=publishing&returnTo=/dashboard/connections/" className="text-sm font-semibold text-emerald-300">{tiktok ? "Refresh TikTok access" : "Connect TikTok"} →</Link></ConnectionCard><ConnectionCard name="Facebook + Instagram" state={meta ? (meta.reconnectRequired ? "Reconnect" : "Connected") : "Not connected"} detail={meta ? `${meta.facebookPageName || "Facebook Page"}${meta.instagramAccountName ? ` · ${meta.instagramAccountName}` : ""}` : "Meta connection powers automatic Facebook and Instagram publication from Content Automation."}><Link href="/admin/content-automation/" className="text-sm font-semibold text-emerald-300">Manage Meta connection →</Link></ConnectionCard><ConnectionCard name="WhatsApp" state={whatsappChannel ? String(whatsappChannel.status || "Configured") : whatsapp ? "Workspace linked" : "Unavailable"} detail={whatsappChannel ? `${String(whatsappChannel.business_name || whatsappWorkspaceName)}${whatsappChannel.display_phone_number ? ` · ${String(whatsappChannel.display_phone_number)}` : ""}` : whatsapp ? whatsapp.workspaceName : "This identity does not resolve to an active WhatsApp workspace."}>{whatsapp ? <Link href="/admin/whatsapp/settings/" className="text-sm font-semibold text-emerald-300">Manage WhatsApp connection →</Link> : null}</ConnectionCard></section></main>;
}
