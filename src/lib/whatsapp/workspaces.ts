import {
  WHATSAPP_DEFAULT_WORKSPACE_SLUG,
  WHATSAPP_WORKSPACE_COOKIE,
  isWhatsAppWorkspaceId,
  normalizeWhatsAppWorkspace,
  normalizeWhatsAppWorkspaceConnection,
  normalizeWhatsAppWorkspaceSlug,
  type WhatsAppWorkspace,
  type WhatsAppWorkspaceConnection,
  type WhatsAppWorkspaceEntitlements,
} from "./workspaceModel";
import { normalizeWhatsAppTeamEmail } from "./teamModel";

type CookieStoreLike = { get(name: string): { value?: string } | undefined };
type SupabaseConfig = { url: string; key: string };

function config(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function headers(value: SupabaseConfig, extra: Record<string, string> = {}) {
  return { apikey: value.key, Authorization: `Bearer ${value.key}`, ...extra };
}

async function getRows(pathAndQuery: string): Promise<Array<Record<string, unknown>>> {
  const value = config();
  if (!value) return [];
  try {
    const response = await fetch(`${value.url}/rest/v1/${pathAndQuery}`, {
      headers: headers(value),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const body = await response.json();
    return Array.isArray(body) ? body as Array<Record<string, unknown>> : [];
  } catch {
    return [];
  }
}

export function readRequestedWhatsAppWorkspaceId(cookieStore: CookieStoreLike) {
  const value = cookieStore.get(WHATSAPP_WORKSPACE_COOKIE)?.value?.trim();
  return isWhatsAppWorkspaceId(value) ? value : null;
}

export async function readRequestedWhatsAppWorkspaceIdFromRequest() {
  try {
    const { cookies } = await import("next/headers");
    return readRequestedWhatsAppWorkspaceId(await cookies());
  } catch {
    return null;
  }
}

export async function getDefaultWhatsAppWorkspace(): Promise<WhatsAppWorkspace | null> {
  const rows = await getRows(`whatsapp_workspaces?slug=eq.${WHATSAPP_DEFAULT_WORKSPACE_SLUG}&select=*&limit=1`);
  return rows[0] ? normalizeWhatsAppWorkspace(rows[0]) : null;
}

export async function getWhatsAppWorkspaceById(id: string): Promise<WhatsAppWorkspace | null> {
  if (!isWhatsAppWorkspaceId(id)) return null;
  const rows = await getRows(`whatsapp_workspaces?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return rows[0] ? normalizeWhatsAppWorkspace(rows[0]) : null;
}

export async function getWhatsAppWorkspaceConnection(workspaceId: string): Promise<WhatsAppWorkspaceConnection | null> {
  if (!isWhatsAppWorkspaceId(workspaceId)) return null;
  const rows = await getRows(`whatsapp_workspace_connections?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*&limit=1`);
  return rows[0] ? normalizeWhatsAppWorkspaceConnection(rows[0]) : null;
}

export async function getWhatsAppWorkspaceForPhoneNumberId(phoneNumberId: string | null | undefined) {
  const value = String(phoneNumberId || "").trim();
  if (!value) return null;
  const rows = await getRows(`whatsapp_workspace_connections?phone_number_id=eq.${encodeURIComponent(value)}&select=workspace_id&limit=1`);
  const workspaceId = typeof rows[0]?.workspace_id === "string" ? rows[0].workspace_id : "";
  return workspaceId ? getWhatsAppWorkspaceById(workspaceId) : null;
}

export async function getWhatsAppWorkspaceEntitlements(workspaceId: string): Promise<WhatsAppWorkspaceEntitlements | null> {
  if (!isWhatsAppWorkspaceId(workspaceId)) return null;
  const rows = await getRows(`whatsapp_workspace_entitlements?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*&limit=1`);
  const row = rows[0];
  if (!row) return null;
  return {
    workspaceId,
    planCode: typeof row.plan_code === "string" ? row.plan_code : "FREE",
    maxTeamMembers: Number(row.max_team_members) || 1,
    maxAutomations: Number(row.max_automations) || 0,
    maxCampaignRecipientsMonthly: Number(row.max_campaign_recipients_monthly) || 0,
    maxAiRequestsDaily: Number(row.max_ai_requests_daily) || 0,
    features: row.features && typeof row.features === "object" && !Array.isArray(row.features) ? row.features as Record<string, unknown> : {},
  };
}

export async function isWhatsAppPlatformAdmin(email: string | null | undefined) {
  const normalized = normalizeWhatsAppTeamEmail(email);
  if (!normalized) return false;
  const rows = await getRows(`whatsapp_platform_users?email=eq.${encodeURIComponent(normalized)}&platform_role=eq.ADMIN&active=eq.true&select=id&limit=1`);
  return rows.length > 0;
}

export async function listWhatsAppWorkspacesForIdentity(email: string, platformAdmin: boolean): Promise<WhatsAppWorkspace[]> {
  const normalized = normalizeWhatsAppTeamEmail(email);
  if (!normalized) return [];
  if (platformAdmin) {
    const rows = await getRows("whatsapp_workspaces?select=*&order=is_platform_owned.desc,name.asc");
    return rows.map(normalizeWhatsAppWorkspace);
  }

  const memberships = await getRows(`whatsapp_team_members?google_email=eq.${encodeURIComponent(normalized)}&active=eq.true&select=workspace_id`);
  const ids = Array.from(new Set(memberships.map((row) => String(row.workspace_id || "")).filter(isWhatsAppWorkspaceId)));
  if (!ids.length) return [];
  const rows = await getRows(`whatsapp_workspaces?id=in.(${ids.map(encodeURIComponent).join(",")})&select=*&order=name.asc`);
  return rows.map(normalizeWhatsAppWorkspace);
}

export async function resolveWhatsAppWorkspaceForIdentity(input: {
  email: string;
  platformAdmin: boolean;
  cookieStore: CookieStoreLike;
}): Promise<{ workspace: WhatsAppWorkspace; workspaces: WhatsAppWorkspace[] } | null> {
  const workspaces = await listWhatsAppWorkspacesForIdentity(input.email, input.platformAdmin);
  const active = workspaces.filter((workspace) => workspace.status === "ACTIVE");
  if (!active.length) return null;
  const requested = readRequestedWhatsAppWorkspaceId(input.cookieStore);
  const workspace = (requested ? active.find((item) => item.id === requested) : null)
    || active.find((item) => item.slug === WHATSAPP_DEFAULT_WORKSPACE_SLUG)
    || active[0];
  return { workspace, workspaces };
}

export async function createWhatsAppWorkspace(input: {
  name: string;
  slug?: string;
  ownerEmail?: string;
  createdByEmail: string;
}) {
  const value = config();
  if (!value) return { ok: false as const, reason: "NOT_CONFIGURED" as const };
  const name = input.name.trim().slice(0, 120);
  const slug = normalizeWhatsAppWorkspaceSlug(input.slug || name);
  if (!name || slug.length < 2) return { ok: false as const, reason: "INVALID" as const };
  try {
    const response = await fetch(`${value.url}/rest/v1/whatsapp_workspaces`, {
      method: "POST",
      headers: headers(value, { "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify({ name, slug, status: "ACTIVE", plan_code: "FREE", is_platform_owned: false, created_by_email: normalizeWhatsAppTeamEmail(input.createdByEmail) }),
      cache: "no-store",
    });
    if (!response.ok) return { ok: false as const, reason: response.status === 409 ? "DUPLICATE" as const : "FAILED" as const };
    const rows = await response.json() as Array<Record<string, unknown>>;
    const workspace = rows[0] ? normalizeWhatsAppWorkspace(rows[0]) : null;
    if (!workspace) return { ok: false as const, reason: "FAILED" as const };

    await fetch(`${value.url}/rest/v1/whatsapp_workspace_entitlements`, {
      method: "POST",
      headers: headers(value, { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify({ workspace_id: workspace.id, plan_code: "FREE", max_team_members: 3, max_automations: 5, max_campaign_recipients_monthly: 500, max_ai_requests_daily: 0, features: {} }),
      cache: "no-store",
    });

    if (input.ownerEmail) await ensureWhatsAppWorkspaceMembership({ workspaceId: workspace.id, email: input.ownerEmail, role: "owner", createdByEmail: input.createdByEmail });
    return { ok: true as const, workspace };
  } catch {
    return { ok: false as const, reason: "FAILED" as const };
  }
}

export async function ensureWhatsAppWorkspaceMembership(input: {
  workspaceId: string;
  email: string;
  displayName?: string;
  role: "owner" | "manager" | "agent";
  createdByEmail: string;
}) {
  const value = config();
  const email = normalizeWhatsAppTeamEmail(input.email);
  if (!value || !isWhatsAppWorkspaceId(input.workspaceId) || !email) return null;
  try {
    let users = await getRows(`whatsapp_platform_users?email=eq.${encodeURIComponent(email)}&select=id,display_name&limit=1`);
    if (!users[0]) {
      const userResponse = await fetch(`${value.url}/rest/v1/whatsapp_platform_users`, {
        method: "POST",
        headers: headers(value, { "Content-Type": "application/json", Prefer: "return=representation" }),
        body: JSON.stringify({ email, display_name: input.displayName?.trim() || email, platform_role: "USER", active: true }),
        cache: "no-store",
      });
      if (!userResponse.ok) return null;
      users = await userResponse.json() as Array<Record<string, unknown>>;
    }
    const userId = String(users[0]?.id || "");
    if (!userId) return null;
    const response = await fetch(`${value.url}/rest/v1/whatsapp_team_members?on_conflict=workspace_id,google_email`, {
      method: "POST",
      headers: headers(value, { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" }),
      body: JSON.stringify({
        workspace_id: input.workspaceId,
        user_id: userId,
        google_email: email,
        display_name: input.displayName?.trim() || String(users[0]?.display_name || email),
        role: input.role,
        availability: "offline",
        active: true,
        created_by_email: normalizeWhatsAppTeamEmail(input.createdByEmail),
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const rows = await response.json() as Array<Record<string, unknown>>;
    return rows[0] || null;
  } catch {
    return null;
  }
}
