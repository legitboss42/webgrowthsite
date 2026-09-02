import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { getWhatsAppSupabaseConfig, mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { encryptWhatsAppWorkspaceAccessToken } from "@/lib/whatsapp/workspaceCredentials";
import { isWhatsAppWorkspaceId, normalizeWhatsAppWorkspaceSlug } from "@/lib/whatsapp/workspaceModel";
import { createWhatsAppWorkspace, ensureWhatsAppWorkspaceMembership } from "@/lib/whatsapp/workspaces";

function text(value: unknown, max = 200) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
async function guard(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  if (!access.platformAdmin) return { response: NextResponse.json({ error: "Platform administrator access is required." }, { status: 403 }) } as const;
  if (request.method !== "GET" && !isSameOriginMutation(request.headers.get("origin"), request.url)) return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) } as const;
  return { access } as const;
}

export async function GET(request: Request) {
  const checked = await guard(request); if ("response" in checked) return checked.response;
  const workspaces = await readWhatsAppRows<Record<string, unknown>>("whatsapp_workspaces?select=*&order=is_platform_owned.desc,name.asc", { unscoped: true }) || [];
  const connections = await readWhatsAppRows<Record<string, unknown>>("whatsapp_workspace_connections?select=workspace_id,waba_id,phone_number_id,display_phone_number,business_name,status,credential_source,token_last_four,api_version,last_verified_at", { unscoped: true }) || [];
  const entitlements = await readWhatsAppRows<Record<string, unknown>>("whatsapp_workspace_entitlements?select=*", { unscoped: true }) || [];
  const members = await readWhatsAppRows<Record<string, unknown>>("whatsapp_team_members?select=workspace_id,id,google_email,display_name,role,active", { unscoped: true }) || [];
  return NextResponse.json({ workspaces, connections, entitlements, members });
}

export async function POST(request: Request) {
  const checked = await guard(request); if ("response" in checked) return checked.response;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const action = text(body.action, 40).toUpperCase();

  if (action === "CREATE") {
    const name = text(body.name, 120); const ownerEmail = text(body.ownerEmail, 254).toLowerCase();
    const created = await createWhatsAppWorkspace({ name, slug: normalizeWhatsAppWorkspaceSlug(body.slug || name), ownerEmail: ownerEmail || undefined, createdByEmail: checked.access.email });
    if (!created.ok) return NextResponse.json({ error: created.reason === "DUPLICATE" ? "That workspace slug already exists." : "Workspace could not be created." }, { status: created.reason === "DUPLICATE" ? 409 : 400 });
    return NextResponse.json({ ok: true, workspace: created.workspace });
  }

  const workspaceId = text(body.workspaceId, 64);
  if (!isWhatsAppWorkspaceId(workspaceId)) return NextResponse.json({ error: "Invalid workspace." }, { status: 400 });

  if (action === "STATUS") {
    const status = body.status === "SUSPENDED" ? "SUSPENDED" : body.status === "ACTIVE" ? "ACTIVE" : null;
    if (!status) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    const changed = await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_workspaces?id=eq.${workspaceId}`, body: { status, updated_at: new Date().toISOString() }, unscoped: true });
    return changed.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: changed.message }, { status: changed.status });
  }

  if (action === "OWNER") {
    const email = text(body.email, 254).toLowerCase();
    if (!email) return NextResponse.json({ error: "Owner email is required." }, { status: 400 });
    const member = await ensureWhatsAppWorkspaceMembership({ workspaceId, email, displayName: text(body.displayName, 120) || undefined, role: "owner", createdByEmail: checked.access.email });
    return member ? NextResponse.json({ ok: true, member }) : NextResponse.json({ error: "Workspace owner could not be saved." }, { status: 400 });
  }

  if (action === "CONNECTION") {
    const token = text(body.accessToken, 5000);
    const encrypted = token ? encryptWhatsAppWorkspaceAccessToken(token) : null;
    if (token && !encrypted) return NextResponse.json({ error: "Workspace credential encryption is not configured." }, { status: 503 });
    const existing = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_workspace_connections?workspace_id=eq.${workspaceId}&select=workspace_id,credential_source,encrypted_access_token&limit=1`, { unscoped: true });
    const payload: Record<string, unknown> = {
      workspace_id: workspaceId,
      waba_id: text(body.wabaId, 80) || null,
      phone_number_id: text(body.phoneNumberId, 80) || null,
      display_phone_number: text(body.displayPhoneNumber, 40) || null,
      business_name: text(body.businessName, 120) || null,
      api_version: text(body.apiVersion, 20) || "v26.0",
      status: body.status === "DISABLED" ? "DISABLED" : text(body.phoneNumberId, 80) ? "CONNECTED" : "NOT_CONFIGURED",
      updated_at: new Date().toISOString(),
    };
    if (token) Object.assign(payload, { credential_source: "ENCRYPTED_DB", encrypted_access_token: encrypted, token_last_four: token.slice(-4), connected_at: new Date().toISOString() });
    else if (!existing?.[0]) Object.assign(payload, { credential_source: "ENCRYPTED_DB", encrypted_access_token: null });
    const result = existing?.[0]
      ? await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_workspace_connections?workspace_id=eq.${workspaceId}`, body: payload, unscoped: true })
      : await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_workspace_connections", body: payload, unscoped: true });
    return result.ok ? NextResponse.json({ ok: true, connection: result.rows[0] || payload }) : NextResponse.json({ error: result.message }, { status: result.status });
  }

  if (action === "PLAN") {
    const planCode = text(body.planCode, 40).toUpperCase() || "FREE";
    const limits = {
      plan_code: planCode,
      max_team_members: Math.max(1, Math.min(1000, Number(body.maxTeamMembers) || 3)),
      max_automations: Math.max(0, Math.min(10000, Number(body.maxAutomations) || 5)),
      max_campaign_recipients_monthly: Math.max(0, Math.min(100000000, Number(body.maxCampaignRecipientsMonthly) || 500)),
      max_ai_requests_daily: Math.max(0, Math.min(1000000, Number(body.maxAiRequestsDaily) || 0)),
      updated_at: new Date().toISOString(),
    };
    const existing = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_workspace_entitlements?workspace_id=eq.${workspaceId}&select=workspace_id&limit=1`, { unscoped: true });
    const result = existing?.[0]
      ? await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_workspace_entitlements?workspace_id=eq.${workspaceId}`, body: limits, unscoped: true })
      : await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_workspace_entitlements", body: { workspace_id: workspaceId, ...limits, features: {} }, unscoped: true });
    return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result.message }, { status: result.status });
  }

  // Keep an explicit config check here because this route is the platform control plane;
  // a missing service role should be distinguishable from an unsupported action.
  if (!getWhatsAppSupabaseConfig()) return NextResponse.json({ error: "WhatsApp storage is not configured." }, { status: 503 });
  return NextResponse.json({ error: "Unsupported workspace action." }, { status: 400 });
}
