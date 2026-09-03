import {
  normalizeWhatsAppTeamEmail,
  normalizeWhatsAppTeamMember,
  type WhatsAppTeamMember,
} from "./teamModel";
import { isWhatsAppWorkspaceId } from "./workspaceModel";
import {
  ensureWhatsAppWorkspaceMembership,
  getDefaultWhatsAppWorkspace,
  readRequestedWhatsAppWorkspaceIdFromRequest,
} from "./workspaces";

type SupabaseConfig = { url: string; key: string };
function getConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}
function headers(config: SupabaseConfig, extra: Record<string, string> = {}) {
  return { apikey: config.key, Authorization: `Bearer ${config.key}`, ...extra };
}

async function resolveWorkspaceId(value?: string | null) {
  if (isWhatsAppWorkspaceId(value)) return value;
  const requested = await readRequestedWhatsAppWorkspaceIdFromRequest();
  if (requested) return requested;
  return (await getDefaultWhatsAppWorkspace())?.id || null;
}

export async function findWhatsAppTeamMemberByEmail(
  email: string | null | undefined,
  options: { activeOnly?: boolean; workspaceId?: string | null } = {},
): Promise<WhatsAppTeamMember | null> {
  const config = getConfig();
  const normalizedEmail = normalizeWhatsAppTeamEmail(email);
  const workspaceId = await resolveWorkspaceId(options.workspaceId);
  if (!config || !normalizedEmail || !workspaceId) return null;

  const query = new URLSearchParams({
    select: "id,workspace_id,user_id,google_email,display_name,role,availability,active,google_user_id,last_seen_at,created_at,updated_at",
    google_email: `eq.${normalizedEmail}`,
    workspace_id: `eq.${workspaceId}`,
    limit: "1",
  });
  if (options.activeOnly !== false) query.set("active", "eq.true");

  try {
    const response = await fetch(`${config.url}/rest/v1/whatsapp_team_members?${query.toString()}`, {
      headers: headers(config), cache: "no-store",
    });
    if (!response.ok) return null;
    const rows = await response.json() as Array<Record<string, unknown>>;
    return rows[0] ? normalizeWhatsAppTeamMember(rows[0]) : null;
  } catch { return null; }
}

export async function isWhatsAppTeamEmailAllowed(email: string | null | undefined, workspaceId?: string | null) {
  return Boolean(await findWhatsAppTeamMemberByEmail(email, { activeOnly: true, workspaceId }));
}

export async function bindWhatsAppTeamGoogleIdentity(input: { email: string; googleUserId: string }) {
  const config = getConfig();
  const email = normalizeWhatsAppTeamEmail(input.email);
  if (!config || !email || !input.googleUserId.trim()) return false;
  const now = new Date().toISOString();
  try {
    const [usersResponse, membersResponse] = await Promise.all([
      fetch(`${config.url}/rest/v1/whatsapp_platform_users?email=eq.${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: headers(config, { "Content-Type": "application/json", Prefer: "return=minimal" }),
        body: JSON.stringify({ google_user_id: input.googleUserId.trim(), updated_at: now }), cache: "no-store",
      }),
      fetch(`${config.url}/rest/v1/whatsapp_team_members?google_email=eq.${encodeURIComponent(email)}&active=eq.true`, {
        method: "PATCH",
        headers: headers(config, { "Content-Type": "application/json", Prefer: "return=minimal" }),
        body: JSON.stringify({ google_user_id: input.googleUserId.trim(), last_seen_at: now, updated_at: now }), cache: "no-store",
      }),
    ]);
    return usersResponse.ok && membersResponse.ok;
  } catch { return false; }
}

export async function ensureWhatsAppOwnerTeamMember(input: {
  email: string;
  displayName?: string | null;
  workspaceId?: string | null;
}): Promise<WhatsAppTeamMember | null> {
  const email = normalizeWhatsAppTeamEmail(input.email);
  const workspaceId = await resolveWorkspaceId(input.workspaceId);
  if (!email || !workspaceId) return null;
  const existing = await findWhatsAppTeamMemberByEmail(email, { activeOnly: false, workspaceId });
  if (existing?.active && existing.role === "owner") return existing;

  const row = await ensureWhatsAppWorkspaceMembership({
    workspaceId,
    email,
    displayName: input.displayName?.trim() || "Web Growth Owner",
    role: "owner",
    createdByEmail: email,
  });
  return row ? normalizeWhatsAppTeamMember(row) : null;
}
