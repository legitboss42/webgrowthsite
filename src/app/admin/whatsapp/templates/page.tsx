import type { Metadata } from "next";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { WorkspaceActionLink, WorkspaceRail, WorkspaceStat, WorkspaceSurface, WorkspaceToolbar } from "@/components/whatsapp/WorkspaceChrome";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { fetchWhatsAppTemplates, type WhatsAppTemplate } from "@/lib/whatsapp/templates";
import { normalizeWhatsAppTemplateDraftRow, type WhatsAppTemplateDraft } from "@/lib/whatsapp/templateModel";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import TemplateManager from "../TemplateManager";

export const metadata: Metadata = { title: "WhatsApp Template Manager | Web Growth", robots: { index: false, follow: false } };
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
  if (!access) return <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white"><div className="w-full max-w-4xl"><GoogleAdminPrompt nextPath="/admin/whatsapp/templates/" adminEmail={getDefaultAdminGoogleEmail()} clientId={getGoogleClientId()} googleReady={isGoogleAuthConfigured()} workspaceTeamAccess /></div></div>;

  const canManage = canWhatsAppRoleSuperviseTeam(access.role);
  const [live, local] = await Promise.all([fetchWhatsAppTemplates(), canManage ? getDrafts() : Promise.resolve({ drafts: [] as WhatsAppTemplateDraft[], ready: true })]);
  const liveTemplates: WhatsAppTemplate[] = live.ok ? live.templates : [];
  const submittedDrafts = local.drafts.filter((draft) => Boolean(draft.metaTemplateId));
  const approved = liveTemplates.filter((template) => template.status === "APPROVED").length;
  const pending = liveTemplates.filter((template) => template.status === "PENDING").length;
  const rejected = liveTemplates.filter((template) => template.status === "REJECTED").length;

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <WorkspaceToolbar
        eyebrow="Message operations"
        title="Templates"
        description="Create, review and operate Meta-approved WhatsApp templates."
        actions={
          <>
            <WorkspaceActionLink href="/admin/whatsapp/campaigns/" icon="campaigns">Campaigns</WorkspaceActionLink>
            <WorkspaceActionLink href="/admin/whatsapp/analytics/" icon="analytics" primary>Performance</WorkspaceActionLink>
          </>
        }
      />
      <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[13.5rem_minmax(0,1fr)] 2xl:grid-cols-[13.5rem_minmax(0,1fr)_17rem]">
        <WorkspaceRail
          label="Template workspace"
          items={[
            { label: "Templates", href: "/admin/whatsapp/templates/", icon: "templates", note: `${liveTemplates.length} from Meta`, active: true },
            { label: "Campaigns", href: "/admin/whatsapp/campaigns/", icon: "campaigns", note: "Broadcast messages" },
            { label: "Automations", href: "/admin/whatsapp/automations/", icon: "automations", note: "Workflow sends" },
            { label: "Saved Replies", href: "/admin/whatsapp/quick-replies/", icon: "quickReplies", note: "Agent snippets" },
          ]}
        />
        <main className="min-h-0 min-w-0 bg-[#060a0e] p-3 sm:p-4 2xl:border-r 2xl:border-rule">
          <section className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <WorkspaceStat label="Approved" value={approved} note="Ready to send" icon="statusDelivered" tone="good" />
            <WorkspaceStat label="Pending" value={pending} note="Under review" icon="statusPending" tone="warn" />
            <WorkspaceStat label="Drafts" value={local.drafts.length} note="Local workspace" icon="templates" />
            <WorkspaceStat label="Rejected" value={rejected} note="Needs revision" icon="statusFailed" tone={rejected ? "bad" : "default"} />
          </section>
          <WorkspaceSurface>
            <TemplateManager liveTemplates={liveTemplates} drafts={local.drafts} draftsReady={local.ready} canManage={canManage} role={access.role} liveError={live.ok ? undefined : liveErrorCopy(live.reason)} />
          </WorkspaceSurface>
          {canManage && submittedDrafts.length ? (
            <WorkspaceSurface className="mt-3">
              <div className="border-b border-rule px-4 py-3"><p className="text-xs font-semibold text-ink">Submitted Meta IDs</p><p className="mt-0.5 text-[0.68rem] text-ink-faint">Reference IDs returned after submission.</p></div>
              <dl className="divide-y divide-rule">
                {submittedDrafts.map((draft) => <div key={draft.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"><div className="min-w-0"><dt className="truncate font-mono text-xs font-semibold text-ink">{draft.name}</dt><dd className="mt-0.5 text-[0.68rem] text-ink-faint">{draft.language} · submitted</dd></div><dd className="break-all font-mono text-xs text-ledger-bright">{draft.metaTemplateId}</dd></div>)}
              </dl>
            </WorkspaceSurface>
          ) : null}
        </main>
        <aside className="wg-inspector-rail hidden min-h-0 overflow-y-auto p-4 2xl:block">
          <p className="text-xs font-semibold text-ink">Approval overview</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-rule bg-paper-sunk p-3"><p className="text-[0.6rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Meta connection</p><p className={`mt-1.5 text-xs font-medium ${live.ok ? "text-ledger-bright" : "text-amber-300"}`}>{live.ok ? "Live" : "Needs attention"}</p></div>
            <div className="rounded-lg border border-rule bg-paper-sunk p-3"><p className="text-[0.6rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Ready to use</p><p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{approved}</p><p className="mt-1 text-[0.68rem] leading-5 text-ink-faint">Approved templates are available to campaigns and automations.</p></div>
            <div className="rounded-lg border border-rule bg-paper-sunk p-3"><p className="text-[0.6rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Local drafts</p><p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{local.drafts.length}</p></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
