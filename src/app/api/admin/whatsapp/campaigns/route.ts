import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  getWhatsAppCampaignEligibility,
  matchesWhatsAppSegment,
  normalizeWhatsAppCampaignContact,
  normalizeWhatsAppCampaignRow,
  normalizeWhatsAppSegmentRow,
  validateWhatsAppSegmentInput,
  type WhatsAppCampaignContact,
  type WhatsAppSegmentCondition,
  type WhatsAppSegmentJoin,
} from "@/lib/whatsapp/campaignModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { fetchWhatsAppTemplates, type WhatsAppTemplate } from "@/lib/whatsapp/templates";
import { listWhatsAppTemplateVariables } from "@/lib/whatsapp/templateModel";

export const runtime = "nodejs";

const CONTACT_SELECT = "id,wa_id,phone,display_name,business_name,email,source,lead_stage,lead_temperature,tags,custom_fields,opt_in_status,opt_in_at,opt_out_at,whatsapp_conversations(status,last_message_at,assigned_member_id)";
const CAMPAIGN_SELECT = "id,name,description,status,segment_id,audience_snapshot,template_id,template_name,template_language,template_category,template_snapshot,variable_mappings,scheduled_at,started_at,completed_at,paused_at,cancelled_at,audience_count,eligible_count,sent_count,delivered_count,read_count,replied_count,failed_count,skipped_count,created_at,updated_at";
const RECIPIENT_SELECT = "id,campaign_id,contact_id,wa_id,display_name,status,skip_reason,message_id,contact_snapshot,variable_values,attempts,max_attempts,scheduled_at,sent_at,delivered_at,read_at,replied_at,failed_at,reply_message_id,error_code,error_message,created_at,updated_at";

async function guard(request: Request, mutation = true) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  if (!canWhatsAppRoleSuperviseTeam(access.role)) {
    return { response: NextResponse.json({ error: "Owner or Manager access is required to manage campaigns." }, { status: 403 }) } as const;
  }
  if (mutation && !isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) } as const;
  }
  return { access } as const;
}

async function readBody(request: Request) {
  try { return (await request.json()) as Record<string, unknown>; }
  catch { return null; }
}

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function stringRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, string>;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([key, item]) => [key, item.trim()]),
  );
}

async function loadContacts() {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_contacts?select=${CONTACT_SELECT}&order=created_at.desc&limit=5000`,
  );
  return rows?.map(normalizeWhatsAppCampaignContact) || [];
}

async function audienceDefinition(body: Record<string, unknown>): Promise<{
  segmentId?: string;
  join: WhatsAppSegmentJoin;
  conditions: WhatsAppSegmentCondition[];
  label: string;
} | null> {
  const segmentId = clean(body.segmentId, 80);
  if (segmentId) {
    const rows = await readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_segments?id=eq.${encodeURIComponent(segmentId)}&select=id,name,description,condition_join,conditions,created_at,updated_at&limit=1`,
    );
    if (!rows?.[0]) return null;
    const segment = normalizeWhatsAppSegmentRow(rows[0]);
    return { segmentId: segment.id, join: segment.conditionJoin, conditions: segment.conditions, label: segment.name };
  }
  const checked = validateWhatsAppSegmentInput({
    name: "Inline audience",
    description: "",
    conditionJoin: body.conditionJoin,
    conditions: body.conditions,
  });
  if (!checked.ok) return null;
  return { join: checked.value.conditionJoin, conditions: checked.value.conditions, label: "Inline audience" };
}

function audienceSummary(contacts: WhatsAppCampaignContact[], definition: NonNullable<Awaited<ReturnType<typeof audienceDefinition>>>) {
  const matched = contacts.filter((contact) => matchesWhatsAppSegment(contact, definition.conditions, definition.join));
  const recipients = matched.map((contact) => ({ contact, eligibility: getWhatsAppCampaignEligibility(contact) }));
  return {
    matched,
    eligible: recipients.filter((item) => item.eligibility.eligible).map((item) => item.contact),
    optedOut: recipients.filter((item) => item.eligibility.reason === "OPTED_OUT").length,
    consentUnknown: recipients.filter((item) => item.eligibility.reason === "CONSENT_REQUIRED").length,
    invalid: recipients.filter((item) => item.eligibility.reason === "INVALID_NUMBER").length,
  };
}

function templateFields(template: WhatsAppTemplate) {
  const header = template.components.find((component) => component.type === "HEADER")?.text || "";
  const body = template.components.find((component) => component.type === "BODY")?.text || "";
  return [
    ...listWhatsAppTemplateVariables(header).map((token) => `header:${token}`),
    ...listWhatsAppTemplateVariables(body).map((token) => `body:${token}`),
  ];
}

async function approvedTemplate(templateId: string) {
  const live = await fetchWhatsAppTemplates();
  if (!live.ok) return { ok: false as const, error: "Meta template status could not be verified." };
  const template = live.templates.find((item) => item.id === templateId);
  if (!template || template.status !== "APPROVED") return { ok: false as const, error: "Choose an approved Meta template." };
  return { ok: true as const, template };
}

function validateMappings(template: WhatsAppTemplate, mappings: Record<string, string>) {
  const required = templateFields(template);
  const missing = required.filter((key) => !mappings[key]?.trim());
  return missing.length ? `Map every required template variable before saving: ${missing.join(", ")}.` : null;
}

function contactSnapshot(contact: WhatsAppCampaignContact) {
  return {
    waId: contact.waId,
    displayName: contact.displayName || null,
    businessName: contact.businessName || null,
    email: contact.email || null,
    source: contact.source || null,
    leadStage: contact.leadStage || null,
    leadTemperature: contact.leadTemperature || null,
    tags: contact.tags,
    customFields: contact.customFields,
    optInStatus: contact.optInStatus,
  };
}

async function snapshotRecipients(input: {
  campaignId: string;
  scheduledAt: string;
  definition: NonNullable<Awaited<ReturnType<typeof audienceDefinition>>>;
  summary: ReturnType<typeof audienceSummary>;
}) {
  if (input.summary.matched.length > 5000) return { ok: false as const, error: "This audience is too large for the current campaign release." };
  if (input.summary.matched.length) {
    const body = input.summary.matched.map((contact) => {
      const eligibility = getWhatsAppCampaignEligibility(contact);
      return {
        id: randomUUID(),
        campaign_id: input.campaignId,
        contact_id: contact.id,
        wa_id: contact.waId,
        display_name: contact.displayName || null,
        status: eligibility.eligible ? "PENDING" : "SKIPPED",
        skip_reason: eligibility.eligible ? null : eligibility.reason,
        contact_snapshot: contactSnapshot(contact),
        variable_values: {},
        max_attempts: 3,
        scheduled_at: input.scheduledAt,
      };
    });
    const inserted = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_campaign_recipients", body });
    if (!inserted.ok) return { ok: false as const, error: inserted.message };
  }
  await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_campaigns?id=eq.${encodeURIComponent(input.campaignId)}`,
    body: {
      audience_snapshot: {
        segmentId: input.definition.segmentId || null,
        label: input.definition.label,
        conditionJoin: input.definition.join,
        conditions: input.definition.conditions,
        matched: input.summary.matched.length,
        eligible: input.summary.eligible.length,
        capturedAt: new Date().toISOString(),
      },
      audience_count: input.summary.matched.length,
      eligible_count: input.summary.eligible.length,
      skipped_count: input.summary.matched.length - input.summary.eligible.length,
      updated_at: new Date().toISOString(),
    },
  });
  return { ok: true as const };
}

export async function GET(request: Request) {
  const guarded = await guard(request, false);
  if ("response" in guarded) return guarded.response;
  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaignId")?.trim();
  if (campaignId) {
    const rows = await readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_campaign_recipients?campaign_id=eq.${encodeURIComponent(campaignId)}&select=${RECIPIENT_SELECT}&order=created_at.asc&limit=5000`,
    );
    return NextResponse.json({ recipients: rows || [] });
  }
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_campaigns?select=${CAMPAIGN_SELECT}&order=created_at.desc&limit=500`,
  );
  return NextResponse.json({ campaigns: rows?.map(normalizeWhatsAppCampaignRow) || [] });
}

export async function POST(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  const action = clean(body.action, 30).toUpperCase();
  const definition = await audienceDefinition(body);
  if (!definition) return NextResponse.json({ error: "Choose a valid audience." }, { status: 400 });
  const contacts = await loadContacts();
  const summary = audienceSummary(contacts, definition);

  if (action === "PREVIEW") {
    return NextResponse.json({
      matched: summary.matched.length,
      eligible: summary.eligible.length,
      optedOut: summary.optedOut,
      consentUnknown: summary.consentUnknown,
      invalid: summary.invalid,
      recipients: summary.eligible.slice(0, 100).map((contact) => ({ id: contact.id, waId: contact.waId, displayName: contact.displayName || contact.waId })),
    });
  }

  if (action !== "CREATE") return NextResponse.json({ error: "Unknown campaign action." }, { status: 400 });
  const name = clean(body.name, 120);
  const description = clean(body.description, 1000);
  const templateId = clean(body.templateId, 200);
  const mappings = stringRecord(body.variableMappings);
  const mode = clean(body.mode, 30).toUpperCase();
  if (!name) return NextResponse.json({ error: "Campaign name is required." }, { status: 400 });
  if (!templateId) return NextResponse.json({ error: "Choose an approved Meta template." }, { status: 400 });
  const checkedTemplate = await approvedTemplate(templateId);
  if (!checkedTemplate.ok) return NextResponse.json({ error: checkedTemplate.error }, { status: 400 });
  const mappingError = validateMappings(checkedTemplate.template, mappings);
  if (mappingError) return NextResponse.json({ error: mappingError }, { status: 400 });

  let scheduledAt: string | null = null;
  let status: "DRAFT" | "SCHEDULED" = "DRAFT";
  if (mode === "SEND_NOW") {
    scheduledAt = new Date().toISOString();
    status = "SCHEDULED";
  } else if (mode === "SCHEDULE") {
    const parsed = Date.parse(clean(body.scheduledAt, 80));
    if (!Number.isFinite(parsed) || parsed <= Date.now()) return NextResponse.json({ error: "Choose a future campaign date and time." }, { status: 400 });
    scheduledAt = new Date(parsed).toISOString();
    status = "SCHEDULED";
  } else if (mode !== "DRAFT") {
    return NextResponse.json({ error: "Choose Save draft, Send now, or Schedule." }, { status: 400 });
  }

  if (status === "SCHEDULED" && summary.eligible.length === 0) {
    return NextResponse.json({ error: "This audience has no opted-in, valid WhatsApp recipients." }, { status: 400 });
  }

  const campaignId = randomUUID();
  const campaignBody: Record<string, unknown> = {
    id: campaignId,
    name,
    description,
    status,
    segment_id: definition.segmentId || null,
    audience_snapshot: {
      segmentId: definition.segmentId || null,
      label: definition.label,
      conditionJoin: definition.join,
      conditions: definition.conditions,
    },
    template_id: checkedTemplate.template.id,
    template_name: checkedTemplate.template.name,
    template_language: checkedTemplate.template.language || "en_US",
    template_category: checkedTemplate.template.category || null,
    template_snapshot: checkedTemplate.template,
    variable_mappings: mappings,
    scheduled_at: scheduledAt,
    created_by_member_id: guarded.access.memberId || null,
    updated_by_member_id: guarded.access.memberId || null,
  };
  const inserted = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_campaigns", body: campaignBody });
  if (!inserted.ok) return NextResponse.json({ error: inserted.message }, { status: inserted.status });

  if (status === "SCHEDULED" && scheduledAt) {
    const snap = await snapshotRecipients({ campaignId, scheduledAt, definition, summary });
    if (!snap.ok) {
      await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_campaigns?id=eq.${encodeURIComponent(campaignId)}`, body: { status: "FAILED", updated_at: new Date().toISOString() } });
      return NextResponse.json({ error: snap.error }, { status: 500 });
    }
  }
  const saved = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_campaigns?id=eq.${encodeURIComponent(campaignId)}&select=${CAMPAIGN_SELECT}&limit=1`,
  );
  return NextResponse.json({ ok: true, campaign: saved?.[0] ? normalizeWhatsAppCampaignRow(saved[0]) : null }, { status: 201 });
}

export async function PATCH(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  const id = clean(body.id, 80);
  const action = clean(body.action, 30).toUpperCase();
  if (!id) return NextResponse.json({ error: "Campaign ID is required." }, { status: 400 });
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_campaigns?id=eq.${encodeURIComponent(id)}&select=${CAMPAIGN_SELECT}&limit=1`,
  );
  const campaign = rows?.[0] ? normalizeWhatsAppCampaignRow(rows[0]) : null;
  if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

  if (action === "PAUSE") {
    if (!new Set(["SCHEDULED", "RUNNING"]).has(campaign.status)) return NextResponse.json({ error: "Only scheduled or running campaigns can be paused." }, { status: 409 });
    await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_campaigns?id=eq.${encodeURIComponent(id)}`, body: { status: "PAUSED", paused_at: new Date().toISOString(), updated_at: new Date().toISOString(), updated_by_member_id: guarded.access.memberId || null } });
    return NextResponse.json({ ok: true });
  }

  if (action === "RESUME") {
    if (campaign.status !== "PAUSED") return NextResponse.json({ error: "Only paused campaigns can be resumed." }, { status: 409 });
    await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_campaigns?id=eq.${encodeURIComponent(id)}`, body: { status: "RUNNING", paused_at: null, updated_at: new Date().toISOString(), updated_by_member_id: guarded.access.memberId || null } });
    return NextResponse.json({ ok: true });
  }

  if (action === "CANCEL") {
    if (new Set(["COMPLETED", "CANCELLED"]).has(campaign.status)) return NextResponse.json({ error: "That campaign is already finished." }, { status: 409 });
    await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_campaigns?id=eq.${encodeURIComponent(id)}`, body: { status: "CANCELLED", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString(), updated_by_member_id: guarded.access.memberId || null } });
    await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_campaign_recipients?campaign_id=eq.${encodeURIComponent(id)}&status=eq.PENDING`, body: { status: "CANCELLED", updated_at: new Date().toISOString() } });
    return NextResponse.json({ ok: true });
  }

  if (action === "LAUNCH" || action === "SCHEDULE") {
    if (campaign.status !== "DRAFT") return NextResponse.json({ error: "Only draft campaigns can be launched or scheduled from the editor." }, { status: 409 });
    const definition = await audienceDefinition({
      segmentId: campaign.segmentId,
      conditionJoin: campaign.audienceSnapshot.conditionJoin,
      conditions: campaign.audienceSnapshot.conditions,
    });
    if (!definition) return NextResponse.json({ error: "The saved audience is no longer available." }, { status: 400 });
    const checkedTemplate = await approvedTemplate(campaign.templateId);
    if (!checkedTemplate.ok) return NextResponse.json({ error: checkedTemplate.error }, { status: 400 });
    const mappingError = validateMappings(checkedTemplate.template, campaign.variableMappings);
    if (mappingError) return NextResponse.json({ error: mappingError }, { status: 400 });
    const contacts = await loadContacts();
    const summary = audienceSummary(contacts, definition);
    if (!summary.eligible.length) return NextResponse.json({ error: "This audience has no eligible opted-in recipients." }, { status: 400 });
    const parsed = action === "LAUNCH" ? Date.now() : Date.parse(clean(body.scheduledAt, 80));
    if (!Number.isFinite(parsed) || (action === "SCHEDULE" && parsed <= Date.now())) return NextResponse.json({ error: "Choose a future campaign date and time." }, { status: 400 });
    const scheduledAt = new Date(parsed).toISOString();
    await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_campaigns?id=eq.${encodeURIComponent(id)}`, body: { status: "SCHEDULED", scheduled_at: scheduledAt, template_snapshot: checkedTemplate.template, updated_at: new Date().toISOString(), updated_by_member_id: guarded.access.memberId || null } });
    const snap = await snapshotRecipients({ campaignId: id, scheduledAt, definition, summary });
    if (!snap.ok) return NextResponse.json({ error: snap.error }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown campaign action." }, { status: 400 });
}
