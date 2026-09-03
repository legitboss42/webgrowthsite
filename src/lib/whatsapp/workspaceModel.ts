export const WHATSAPP_WORKSPACE_COOKIE = "wg_whatsapp_workspace";
export const WHATSAPP_DEFAULT_WORKSPACE_SLUG = "web-growth";

export const WHATSAPP_WORKSPACE_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
export type WhatsAppWorkspaceStatus = (typeof WHATSAPP_WORKSPACE_STATUSES)[number];

export type WhatsAppWorkspace = {
  id: string;
  slug: string;
  name: string;
  status: WhatsAppWorkspaceStatus;
  planCode: string;
  isPlatformOwned: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type WhatsAppWorkspaceEntitlements = {
  workspaceId: string;
  planCode: string;
  maxTeamMembers: number;
  maxAutomations: number;
  maxCampaignRecipientsMonthly: number;
  maxAiRequestsDaily: number;
  features: Record<string, unknown>;
};

export type WhatsAppWorkspaceConnection = {
  workspaceId: string;
  wabaId?: string | null;
  phoneNumberId?: string | null;
  displayPhoneNumber?: string | null;
  businessName?: string | null;
  status: "NOT_CONFIGURED" | "CONNECTED" | "NEEDS_ATTENTION" | "DISABLED";
  credentialSource: "ENV" | "ENCRYPTED_DB";
  encryptedAccessToken?: string | null;
  tokenLastFour?: string | null;
  apiVersion: string;
  connectedAt?: string | null;
  lastVerifiedAt?: string | null;
};

export const WHATSAPP_TENANT_TABLES = new Set([
  "whatsapp_contacts",
  "whatsapp_conversations",
  "whatsapp_events",
  "whatsapp_messages",
  "whatsapp_quick_replies",
  "whatsapp_settings",
  "whatsapp_calls",
  "whatsapp_team_members",
  "whatsapp_team_activity",
  "whatsapp_internal_notes",
  "whatsapp_note_mentions",
  "whatsapp_conversation_presence",
  "whatsapp_conversation_inbox_state",
  "whatsapp_template_drafts",
  "whatsapp_automations",
  "whatsapp_automation_runs",
  "whatsapp_automation_jobs",
  "whatsapp_automation_events",
  "whatsapp_segments",
  "whatsapp_campaigns",
  "whatsapp_campaign_recipients",
  "whatsapp_campaign_events",
  "whatsapp_flows",
  "whatsapp_flow_versions",
  "whatsapp_flow_submissions",
  "whatsapp_flow_events",
  "whatsapp_ai_settings",
  "whatsapp_ai_knowledge_sources",
  "whatsapp_ai_knowledge_chunks",
  "whatsapp_ai_agents",
  "whatsapp_ai_runs",
  "whatsapp_ai_actions",
  "whatsapp_ai_usage",
  "whatsapp_push_subscriptions",
  "whatsapp_push_deliveries",
]);

export function isWhatsAppWorkspaceId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

export function normalizeWhatsAppWorkspaceSlug(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export function normalizeWhatsAppWorkspace(row: Record<string, unknown>): WhatsAppWorkspace {
  return {
    id: String(row.id || ""),
    slug: normalizeWhatsAppWorkspaceSlug(row.slug),
    name: typeof row.name === "string" && row.name.trim() ? row.name.trim() : "Workspace",
    status: row.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
    planCode: typeof row.plan_code === "string" && row.plan_code.trim() ? row.plan_code.trim() : "FREE",
    isPlatformOwned: row.is_platform_owned === true,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

export function normalizeWhatsAppWorkspaceConnection(row: Record<string, unknown>): WhatsAppWorkspaceConnection {
  const status = new Set(["NOT_CONFIGURED", "CONNECTED", "NEEDS_ATTENTION", "DISABLED"]).has(String(row.status))
    ? String(row.status) as WhatsAppWorkspaceConnection["status"]
    : "NOT_CONFIGURED";
  return {
    workspaceId: String(row.workspace_id || ""),
    wabaId: typeof row.waba_id === "string" ? row.waba_id : null,
    phoneNumberId: typeof row.phone_number_id === "string" ? row.phone_number_id : null,
    displayPhoneNumber: typeof row.display_phone_number === "string" ? row.display_phone_number : null,
    businessName: typeof row.business_name === "string" ? row.business_name : null,
    status,
    credentialSource: row.credential_source === "ENCRYPTED_DB" ? "ENCRYPTED_DB" : "ENV",
    encryptedAccessToken: typeof row.encrypted_access_token === "string" ? row.encrypted_access_token : null,
    tokenLastFour: typeof row.token_last_four === "string" ? row.token_last_four : null,
    apiVersion: typeof row.api_version === "string" && row.api_version.trim() ? row.api_version.trim() : "v26.0",
    connectedAt: typeof row.connected_at === "string" ? row.connected_at : null,
    lastVerifiedAt: typeof row.last_verified_at === "string" ? row.last_verified_at : null,
  };
}

function splitRestPath(pathAndQuery: string) {
  const queryIndex = pathAndQuery.indexOf("?");
  if (queryIndex < 0) return { path: pathAndQuery, query: "" };
  return { path: pathAndQuery.slice(0, queryIndex), query: pathAndQuery.slice(queryIndex + 1) };
}

export function getWhatsAppRestTable(pathAndQuery: string) {
  const { path } = splitRestPath(pathAndQuery);
  return decodeURIComponent(path.replace(/^\/+/, "").split("/", 1)[0] || "");
}

export function scopeWhatsAppRestPath(pathAndQuery: string, workspaceId: string | null | undefined) {
  if (!isWhatsAppWorkspaceId(workspaceId)) return pathAndQuery;
  const table = getWhatsAppRestTable(pathAndQuery);
  if (!WHATSAPP_TENANT_TABLES.has(table)) return pathAndQuery;
  const { path, query } = splitRestPath(pathAndQuery);
  if (/(^|&)workspace_id=/.test(query)) return pathAndQuery;
  const workspaceFilter = `workspace_id=eq.${encodeURIComponent(workspaceId)}`;
  return `${path}?${query ? `${query}&` : ""}${workspaceFilter}`;
}

export function applyWhatsAppWorkspaceToBody(body: unknown, workspaceId: string | null | undefined) {
  if (!isWhatsAppWorkspaceId(workspaceId) || body == null) return body;
  if (Array.isArray(body)) {
    return body.map((row) => row && typeof row === "object" && !Array.isArray(row)
      ? { ...(row as Record<string, unknown>), workspace_id: workspaceId }
      : row);
  }
  if (typeof body === "object") return { ...(body as Record<string, unknown>), workspace_id: workspaceId };
  return body;
}
