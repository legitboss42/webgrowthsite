import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
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

function TemplateRail({ live, drafts, submitted }: { live: WhatsAppTemplate[]; drafts: WhatsAppTemplateDraft[]; submitted: number }) {
  const approved = live.filter((template) => template.status === "APPROVED").length;
  const pending = live.filter((template) => template.status === "PENDING").length;
  return (
    <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-2xl border border-rule bg-paper-raised p-3">
        <p className="px-2 pb-2 text-[0.62rem] font-semibold uppercase tracking-[.16em] text-ink-faint">Template workspace</p>
        <nav className="grid gap-1 text-sm">
          <Link href="/admin/whatsapp/templates/" className="flex items-center gap-3 rounded-xl bg-ledger-tint px-3 py-3 font-semibold text-ledger-bright"><WhatsAppIcon name="templates" className="h-4 w-4" />Templates</Link>
          <Link href="/admin/whatsapp/campaigns/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-ink-soft hover:bg-paper-sunk hover:text-ink"><WhatsAppIcon name="campaigns" className="h-4 w-4" />Campaigns</Link>
          <Link href="/admin/whatsapp/automations/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-ink-soft hover:bg-paper-sunk hover:text-ink"><WhatsAppIcon name="automations" className="h-4 w-4" />Automations</Link>
        </nav>
      </section>
      <section className="rounded-2xl border border-rule bg-paper-raised p-4">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Status overview</p>
        <dl className="mt-3 space-y-3">
          {[["Approved", approved], ["Pending", pending], ["Local drafts", drafts.length], ["Submitted", submitted]].map(([label, value]) => <div key={String(label)} className="flex items-center justify-between gap-3"><dt className="text-xs text-ink-faint">{label}</dt><dd className="text-sm font-semibold tabular-nums text-ink">{value}</dd></div>)}
        </dl>
      </section>
    </aside>
  );
}

export default async function WhatsAppTemplatesPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <GoogleAdminPrompt nextPath="/admin/whatsapp/templates/" adminEmail={getDefaultAdminGoogleEmail()} clientId={getGoogleClientId()} googleReady={isGoogleAuthConfigured()} workspaceTeamAccess />
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
  const submittedDrafts = local.drafts.filter((draft) => Boolean(draft.metaTemplateId));

  return (
    <div className="w-full p-3 sm:p-5 lg:p-6">
      <header className="mb-5 flex flex-col gap-4 border-b border-rule pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ledger-bright"><span className="h-1.5 w-1.5 rounded-full bg-ledger-bright" />Message operations</div>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Message templates</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-faint">Create, review, test and operate Meta-approved WhatsApp templates from one workspace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/whatsapp/campaigns/" className="inline-flex items-center gap-2 rounded-xl border border-rule bg-paper-raised px-3.5 py-2.5 text-xs font-semibold text-ink-soft hover:border-rule-strong hover:text-ink"><WhatsAppIcon name="campaigns" className="h-4 w-4" />Campaigns</Link>
          <Link href="/admin/whatsapp/analytics/" className="inline-flex items-center gap-2 rounded-xl border border-ledger-bright/25 bg-ledger-tint px-3.5 py-2.5 text-xs font-semibold text-ledger-bright"><WhatsAppIcon name="analytics" className="h-4 w-4" />Performance</Link>
        </div>
      </header>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[15.5rem_minmax(0,1fr)] xl:gap-5">
        <TemplateRail live={liveTemplates} drafts={local.drafts} submitted={submittedDrafts.length} />
        <main className="min-w-0 space-y-4">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-rule bg-paper-raised"><TemplateManager liveTemplates={liveTemplates} drafts={local.drafts} draftsReady={local.ready} canManage={canManage} role={access.role} liveError={live.ok ? undefined : liveErrorCopy(live.reason)} /></section>

          {canManage && submittedDrafts.length ? (
            <section className="rounded-2xl border border-rule bg-paper-raised p-4 sm:p-5" aria-label="Submitted Meta template IDs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h2 className="text-sm font-semibold text-ink">Submitted Meta Template IDs</h2><p className="mt-1 text-xs text-ink-faint">IDs returned by Meta when Web Growth submitted these drafts for review.</p></div>
                <span className="rounded-full border border-brass/20 bg-brass-tint px-2.5 py-1 text-[0.65rem] font-semibold text-brass">{submittedDrafts.length} submitted</span>
              </div>
              <dl className="mt-3 divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-paper">
                {submittedDrafts.map((draft) => (
                  <div key={draft.id} className="grid gap-1 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                    <div className="min-w-0"><dt className="truncate font-mono text-xs font-semibold text-ink">{draft.name}</dt><dd className="mt-0.5 text-[0.68rem] text-ink-faint">{draft.language} · submitted</dd></div>
                    <dd className="break-all font-mono text-xs text-ledger-bright">{draft.metaTemplateId}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
