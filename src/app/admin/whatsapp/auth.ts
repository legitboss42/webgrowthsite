import {
  getDefaultAdminGoogleEmail,
  isAllowedGoogleAdminEmail,
  isGoogleAdminSession,
  readGoogleAuthSessionFromCookieStore,
} from "@/lib/googleAuth";
import { isOwnerOpenId } from "@/lib/scheduler/config";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { readWorkspacePasswordSessionFromCookieStore } from "@/lib/whatsapp/passwordAuth";
import { ensureWhatsAppOwnerTeamMember, findWhatsAppTeamMemberByEmail } from "@/lib/whatsapp/teamAccess";
import { canWhatsAppRoleSuperviseTeam, type WhatsAppTeamRole } from "@/lib/whatsapp/teamModel";
import { enterWhatsAppWorkspace } from "@/lib/whatsapp/workspaceContext";
import { isWhatsAppWorkspaceId, WHATSAPP_WORKSPACE_COOKIE, type WhatsAppWorkspace } from "@/lib/whatsapp/workspaceModel";
import { isWhatsAppPlatformAdmin, resolveWhatsAppWorkspaceForIdentity } from "@/lib/whatsapp/workspaces";
import { readWhatsAppRows } from "./data";

type CookieValue = { value?: string } | undefined;
type CookieStoreLike = { get(name: string): CookieValue };

export type WhatsAppWorkspaceAccess = {
  role: WhatsAppTeamRole;
  memberId: string | null;
  email: string;
  displayName: string;
  source: "google" | "password" | "scheduler";
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  workspaceStatus: "ACTIVE" | "SUSPENDED";
  platformAdmin: boolean;
  availableWorkspaces: WhatsAppWorkspace[];
};

/**
 * Legacy synchronous Owner gate. New code should use getWhatsAppWorkspaceAccess.
 * A password Owner is accepted only when the signed workspace id exactly matches the
 * active workspace cookie, preventing a role from being carried across tenants.
 */
export function hasWhatsAppAdminAccess(cookieStore: CookieStoreLike) {
  try { if (isGoogleAdminSession(readGoogleAuthSessionFromCookieStore(cookieStore))) return true; } catch {}
  try {
    const passwordSession = readWorkspacePasswordSessionFromCookieStore(cookieStore);
    if (passwordSession && isAllowedGoogleAdminEmail(passwordSession.email)) return true;
    const selectedWorkspaceId = cookieStore.get(WHATSAPP_WORKSPACE_COOKIE)?.value?.trim() || "";
    if (
      passwordSession?.workspaceRole === "owner" &&
      isWhatsAppWorkspaceId(passwordSession.workspaceId) &&
      selectedWorkspaceId === passwordSession.workspaceId
    ) return true;
  } catch {}
  const schedulerCookie = cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value;
  if (!schedulerCookie) return false;
  try { const schedulerSession = readSchedulerSession(schedulerCookie); return Boolean(schedulerSession && isOwnerOpenId(schedulerSession.openId)); } catch { return false; }
}

async function resolveIdentityWorkspace(input: { email: string; displayName: string; source: WhatsAppWorkspaceAccess["source"]; cookieStore: CookieStoreLike; configuredPlatformAdmin?: boolean }): Promise<WhatsAppWorkspaceAccess | null> {
  const platformAdmin = input.configuredPlatformAdmin === true || await isWhatsAppPlatformAdmin(input.email);
  const resolved = await resolveWhatsAppWorkspaceForIdentity({ email: input.email, platformAdmin, cookieStore: input.cookieStore });
  if (!resolved) return null;
  const { workspace, workspaces } = resolved;
  if (workspace.status !== "ACTIVE" && !platformAdmin) return null;
  let member = await findWhatsAppTeamMemberByEmail(input.email, { activeOnly: true, workspaceId: workspace.id });
  if (platformAdmin && workspace.isPlatformOwned && !member) member = await ensureWhatsAppOwnerTeamMember({ email: input.email, displayName: input.displayName, workspaceId: workspace.id });
  if (!platformAdmin && !member) return null;

  enterWhatsAppWorkspace(workspace.id);

  return { role: platformAdmin ? "owner" : member!.role, memberId: member?.id || null, email: input.email, displayName: member?.displayName || input.displayName || input.email, source: input.source, workspaceId: workspace.id, workspaceSlug: workspace.slug, workspaceName: workspace.name, workspaceStatus: workspace.status, platformAdmin, availableWorkspaces: workspaces };
}

export async function getWhatsAppWorkspaceAccess(cookieStore: CookieStoreLike): Promise<WhatsAppWorkspaceAccess | null> {
  try {
    const googleSession = readGoogleAuthSessionFromCookieStore(cookieStore);
    if (googleSession) return await resolveIdentityWorkspace({ email: googleSession.email, displayName: googleSession.fullName || googleSession.email, source: "google", cookieStore, configuredPlatformAdmin: isGoogleAdminSession(googleSession) });
  } catch {}
  try {
    const passwordSession = readWorkspacePasswordSessionFromCookieStore(cookieStore);
    if (passwordSession) return await resolveIdentityWorkspace({ email: passwordSession.email, displayName: passwordSession.fullName || passwordSession.email, source: "password", cookieStore, configuredPlatformAdmin: isAllowedGoogleAdminEmail(passwordSession.email) });
  } catch {}
  const schedulerCookie = cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value;
  if (!schedulerCookie) return null;
  try {
    const schedulerSession = readSchedulerSession(schedulerCookie);
    if (!schedulerSession || !isOwnerOpenId(schedulerSession.openId)) return null;
    const email = getDefaultAdminGoogleEmail();
    return await resolveIdentityWorkspace({ email, displayName: "Web Growth Owner", source: "scheduler", cookieStore, configuredPlatformAdmin: true });
  } catch { return null; }
}

export async function hasWhatsAppWorkspaceAccess(cookieStore: CookieStoreLike) { return Boolean(await getWhatsAppWorkspaceAccess(cookieStore)); }
export async function hasWhatsAppSupervisorAccess(cookieStore: CookieStoreLike) { const access = await getWhatsAppWorkspaceAccess(cookieStore); return Boolean(access && canWhatsAppRoleSuperviseTeam(access.role)); }
export async function hasWhatsAppPlatformAdminAccess(cookieStore: CookieStoreLike) { const access = await getWhatsAppWorkspaceAccess(cookieStore); return access?.platformAdmin === true; }

export async function canWhatsAppAccessConversation(access: WhatsAppWorkspaceAccess, conversationId: string, options: { allowUnassigned?: boolean } = {}) {
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_conversations?id=eq.${encodeURIComponent(conversationId.trim())}&select=assigned_member_id&limit=1`, { workspaceId: access.workspaceId });
  const row = rows?.[0]; if (!row) return false;
  if (canWhatsAppRoleSuperviseTeam(access.role)) return true;
  if (!access.memberId || !conversationId.trim()) return false;
  if (row.assigned_member_id === access.memberId) return true;
  return options.allowUnassigned === true && !row.assigned_member_id;
}
