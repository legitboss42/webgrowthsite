import Link from "next/link";
import { DashboardHeading, MetricCard } from "@/components/dashboard/DashboardShell";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { requireWebGrowthDashboardSession } from "@/lib/dashboardSession";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";

export default async function DashboardWhatsAppPage() {
  const { cookieStore: jar } = await requireWebGrowthDashboardSession();
  let access: Awaited<ReturnType<typeof getWhatsAppWorkspaceAccess>> = null;
  try { access = await getWhatsAppWorkspaceAccess(jar); } catch {}
  if (!access) return <main><DashboardHeading eyebrow="WhatsApp Business" title="No WhatsApp workspace access" description="Your Web Growth session is valid, but this identity does not currently resolve to an active WhatsApp workspace membership." /><div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6 text-sm text-white/55">Workspace roles remain enforced separately from the shared login.</div></main>;

  let conversations: number | null = null;
  let contacts: number | null = null;
  let automations: number | null = null;
  try {
    const db = createSchedulerSupabaseClient();
    const [conversationRead, contactRead, automationRead] = await Promise.all([
      db.from("whatsapp_conversations").select("id", { count: "exact", head: true }).eq("workspace_id", access.workspaceId),
      db.from("whatsapp_contacts").select("id", { count: "exact", head: true }).eq("workspace_id", access.workspaceId),
      db.from("whatsapp_automations").select("id", { count: "exact", head: true }).eq("workspace_id", access.workspaceId),
    ]);
    conversations = conversationRead.count ?? 0; contacts = contactRead.count ?? 0; automations = automationRead.count ?? 0;
  } catch {}

  return <main>
    <DashboardHeading eyebrow="WhatsApp Business" title={access.workspaceName} description={`Signed in as ${access.displayName}. Workspace permissions remain ${access.role}, so the unified dashboard never bypasses team authorization.`} actions={<Link href="/admin/whatsapp/" className="rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-bold text-[#07100c]">Open WhatsApp workspace</Link>} />
    <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Conversations" value={conversations ?? "—"} /><MetricCard label="Contacts" value={contacts ?? "—"} /><MetricCard label="Automations" value={automations ?? "—"} /><MetricCard label="Role" value={access.role} hint={access.platformAdmin ? "Platform administrator" : access.workspaceSlug} /></section>
    <section className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {[ ["Inbox","/admin/whatsapp/","Conversations and live messaging"], ["Contacts","/admin/whatsapp/contacts/","CRM contacts and lead context"], ["Automations","/admin/whatsapp/automations/","Triggers, conditions and actions"], ["Campaigns","/admin/whatsapp/campaigns/","Template campaigns and delivery"], ["Flows","/admin/whatsapp/flows/","Interactive WhatsApp Flow experiences"], ["Settings","/admin/whatsapp/settings/","Workspace and channel configuration"] ].map(([title,href,description]) => <Link key={title} href={href} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 hover:border-emerald-300/25"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-white/45">{description}</p></Link>)}
    </section>
  </main>;
}
