import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { isWhatsAppFlowEncryptionConfigured } from "@/lib/whatsapp/flowCrypto";
import { normalizeWhatsAppFlowRow, validateWhatsAppFlowInput, WHATSAPP_FLOW_DATA_API_VERSION, WHATSAPP_FLOW_JSON_VERSION } from "@/lib/whatsapp/flowModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { createMetaWhatsAppFlow, deleteMetaWhatsAppFlow, deprecateMetaWhatsAppFlow, getMetaWhatsAppFlow, publishMetaWhatsAppFlow, uploadMetaWhatsAppFlowJson, type MetaWhatsAppFlow } from "@/lib/whatsapp/flows";

export const runtime = "nodejs";

async function guard(request: Request, mutation = true) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  if (!canWhatsAppRoleSuperviseTeam(access.role)) return { response: NextResponse.json({ error: "Owner or Manager access is required to manage WhatsApp Flows." }, { status: 403 }) } as const;
  if (mutation && !isSameOriginMutation(request.headers.get("origin"), request.url)) return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) } as const;
  return { access } as const;
}
function text(value: unknown, max = 500) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
async function body(request: Request) { try { return await request.json() as Record<string, unknown>; } catch { return null; } }
async function load(id: string) {
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_flows?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return rows?.[0] ? normalizeWhatsAppFlowRow(rows[0]) : null;
}
function endpointUri() { return "https://webgrowth.info/api/whatsapp/flows/data/"; }
function metaPatch(flow: MetaWhatsAppFlow) {
  return {
    name: flow.name || undefined,
    status: flow.status,
    categories: flow.categories,
    validation_errors: flow.validationErrors,
    json_version: flow.jsonVersion || WHATSAPP_FLOW_JSON_VERSION,
    data_api_version: flow.dataApiVersion || null,
    endpoint_uri: flow.endpointUri || null,
    preview_url: flow.previewUrl || null,
    preview_expires_at: flow.previewExpiresAt || null,
    health_status: flow.healthStatus || {},
    updated_at: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const auth = await guard(request, false); if ("response" in auth) return auth.response;
  const url = new URL(request.url); const id = text(url.searchParams.get("id"), 100);
  if (id) { const flow = await load(id); return flow ? NextResponse.json({ flow }) : NextResponse.json({ error: "Flow not found." }, { status: 404 }); }
  const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_flows?select=*&order=updated_at.desc&limit=500");
  return NextResponse.json({ flows: (rows || []).map(normalizeWhatsAppFlowRow) });
}

export async function POST(request: Request) {
  const auth = await guard(request); if ("response" in auth) return auth.response;
  const input = await body(request); if (!input) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  const action = text(input.action, 30).toUpperCase() || "CREATE";

  if (action === "CREATE") {
    const checked = validateWhatsAppFlowInput(input); if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
    const meta = await createMetaWhatsAppFlow({ name: checked.value.name, categories: checked.value.categories, ...(checked.value.builder.dynamic ? { endpointUri: endpointUri() } : {}) });
    if (!meta.ok) return NextResponse.json({ error: meta.error }, { status: 502 });
    const uploaded = await uploadMetaWhatsAppFlowJson(meta.id, checked.value.flowJson);
    if (!uploaded.ok) { await deleteMetaWhatsAppFlow(meta.id).catch(() => undefined); return NextResponse.json({ error: uploaded.error }, { status: 502 }); }
    const id = randomUUID(); const now = new Date().toISOString();
    const saved = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_flows", body: {
      id, meta_flow_id: meta.id, name: checked.value.name, categories: checked.value.categories, status: "DRAFT",
      json_version: WHATSAPP_FLOW_JSON_VERSION, data_api_version: checked.value.builder.dynamic ? WHATSAPP_FLOW_DATA_API_VERSION : null,
      endpoint_uri: checked.value.builder.dynamic ? endpointUri() : null, validation_errors: uploaded.validationErrors,
      flow_json: checked.value.flowJson, builder_definition: checked.value.builder, crm_mapping: checked.value.crmMapping,
      version: 1, created_by_member_id: auth.access.memberId, updated_by_member_id: auth.access.memberId, created_at: now, updated_at: now,
    } });
    if (!saved.ok) return NextResponse.json({ error: saved.message }, { status: 500 });
    await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_flow_versions", body: { flow_id: id, version: 1, flow_json: checked.value.flowJson, builder_definition: checked.value.builder, crm_mapping: checked.value.crmMapping, validation_errors: uploaded.validationErrors, created_by_member_id: auth.access.memberId } });
    return NextResponse.json({ ok: true, id, metaFlowId: meta.id, validationErrors: uploaded.validationErrors });
  }

  if (action === "DUPLICATE") {
    const source = await load(text(input.id, 100)); if (!source) return NextResponse.json({ error: "Source Flow not found." }, { status: 404 });
    const name = text(input.name, 80) || `${source.name} copy`;
    const meta = await createMetaWhatsAppFlow({ name, categories: source.categories, ...(source.builder.dynamic ? { endpointUri: endpointUri() } : {}), ...(source.metaFlowId ? { cloneFlowId: source.metaFlowId } : {}) });
    if (!meta.ok) return NextResponse.json({ error: meta.error }, { status: 502 });
    const uploaded = await uploadMetaWhatsAppFlowJson(meta.id, source.flowJson); if (!uploaded.ok) return NextResponse.json({ error: uploaded.error }, { status: 502 });
    const id = randomUUID();
    const saved = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_flows", body: { id, meta_flow_id: meta.id, name, categories: source.categories, status: "DRAFT", json_version: source.jsonVersion, data_api_version: source.dataApiVersion || null, endpoint_uri: source.builder.dynamic ? endpointUri() : null, validation_errors: uploaded.validationErrors, flow_json: source.flowJson, builder_definition: source.builder, crm_mapping: source.crmMapping, version: 1, created_by_member_id: auth.access.memberId, updated_by_member_id: auth.access.memberId } });
    if (!saved.ok) return NextResponse.json({ error: saved.message }, { status: 500 });
    await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_flow_versions", body: { flow_id: id, version: 1, flow_json: source.flowJson, builder_definition: source.builder, crm_mapping: source.crmMapping, validation_errors: uploaded.validationErrors, created_by_member_id: auth.access.memberId } });
    return NextResponse.json({ ok: true, id, metaFlowId: meta.id });
  }

  if (action === "SYNC") {
    const flow = await load(text(input.id, 100)); if (!flow?.metaFlowId) return NextResponse.json({ error: "This Flow has no Meta Flow ID." }, { status: 400 });
    const remote = await getMetaWhatsAppFlow(flow.metaFlowId); if (!remote.ok) return NextResponse.json({ error: remote.error }, { status: 502 });
    const saved = await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_flows?id=eq.${encodeURIComponent(flow.id)}`, body: { ...metaPatch(remote.flow), updated_by_member_id: auth.access.memberId } });
    return saved.ok ? NextResponse.json({ ok: true, flow: remote.flow }) : NextResponse.json({ error: saved.message }, { status: 500 });
  }

  if (action === "PUBLISH") {
    const flow = await load(text(input.id, 100)); if (!flow?.metaFlowId) return NextResponse.json({ error: "Flow not found or not linked to Meta." }, { status: 404 });
    if (flow.status !== "DRAFT") return NextResponse.json({ error: "Only Draft Flows can be published." }, { status: 409 });
    if (flow.builder.dynamic && !isWhatsAppFlowEncryptionConfigured()) return NextResponse.json({ error: "Dynamic Flow publishing is blocked until WHATSAPP_FLOW_PRIVATE_KEY is configured and its public key is registered with Meta." }, { status: 409 });
    const uploaded = await uploadMetaWhatsAppFlowJson(flow.metaFlowId, flow.flowJson); if (!uploaded.ok) return NextResponse.json({ error: uploaded.error }, { status: 502 });
    if (uploaded.validationErrors.length) {
      await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_flows?id=eq.${encodeURIComponent(flow.id)}`, body: { validation_errors: uploaded.validationErrors, updated_at: new Date().toISOString() } });
      return NextResponse.json({ error: "Meta validation failed. Fix the listed Flow errors before publishing.", validationErrors: uploaded.validationErrors }, { status: 422 });
    }
    const published = await publishMetaWhatsAppFlow(flow.metaFlowId); if (!published.ok) return NextResponse.json({ error: published.error }, { status: 502 });
    const now = new Date().toISOString(); await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_flows?id=eq.${encodeURIComponent(flow.id)}`, body: { status: "PUBLISHED", validation_errors: [], published_at: now, updated_by_member_id: auth.access.memberId, updated_at: now } });
    return NextResponse.json({ ok: true });
  }

  if (action === "DEPRECATE") {
    const flow = await load(text(input.id, 100)); if (!flow?.metaFlowId) return NextResponse.json({ error: "Flow not found or not linked to Meta." }, { status: 404 });
    if (flow.status !== "PUBLISHED") return NextResponse.json({ error: "Only Published Flows can be deprecated." }, { status: 409 });
    const deprecated = await deprecateMetaWhatsAppFlow(flow.metaFlowId); if (!deprecated.ok) return NextResponse.json({ error: deprecated.error }, { status: 502 });
    const now = new Date().toISOString(); await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_flows?id=eq.${encodeURIComponent(flow.id)}`, body: { status: "DEPRECATED", deprecated_at: now, updated_by_member_id: auth.access.memberId, updated_at: now } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown Flow action." }, { status: 400 });
}

export async function PATCH(request: Request) {
  const auth = await guard(request); if ("response" in auth) return auth.response;
  const input = await body(request); if (!input) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  const flow = await load(text(input.id, 100)); if (!flow) return NextResponse.json({ error: "Flow not found." }, { status: 404 });
  if (flow.status !== "DRAFT") return NextResponse.json({ error: "Published Flows are immutable. Duplicate the Flow to create a new version." }, { status: 409 });
  const checked = validateWhatsAppFlowInput(input); if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  if (!flow.metaFlowId) return NextResponse.json({ error: "This Draft is not linked to Meta." }, { status: 409 });
  const uploaded = await uploadMetaWhatsAppFlowJson(flow.metaFlowId, checked.value.flowJson); if (!uploaded.ok) return NextResponse.json({ error: uploaded.error }, { status: 502 });
  const nextVersion = flow.version + 1; const now = new Date().toISOString();
  const saved = await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_flows?id=eq.${encodeURIComponent(flow.id)}`, body: { name: checked.value.name, categories: checked.value.categories, json_version: WHATSAPP_FLOW_JSON_VERSION, data_api_version: checked.value.builder.dynamic ? WHATSAPP_FLOW_DATA_API_VERSION : null, endpoint_uri: checked.value.builder.dynamic ? endpointUri() : null, validation_errors: uploaded.validationErrors, flow_json: checked.value.flowJson, builder_definition: checked.value.builder, crm_mapping: checked.value.crmMapping, version: nextVersion, updated_by_member_id: auth.access.memberId, updated_at: now } });
  if (!saved.ok) return NextResponse.json({ error: saved.message }, { status: 500 });
  await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_flow_versions", body: { flow_id: flow.id, version: nextVersion, flow_json: checked.value.flowJson, builder_definition: checked.value.builder, crm_mapping: checked.value.crmMapping, validation_errors: uploaded.validationErrors, created_by_member_id: auth.access.memberId } });
  return NextResponse.json({ ok: true, version: nextVersion, validationErrors: uploaded.validationErrors });
}

export async function DELETE(request: Request) {
  const auth = await guard(request); if ("response" in auth) return auth.response;
  const input = await body(request); const flow = input ? await load(text(input.id, 100)) : null;
  if (!flow) return NextResponse.json({ error: "Flow not found." }, { status: 404 });
  if (flow.status !== "DRAFT") return NextResponse.json({ error: "Only Draft Flows can be deleted. Published Flows must be deprecated." }, { status: 409 });
  if (flow.metaFlowId) { const remote = await deleteMetaWhatsAppFlow(flow.metaFlowId); if (!remote.ok) return NextResponse.json({ error: remote.error }, { status: 502 }); }
  const removed = await mutateWhatsAppRest({ method: "DELETE", pathAndQuery: `whatsapp_flows?id=eq.${encodeURIComponent(flow.id)}` });
  return removed.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: removed.message }, { status: 500 });
}
