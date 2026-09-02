import {
  getDefaultAdminGoogleEmail,
  isAllowedGoogleAdminEmail,
  isGoogleAdminSession,
  readGoogleAuthSessionFromCookieStore,
} from "@/lib/googleAuth";
import { isOwnerOpenId } from "@/lib/scheduler/config";
import {
  readSchedulerSession,
  SCHEDULER_SESSION_COOKIE,
} from "@/lib/scheduler/session";
import { readWorkspacePasswordSessionFromCookieStore } from "@/lib/whatsapp/passwordAuth";
import {
  ensureWhatsAppOwnerTeamMember,
  findWhatsAppTeamMemberByEmail,
} from "@/lib/whatsapp/teamAccess";
import {
  canWhatsAppRoleSuperviseTeam,
  type WhatsAppTeamRole,
} from "@/lib/whatsapp/teamModel";
import { readWhatsAppRows } from "./data";

type CookieValue = { value?: string } | undefined;

type CookieStoreLike = {
  get(name: string): CookieValue;
};

export type WhatsAppWorkspaceAccess = {
  role: WhatsAppTeamRole;
  memberId: string | null;
  email: string;
  displayName: string;
  source: "google" | "password" | "scheduler";
};

/**
 * Legacy owner/admin gate retained for platform-critical settings and other surfaces
 * that are intentionally not opened to team members.
 */
export function hasWhatsAppAdminAccess(cookieStore: CookieStoreLike) {
  try {
    if (isGoogleAdminSession(readGoogleAuthSessionFromCookieStore(cookieStore))) return true;
  } catch {
    // Fall through to the password and scheduler owner gates.
  }

  try {
    const passwordSession = readWorkspacePasswordSessionFromCookieStore(cookieStore);
    if (passwordSession && isAllowedGoogleAdminEmail(passwordSession.email)) return true;
  } catch {
    // Fall through to the scheduler-owner gate.
  }

  const schedulerCookie = cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value;
  if (!schedulerCookie) return false;

  try {
    const schedulerSession = readSchedulerSession(schedulerCookie);
    return Boolean(schedulerSession && isOwnerOpenId(schedulerSession.openId));
  } catch {
    return false;
  }
}

/**
 * Role-aware gate for the WhatsApp workspace.
 *
 * Invited Managers and Agents are checked against Supabase on every request. An
 * inactive row therefore loses access immediately even when a sealed auth cookie
 * is still present. The configured owner remains the ultimate recovery path and is
 * mirrored into the team table so "Mine" and assignment work for the owner too.
 */
export async function getWhatsAppWorkspaceAccess(
  cookieStore: CookieStoreLike,
): Promise<WhatsAppWorkspaceAccess | null> {
  try {
    const googleSession = readGoogleAuthSessionFromCookieStore(cookieStore);
    if (googleSession) {
      if (isGoogleAdminSession(googleSession)) {
        const ownerMember = await ensureWhatsAppOwnerTeamMember({
          email: googleSession.email,
          displayName: googleSession.fullName,
        });
        return {
          role: "owner",
          memberId: ownerMember?.id || null,
          email: googleSession.email,
          displayName: ownerMember?.displayName || googleSession.fullName || googleSession.email,
          source: "google",
        };
      }

      const member = await findWhatsAppTeamMemberByEmail(googleSession.email, {
        activeOnly: true,
      });
      if (member) {
        return {
          role: member.role,
          memberId: member.id,
          email: member.googleEmail,
          displayName: member.displayName,
          source: "google",
        };
      }
    }
  } catch {
    // Fail closed for Google identities, then try password access.
  }

  try {
    const passwordSession = readWorkspacePasswordSessionFromCookieStore(cookieStore);
    if (passwordSession) {
      if (isAllowedGoogleAdminEmail(passwordSession.email)) {
        const ownerMember = await ensureWhatsAppOwnerTeamMember({
          email: passwordSession.email,
          displayName: passwordSession.fullName,
        });
        return {
          role: "owner",
          memberId: ownerMember?.id || null,
          email: passwordSession.email,
          displayName: ownerMember?.displayName || passwordSession.fullName || passwordSession.email,
          source: "password",
        };
      }

      const member = await findWhatsAppTeamMemberByEmail(passwordSession.email, {
        activeOnly: true,
      });
      if (member) {
        return {
          role: member.role,
          memberId: member.id,
          email: member.googleEmail,
          displayName: member.displayName,
          source: "password",
        };
      }
    }
  } catch {
    // Fail closed, then try the independent owner gate below.
  }

  const schedulerCookie = cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value;
  if (!schedulerCookie) return null;

  try {
    const schedulerSession = readSchedulerSession(schedulerCookie);
    if (!schedulerSession || !isOwnerOpenId(schedulerSession.openId)) return null;

    const email = getDefaultAdminGoogleEmail();
    const ownerMember = await ensureWhatsAppOwnerTeamMember({
      email,
      displayName: "Web Growth Owner",
    });
    return {
      role: "owner",
      memberId: ownerMember?.id || null,
      email,
      displayName: ownerMember?.displayName || "Web Growth Owner",
      source: "scheduler",
    };
  } catch {
    return null;
  }
}

export async function hasWhatsAppWorkspaceAccess(cookieStore: CookieStoreLike) {
  return Boolean(await getWhatsAppWorkspaceAccess(cookieStore));
}

export async function hasWhatsAppSupervisorAccess(cookieStore: CookieStoreLike) {
  const access = await getWhatsAppWorkspaceAccess(cookieStore);
  return Boolean(access && canWhatsAppRoleSuperviseTeam(access.role));
}

/**
 * Conversation authorization used by reply mutations. Supervisors can work any
 * thread. Agents must own the conversation; merely knowing a conversation UUID is
 * not enough to send as the business.
 */
export async function canWhatsAppAccessConversation(
  access: WhatsAppWorkspaceAccess,
  conversationId: string,
  options: { allowUnassigned?: boolean } = {},
) {
  if (canWhatsAppRoleSuperviseTeam(access.role)) return true;
  if (!access.memberId || !conversationId.trim()) return false;

  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_conversations?id=eq.${encodeURIComponent(conversationId.trim())}&select=assigned_member_id&limit=1`,
  );
  const row = rows?.[0];
  if (!row) return false;
  if (row.assigned_member_id === access.memberId) return true;
  return options.allowUnassigned === true && !row.assigned_member_id;
}
