export type WhatsAppSettingsRoute = {
  href: string;
  label: string;
  description: string;
};

export const WHATSAPP_WORKSPACE_SETTINGS_ROUTES: WhatsAppSettingsRoute[] = [
  { href: "/admin/whatsapp/settings/", label: "General", description: "Business identity, operating hours and core workspace preferences." },
  { href: "/admin/whatsapp/settings/whatsapp/", label: "WhatsApp", description: "Connection, number, webhook and calling configuration." },
  { href: "/admin/whatsapp/settings/inbox/", label: "Inbox", description: "Messaging visibility, refresh, window warnings and conversation behaviour." },
  { href: "/admin/whatsapp/settings/crm/", label: "CRM", description: "Lead classification, defaults and contact handling." },
  { href: "/admin/whatsapp/settings/team/", label: "Team", description: "Members, assignment and workspace access." },
  { href: "/admin/whatsapp/settings/notifications/", label: "Notifications", description: "In-app, push and operational notification preferences." },
  { href: "/admin/whatsapp/settings/automations/", label: "Automations", description: "Runtime defaults, no-reply behaviour and failure handling." },
  { href: "/admin/whatsapp/settings/ai/", label: "AI", description: "AI Assist, Agents, budgets, models and safety controls." },
  { href: "/admin/whatsapp/settings/campaigns/", label: "Campaigns", description: "Campaign sending defaults, limits and opt-out handling." },
  { href: "/admin/whatsapp/settings/integrations/", label: "Integrations", description: "Webhooks, API access and external integration status." },
  { href: "/admin/whatsapp/settings/security/", label: "Security", description: "Password, sessions, sensitive actions and account security." },
  { href: "/admin/whatsapp/settings/data/", label: "Data", description: "Retention, export, deletion and privacy controls." },
];

export const WHATSAPP_PLATFORM_SETTINGS_ROUTES: WhatsAppSettingsRoute[] = [
  { href: "/admin/whatsapp/platform/settings/", label: "General", description: "Platform identity, support and maintenance controls." },
  { href: "/admin/whatsapp/platform/settings/workspaces/", label: "Workspaces", description: "Workspace lifecycle and onboarding defaults." },
  { href: "/admin/whatsapp/platform/settings/plans/", label: "Plans", description: "Plan limits and entitlement defaults." },
  { href: "/admin/whatsapp/platform/settings/meta/", label: "Meta", description: "Global Meta and WhatsApp infrastructure health." },
  { href: "/admin/whatsapp/platform/settings/email/", label: "Email", description: "Transactional and security email controls." },
  { href: "/admin/whatsapp/platform/settings/ai/", label: "AI", description: "Global provider, model, usage and emergency controls." },
  { href: "/admin/whatsapp/platform/settings/security/", label: "Security", description: "Platform-admin and sensitive-operation controls." },
  { href: "/admin/whatsapp/platform/settings/system/", label: "System", description: "Runtime health, processors and operational monitoring." },
  { href: "/admin/whatsapp/platform/settings/audit/", label: "Audit", description: "Platform-level activity and security audit visibility." },
  { href: "/admin/whatsapp/platform/settings/features/", label: "Features", description: "Feature flags and controlled rollout state." },
  { href: "/admin/whatsapp/platform/settings/commercial/", label: "Commercial", description: "Billing readiness, trials and grace-period defaults." },
];
