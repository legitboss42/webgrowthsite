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
  const submittedDrafts = local.drafts.filter((draft) => Boolean(draft.metaTemplateId));

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

      {canManage && submittedDrafts.length ? (
        <section className="mt-5 rounded-xl border border-rule bg-paper-raised p-4" aria-label="Submitted Meta template IDs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-ink">Submitted Meta Template IDs</h2>
              <p className="mt-1 text-xs text-ink-faint">IDs returned by Meta when Web Growth submitted these drafts for review.</p>
            </div>
            <span className="rounded-full bg-brass-tint px-2.5 py-1 text-[0.65rem] font-semibold text-[#6f4f16]">
              {submittedDrafts.length} submitted
            </span>
          </div>
          <dl className="mt-3 divide-y divide-rule rounded-lg border border-rule bg-paper">
            {submittedDrafts.map((draft) => (
              <div key={draft.id} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                <div className="min-w-0">
                  <dt className="truncate font-mono text-xs font-semibold text-ink">{draft.name}</dt>
                  <dd className="mt-0.5 text-[0.68rem] text-ink-faint">{draft.language} · submitted</dd>
                </div>
                <dd className="break-all font-mono text-xs text-ledger">{draft.metaTemplateId}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
