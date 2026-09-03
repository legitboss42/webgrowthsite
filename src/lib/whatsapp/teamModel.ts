export const WHATSAPP_TEAM_ROLES = ["owner", "manager", "agent"] as const;
export const WHATSAPP_TEAM_AVAILABILITY = ["available", "busy", "offline"] as const;

export type WhatsAppTeamRole = (typeof WHATSAPP_TEAM_ROLES)[number];
export type WhatsAppTeamAvailability = (typeof WHATSAPP_TEAM_AVAILABILITY)[number];

export type WhatsAppTeamMember = {
  id: string;
  workspaceId?: string | null;
  userId?: string | null;
  googleEmail: string;
  displayName: string;
  role: WhatsAppTeamRole;
  availability: WhatsAppTeamAvailability;
  active: boolean;
  googleUserId?: string | null;
  lastSeenAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export function normalizeWhatsAppTeamEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidWhatsAppTeamEmail(value: unknown) {
  const email = normalizeWhatsAppTeamEmail(value);
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeWhatsAppTeamRole(value: unknown): WhatsAppTeamRole | null {
  return WHATSAPP_TEAM_ROLES.includes(value as WhatsAppTeamRole) ? value as WhatsAppTeamRole : null;
}

export function normalizeWhatsAppTeamAvailability(value: unknown): WhatsAppTeamAvailability | null {
  return WHATSAPP_TEAM_AVAILABILITY.includes(value as WhatsAppTeamAvailability) ? value as WhatsAppTeamAvailability : null;
}

export function normalizeWhatsAppTeamMember(row: Record<string, unknown>): WhatsAppTeamMember {
  return {
    id: String(row.id || ""),
    workspaceId: typeof row.workspace_id === "string" ? row.workspace_id : null,
    userId: typeof row.user_id === "string" ? row.user_id : null,
    googleEmail: normalizeWhatsAppTeamEmail(row.google_email),
    displayName: typeof row.display_name === "string" && row.display_name.trim() ? row.display_name.trim() : normalizeWhatsAppTeamEmail(row.google_email),
    role: normalizeWhatsAppTeamRole(row.role) || "agent",
    availability: normalizeWhatsAppTeamAvailability(row.availability) || "offline",
    active: row.active === true,
    googleUserId: typeof row.google_user_id === "string" ? row.google_user_id : null,
    lastSeenAt: typeof row.last_seen_at === "string" ? row.last_seen_at : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

export function getWhatsAppPresenceLabel(availability: WhatsAppTeamAvailability) {
  if (availability === "available") return "Online";
  if (availability === "busy") return "Away";
  return "Offline";
}

export function isWhatsAppTeamMemberAssignable(member: Pick<WhatsAppTeamMember, "active" | "availability">) {
  return member.active && member.availability === "available";
}

export function canWhatsAppRoleManageTeam(role: WhatsAppTeamRole) { return role === "owner"; }
export function canWhatsAppRoleSuperviseTeam(role: WhatsAppTeamRole) { return role === "owner" || role === "manager"; }
export function canWhatsAppRoleViewAllConversations(role: WhatsAppTeamRole) { return role === "owner" || role === "manager"; }
