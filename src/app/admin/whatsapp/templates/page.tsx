import type { Metadata } from "next";
import { cookies } from "next/headers";
import InternalUtilityUnlockForm from "@/components/internal/InternalUtilityUnlockForm";
import { getInternalUtilityLocalPassphrase } from "@/lib/internalUtilityAuth";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import {
  countWhatsAppTemplatesByStatus,
  fetchWhatsAppTemplates,
  getWhatsAppTemplateComponent,
  listWhatsAppTemplateVariables,
  type WhatsAppTemplate,
  type WhatsAppTemplateStatus,
} from "@/lib/whatsapp/templates";
import { hasWhatsAppAdminAccess } from "../auth";

export const metadata: Metadata = {
  title: "WhatsApp Templates | Web Growth",
  robots: { index: false, follow: false },
};

function getStatusClasses(status: WhatsAppTemplateStatus) {
  if (status === "APPROVED") return "bg-ledger-tint text-ledger ring-1 ring-ledger/15";
  if (status === "PENDING") return "bg-brass-tint text-[#6f4f16] ring-1 ring-brass/25";
  if (status === "REJECTED" || status === "DISABLED") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  return "bg-paper-sunk text-ink-faint ring-1 ring-rule";
}

function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-rule bg-paper-raised px-6 py-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-sunk text-ink-faint">
        <WhatsAppIcon name="templates" className="h-6 w-6" />
      </span>
      <p className="mt-3 text-sm font-medium text-ink">{title}</p>
      <div className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-ink-faint">{children}</div>
    </div>
  );
}

function TemplateCard({ template }: { template: WhatsAppTemplate }) {
  const header = getWhatsAppTemplateComponent(template, "HEADER");
  const body = getWhatsAppTemplateComponent(template, "BODY");
  const footer = getWhatsAppTemplateComponent(template, "FOOTER");
  const buttons = getWhatsAppTemplateComponent(template, "BUTTONS");
  const variables = listWhatsAppTemplateVariables(body?.text);

  return (
    <article className="rounded-xl border border-rule bg-paper-raised p-5">
      <div className="flex flex-wrap items-start gap-2">
        <h2 className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-ink">
          {template.name}
        </h2>
        <span
          className={`flex-none rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${getStatusClasses(
            template.status,
          )}`}
        >
          {template.status}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-[0.65rem] text-ink-faint">
        {template.category ? (
          <span className="rounded-full bg-paper-sunk px-2 py-0.5">{template.category}</span>
        ) : null}
        {template.language ? (
          <span className="rounded-full bg-paper-sunk px-2 py-0.5 font-mono">{template.language}</span>
        ) : null}
        {variables.length ? (
          <span className="rounded-full bg-paper-sunk px-2 py-0.5">
            {variables.length} variable{variables.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {/* A rough preview of how the message is laid out on the customer's phone. */}
      <div className="mt-3 rounded-lg border border-rule bg-paper p-3">
        {header?.text ? (
          <p className="text-sm font-semibold leading-6 text-ink">{header.text}</p>
        ) : header?.format && header.format !== "TEXT" ? (
          <p className="text-[0.7rem] uppercase tracking-[.12em] text-ink-faint">
            {header.format} header
          </p>
        ) : null}

        {body?.text ? (
          <p className={`whitespace-pre-wrap text-sm leading-6 text-ink-soft ${header ? "mt-2" : ""}`}>
            {body.text}
          </p>
        ) : (
          <p className="text-sm text-ink-faint">No body text returned for this template.</p>
        )}

        {footer?.text ? (
          <p className="mt-2 text-[0.7rem] leading-5 text-ink-faint">{footer.text}</p>
        ) : null}

        {buttons?.buttons?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-rule pt-2.5">
            {buttons.buttons.map((button, index) => (
              <span
                key={`${button.type}-${button.text || index}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper-raised px-2.5 py-1 text-[0.7rem] text-ledger"
              >
                {button.text || button.type}
                <span className="font-mono text-[0.6rem] text-ink-faint">{button.type}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {variables.length ? (
        <p className="mt-2 text-[0.65rem] text-ink-faint">
          Placeholders:{" "}
          <span className="font-mono text-ink-soft">
            {variables.map((name) => `{{${name}}}`).join(" ")}
          </span>
        </p>
      ) : null}
    </article>
  );
}

export default async function WhatsAppTemplatesPage() {
  const cookieStore = await cookies();
  const unlocked = hasWhatsAppAdminAccess(cookieStore);

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <InternalUtilityUnlockForm localHint={getInternalUtilityLocalPassphrase() || undefined} />
        </div>
      </div>
    );
  }

  const result = await fetchWhatsAppTemplates();

  if (!result.ok) {
    return (
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        {result.reason === "NOT_CONFIGURED" ? (
          <EmptyState title="Templates are not configured">
            Set <span className="font-mono text-ink-soft">WHATSAPP_ACCESS_TOKEN</span> and{" "}
            <span className="font-mono text-ink-soft">WHATSAPP_BUSINESS_ACCOUNT_ID</span> on this
            deployment. Templates are read from Meta, so nothing can be listed without them.
          </EmptyState>
        ) : result.reason === "PERMISSION_DENIED" ? (
          <EmptyState title="Meta refused the template request">
            The access token was rejected or lacks the WhatsApp business management permission.
            Check that it has not expired and that it can read this business account.
          </EmptyState>
        ) : (
          <EmptyState title="Could not reach Meta for templates">
            The Graph API did not return a template list. This is usually temporary — reload in a
            moment. The server log has the detail.
          </EmptyState>
        )}
      </div>
    );
  }

  const counts = countWhatsAppTemplatesByStatus(result.templates);

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-ink-faint">
          Read live from Meta · <span className="tabular-nums">{counts.ALL}</span> template
          {counts.ALL === 1 ? "" : "s"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(["APPROVED", "PENDING", "REJECTED"] as const).map((status) =>
            counts[status] ? (
              <span
                key={status}
                className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${getStatusClasses(status)}`}
              >
                {counts[status]} {status.toLowerCase()}
              </span>
            ) : null,
          )}
        </div>
      </div>

      {result.templates.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No message templates yet">
            Templates are created and approved in Meta Business Manager, then appear here. They are
            what lets you start a conversation outside the 24-hour reply window.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {result.templates.map((template) => (
            <TemplateCard key={template.id || template.name} template={template} />
          ))}
        </div>
      )}

      <p className="mt-4 rounded-lg bg-paper-raised px-3 py-2.5 text-xs leading-5 text-ink-faint">
        This page is read-only. Creating, editing, and submitting templates for review happens in
        Meta Business Manager — sending them from here arrives with Campaigns.
      </p>
    </div>
  );
}
