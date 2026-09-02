-- Stage 11: convert the WhatsApp BSP from a single-business workspace into a tenant-safe SaaS foundation.
-- Existing production data is preserved and backfilled into the Web Growth workspace.

create table if not exists public.whatsapp_workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED')),
  plan_code text not null default 'FREE',
  is_platform_owned boolean not null default false,
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$')
);
alter table public.whatsapp_workspaces enable row level security;
comment on table public.whatsapp_workspaces is 'Stage 11 tenant/workspace registry. Server-only service-role access.';

insert into public.whatsapp_workspaces (slug, name, status, plan_code, is_platform_owned, created_by_email)
values ('web-growth', 'Web Growth', 'ACTIVE', 'INTERNAL', true, 'vickysaintbrown02@gmail.com')
on conflict (slug) do update set name = excluded.name, is_platform_owned = true, updated_at = now();

create table if not exists public.whatsapp_platform_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  display_name text not null,
  google_user_id text,
  platform_role text not null default 'USER' check (platform_role in ('USER','ADMIN')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.whatsapp_platform_users enable row level security;
comment on table public.whatsapp_platform_users is 'Platform identities shared across workspace memberships. whatsapp_team_members remains the workspace membership/role row.';

insert into public.whatsapp_platform_users (email, display_name, google_user_id, platform_role, active)
select lower(google_email), max(display_name), max(google_user_id),
       case when lower(google_email) = 'vickysaintbrown02@gmail.com' then 'ADMIN' else 'USER' end,
       bool_or(active)
from public.whatsapp_team_members
group by lower(google_email)
on conflict (email) do update set
  display_name = excluded.display_name,
  google_user_id = coalesce(excluded.google_user_id, public.whatsapp_platform_users.google_user_id),
  platform_role = case when public.whatsapp_platform_users.platform_role = 'ADMIN' then 'ADMIN' else excluded.platform_role end,
  active = excluded.active,
  updated_at = now();

create table if not exists public.whatsapp_workspace_connections (
  workspace_id uuid primary key references public.whatsapp_workspaces(id) on delete restrict,
  waba_id text,
  phone_number_id text unique,
  display_phone_number text,
  business_name text,
  status text not null default 'NOT_CONFIGURED' check (status in ('NOT_CONFIGURED','CONNECTED','NEEDS_ATTENTION','DISABLED')),
  credential_source text not null default 'ENV' check (credential_source in ('ENV','ENCRYPTED_DB')),
  encrypted_access_token text,
  token_last_four text,
  api_version text not null default 'v26.0',
  connected_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((credential_source = 'ENV') or (encrypted_access_token is not null))
);
alter table public.whatsapp_workspace_connections enable row level security;
comment on table public.whatsapp_workspace_connections is 'Per-workspace Meta WhatsApp connection metadata. ENCRYPTED_DB tokens are ciphertext only; Web Growth may continue to use environment secrets.';

insert into public.whatsapp_workspace_connections (workspace_id, waba_id, phone_number_id, business_name, status, credential_source, api_version)
select id, '987693860957754', '1192139290658384', 'Web Growth', 'CONNECTED', 'ENV', 'v26.0'
from public.whatsapp_workspaces where slug = 'web-growth'
on conflict (workspace_id) do update set
  waba_id = coalesce(public.whatsapp_workspace_connections.waba_id, excluded.waba_id),
  phone_number_id = coalesce(public.whatsapp_workspace_connections.phone_number_id, excluded.phone_number_id),
  business_name = coalesce(public.whatsapp_workspace_connections.business_name, excluded.business_name),
  updated_at = now();

create table if not exists public.whatsapp_workspace_entitlements (
  workspace_id uuid primary key references public.whatsapp_workspaces(id) on delete restrict,
  plan_code text not null default 'FREE',
  max_team_members integer not null default 3 check (max_team_members >= 1),
  max_automations integer not null default 5 check (max_automations >= 0),
  max_campaign_recipients_monthly integer not null default 500 check (max_campaign_recipients_monthly >= 0),
  max_ai_requests_daily integer not null default 0 check (max_ai_requests_daily >= 0),
  features jsonb not null default '{}'::jsonb check (jsonb_typeof(features) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.whatsapp_workspace_entitlements enable row level security;

insert into public.whatsapp_workspace_entitlements (workspace_id, plan_code, max_team_members, max_automations, max_campaign_recipients_monthly, max_ai_requests_daily, features)
select id, 'INTERNAL', 100, 1000, 1000000, 10000, '{"platformAdmin":true}'::jsonb
from public.whatsapp_workspaces where slug = 'web-growth'
on conflict (workspace_id) do nothing;

-- Tenant-owned tables. Runtime infrastructure tables (processor configs and VAPID config)
-- remain platform-global because they describe the shared worker infrastructure, not client data.
do $$
declare
  t text;
  default_workspace uuid;
  tenant_tables text[] := array[
    'whatsapp_contacts','whatsapp_conversations','whatsapp_events','whatsapp_messages',
    'whatsapp_quick_replies','whatsapp_settings','whatsapp_calls','whatsapp_team_members',
    'whatsapp_team_activity','whatsapp_internal_notes','whatsapp_note_mentions',
    'whatsapp_conversation_presence','whatsapp_conversation_inbox_state',
    'whatsapp_template_drafts','whatsapp_automations','whatsapp_automation_runs',
    'whatsapp_automation_jobs','whatsapp_automation_events','whatsapp_segments',
    'whatsapp_campaigns','whatsapp_campaign_recipients','whatsapp_campaign_events',
    'whatsapp_flows','whatsapp_flow_versions','whatsapp_flow_submissions','whatsapp_flow_events',
    'whatsapp_ai_settings','whatsapp_ai_knowledge_sources','whatsapp_ai_knowledge_chunks',
    'whatsapp_ai_agents','whatsapp_ai_runs','whatsapp_ai_actions','whatsapp_ai_usage',
    'whatsapp_push_subscriptions','whatsapp_push_deliveries'
  ];
begin
  select id into default_workspace from public.whatsapp_workspaces where slug = 'web-growth';
  if default_workspace is null then raise exception 'Web Growth workspace seed is missing'; end if;

  foreach t in array tenant_tables loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I add column if not exists workspace_id uuid', t);
      execute format('update public.%I set workspace_id = $1 where workspace_id is null', t) using default_workspace;
      execute format('alter table public.%I alter column workspace_id set not null', t);
      if not exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.' || t)
          and conname = t || '_workspace_id_fkey'
      ) then
        execute format('alter table public.%I add constraint %I foreign key (workspace_id) references public.whatsapp_workspaces(id) on delete restrict', t, t || '_workspace_id_fkey');
      end if;
      execute format('create index if not exists %I on public.%I (workspace_id)', t || '_workspace_idx', t);
    end if;
  end loop;
end $$;

-- Platform identity -> membership link. Existing membership IDs remain untouched so all
-- assignment/note/audit foreign keys continue to point at the same rows.
alter table public.whatsapp_team_members add column if not exists user_id uuid;
update public.whatsapp_team_members m
set user_id = u.id
from public.whatsapp_platform_users u
where u.email = lower(m.google_email) and m.user_id is null;
alter table public.whatsapp_team_members alter column user_id set not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_team_members_user_id_fkey') then
    alter table public.whatsapp_team_members add constraint whatsapp_team_members_user_id_fkey foreign key (user_id) references public.whatsapp_platform_users(id) on delete restrict;
  end if;
end $$;
create index if not exists whatsapp_team_members_user_idx on public.whatsapp_team_members (user_id);

alter table public.whatsapp_team_members drop constraint if exists whatsapp_team_members_google_email_key;
alter table public.whatsapp_team_members add constraint whatsapp_team_members_workspace_email_key unique (workspace_id, google_email);

alter table public.whatsapp_contacts drop constraint if exists whatsapp_contacts_wa_id_key;
alter table public.whatsapp_contacts add constraint whatsapp_contacts_workspace_wa_id_key unique (workspace_id, wa_id);

-- Settings are one row PER workspace, not one row for the whole platform.
alter table public.whatsapp_settings drop constraint if exists whatsapp_settings_pkey;
alter table public.whatsapp_settings add constraint whatsapp_settings_pkey primary key (workspace_id, id);

alter table public.whatsapp_ai_settings drop constraint if exists whatsapp_ai_settings_pkey;
alter table public.whatsapp_ai_settings add constraint whatsapp_ai_settings_pkey primary key (workspace_id, id);

-- Replace Stage 10's temporary text scope with the real workspace boundary while leaving
-- the compatibility column in place until every old deployment is gone.
update public.whatsapp_ai_knowledge_sources set workspace_scope = workspace_id::text where workspace_scope = 'default';
update public.whatsapp_ai_agents set workspace_scope = workspace_id::text where workspace_scope = 'default';
update public.whatsapp_ai_runs set workspace_scope = workspace_id::text where workspace_scope = 'default';
update public.whatsapp_ai_usage set workspace_scope = workspace_id::text where workspace_scope = 'default';

-- Composite parent keys + critical workspace-matching foreign keys. These prevent an
-- accidental server bug from linking a child row in one tenant to a parent in another.
create unique index if not exists whatsapp_contacts_id_workspace_uq on public.whatsapp_contacts (id, workspace_id);
create unique index if not exists whatsapp_conversations_id_workspace_uq on public.whatsapp_conversations (id, workspace_id);
create unique index if not exists whatsapp_team_members_id_workspace_uq on public.whatsapp_team_members (id, workspace_id);
create unique index if not exists whatsapp_automations_id_workspace_uq on public.whatsapp_automations (id, workspace_id);
create unique index if not exists whatsapp_automation_runs_id_workspace_uq on public.whatsapp_automation_runs (id, workspace_id);
create unique index if not exists whatsapp_campaigns_id_workspace_uq on public.whatsapp_campaigns (id, workspace_id);
create unique index if not exists whatsapp_campaign_recipients_id_workspace_uq on public.whatsapp_campaign_recipients (id, workspace_id);
create unique index if not exists whatsapp_flows_id_workspace_uq on public.whatsapp_flows (id, workspace_id);
create unique index if not exists whatsapp_flow_submissions_id_workspace_uq on public.whatsapp_flow_submissions (id, workspace_id);
create unique index if not exists whatsapp_ai_agents_id_workspace_uq on public.whatsapp_ai_agents (id, workspace_id);
create unique index if not exists whatsapp_ai_runs_id_workspace_uq on public.whatsapp_ai_runs (id, workspace_id);

-- Add composite FKs only when not already present. Keep the legacy simple FKs as well;
-- this is additive defense-in-depth and avoids a destructive constraint rewrite.
do $$ begin
  if not exists (select 1 from pg_constraint where conname='whatsapp_conversations_contact_workspace_fkey') then
    alter table public.whatsapp_conversations add constraint whatsapp_conversations_contact_workspace_fkey foreign key (contact_id, workspace_id) references public.whatsapp_contacts(id, workspace_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='whatsapp_messages_conversation_workspace_fkey') then
    alter table public.whatsapp_messages add constraint whatsapp_messages_conversation_workspace_fkey foreign key (conversation_id, workspace_id) references public.whatsapp_conversations(id, workspace_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='whatsapp_conversations_assignee_workspace_fkey') then
    alter table public.whatsapp_conversations add constraint whatsapp_conversations_assignee_workspace_fkey foreign key (assigned_member_id, workspace_id) references public.whatsapp_team_members(id, workspace_id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='whatsapp_automation_runs_automation_workspace_fkey') then
    alter table public.whatsapp_automation_runs add constraint whatsapp_automation_runs_automation_workspace_fkey foreign key (automation_id, workspace_id) references public.whatsapp_automations(id, workspace_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='whatsapp_automation_jobs_run_workspace_fkey') then
    alter table public.whatsapp_automation_jobs add constraint whatsapp_automation_jobs_run_workspace_fkey foreign key (run_id, workspace_id) references public.whatsapp_automation_runs(id, workspace_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='whatsapp_campaign_recipients_campaign_workspace_fkey') then
    alter table public.whatsapp_campaign_recipients add constraint whatsapp_campaign_recipients_campaign_workspace_fkey foreign key (campaign_id, workspace_id) references public.whatsapp_campaigns(id, workspace_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='whatsapp_campaign_events_recipient_workspace_fkey') then
    alter table public.whatsapp_campaign_events add constraint whatsapp_campaign_events_recipient_workspace_fkey foreign key (recipient_id, workspace_id) references public.whatsapp_campaign_recipients(id, workspace_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='whatsapp_flow_submissions_flow_workspace_fkey') then
    alter table public.whatsapp_flow_submissions add constraint whatsapp_flow_submissions_flow_workspace_fkey foreign key (flow_id, workspace_id) references public.whatsapp_flows(id, workspace_id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='whatsapp_flow_events_submission_workspace_fkey') then
    alter table public.whatsapp_flow_events add constraint whatsapp_flow_events_submission_workspace_fkey foreign key (submission_id, workspace_id) references public.whatsapp_flow_submissions(id, workspace_id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='whatsapp_ai_runs_agent_workspace_fkey') then
    alter table public.whatsapp_ai_runs add constraint whatsapp_ai_runs_agent_workspace_fkey foreign key (agent_id, workspace_id) references public.whatsapp_ai_agents(id, workspace_id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='whatsapp_ai_actions_run_workspace_fkey') then
    alter table public.whatsapp_ai_actions add constraint whatsapp_ai_actions_run_workspace_fkey foreign key (run_id, workspace_id) references public.whatsapp_ai_runs(id, workspace_id) on delete cascade;
  end if;
end $$;

-- Useful tenant/time indexes for the app, workers and platform administration.
create index if not exists whatsapp_contacts_workspace_created_idx on public.whatsapp_contacts (workspace_id, created_at desc);
create index if not exists whatsapp_conversations_workspace_last_message_idx on public.whatsapp_conversations (workspace_id, last_message_at desc);
create index if not exists whatsapp_messages_workspace_timestamp_idx on public.whatsapp_messages (workspace_id, message_timestamp desc);
create index if not exists whatsapp_automations_workspace_status_idx on public.whatsapp_automations (workspace_id, status);
create index if not exists whatsapp_automation_jobs_workspace_due_idx on public.whatsapp_automation_jobs (workspace_id, status, due_at);
create index if not exists whatsapp_campaigns_workspace_status_idx on public.whatsapp_campaigns (workspace_id, status);
create index if not exists whatsapp_flows_workspace_status_idx on public.whatsapp_flows (workspace_id, status);
create index if not exists whatsapp_team_members_workspace_active_idx on public.whatsapp_team_members (workspace_id, active, role);
create index if not exists whatsapp_workspace_connections_phone_idx on public.whatsapp_workspace_connections (phone_number_id) where phone_number_id is not null;

comment on column public.whatsapp_team_members.workspace_id is 'Stage 11 workspace membership boundary.';
comment on column public.whatsapp_contacts.workspace_id is 'Stage 11 tenant boundary. Same wa_id may exist independently in multiple workspaces.';
