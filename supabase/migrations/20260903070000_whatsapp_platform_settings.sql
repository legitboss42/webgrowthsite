create table if not exists public.whatsapp_platform_settings (
  id text primary key default 'global',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by_email text
);

alter table public.whatsapp_platform_settings enable row level security;

comment on table public.whatsapp_platform_settings is 'Global Web Growth WhatsApp platform settings. Server-only service-role access; platform admin UI is application-authorized.';

insert into public.whatsapp_platform_settings (id, settings)
values (
  'global',
  jsonb_build_object(
    'general', jsonb_build_object('platformName', 'Web Growth WhatsApp', 'supportEmail', 'admin@webgrowth.info', 'supportPhone', '', 'defaultTimezone', 'Africa/Lagos', 'maintenanceMode', false),
    'email', jsonb_build_object('senderName', 'Web Growth', 'securityNotifications', true, 'workspaceInvitations', true, 'onboardingEmails', true),
    'ai', jsonb_build_object('enabled', false, 'emergencyKillSwitch', false, 'defaultDailyRequestLimit', 0, 'defaultMonthlyBudgetUsd', 0),
    'security', jsonb_build_object('requireTwoFactorForPlatformAdmins', false, 'sensitiveActionConfirmation', true, 'sessionAuditEnabled', true),
    'system', jsonb_build_object('metaWebhookMonitoring', true, 'databaseHealthMonitoring', true, 'automationHealthMonitoring', true),
    'commercial', jsonb_build_object('billingEnabled', false, 'trialDays', 14, 'gracePeriodDays', 7)
  )
)
on conflict (id) do nothing;
