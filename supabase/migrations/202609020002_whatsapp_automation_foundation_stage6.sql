-- Stage 6 WhatsApp Automation Engine: complete durable workflow runtime.
-- Additive and idempotent. Apply manually in the Supabase SQL editor.
-- NEVER run `supabase db push`, NEVER apply this to Neon/DATABASE_URL, and do not touch TikTok migrations.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.whatsapp_automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status text not null default 'DRAFT',
  trigger_type text not null,
  trigger_config jsonb not null default '{}'::jsonb,
  condition_join text not null default 'AND',
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  created_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  updated_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  activated_at timestamptz,
  paused_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automations_status_check' and conrelid = 'public.whatsapp_automations'::regclass) then
    alter table public.whatsapp_automations add constraint whatsapp_automations_status_check check (status in ('DRAFT', 'ACTIVE', 'PAUSED'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automations_condition_join_check' and conrelid = 'public.whatsapp_automations'::regclass) then
    alter table public.whatsapp_automations add constraint whatsapp_automations_condition_join_check check (condition_join in ('AND', 'OR'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automations_trigger_config_object_check' and conrelid = 'public.whatsapp_automations'::regclass) then
    alter table public.whatsapp_automations add constraint whatsapp_automations_trigger_config_object_check check (jsonb_typeof(trigger_config) = 'object');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automations_conditions_array_check' and conrelid = 'public.whatsapp_automations'::regclass) then
    alter table public.whatsapp_automations add constraint whatsapp_automations_conditions_array_check check (jsonb_typeof(conditions) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automations_actions_array_check' and conrelid = 'public.whatsapp_automations'::regclass) then
    alter table public.whatsapp_automations add constraint whatsapp_automations_actions_array_check check (jsonb_typeof(actions) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automations_version_check' and conrelid = 'public.whatsapp_automations'::regclass) then
    alter table public.whatsapp_automations add constraint whatsapp_automations_version_check check (version >= 1);
  end if;
end
$$;

create unique index if not exists whatsapp_automations_name_unique_idx on public.whatsapp_automations (lower(name));
create index if not exists whatsapp_automations_status_updated_idx on public.whatsapp_automations (status, updated_at desc);
create index if not exists whatsapp_automations_trigger_type_idx on public.whatsapp_automations (trigger_type, status);

create table if not exists public.whatsapp_automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.whatsapp_automations(id) on delete cascade,
  automation_version integer not null,
  status text not null default 'QUEUED',
  trigger_type text not null,
  trigger_event_key text,
  contact_id uuid references public.whatsapp_contacts(id) on delete set null,
  conversation_id uuid references public.whatsapp_conversations(id) on delete set null,
  trigger_payload jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  next_action_index integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automation_runs_status_check' and conrelid = 'public.whatsapp_automation_runs'::regclass) then
    alter table public.whatsapp_automation_runs add constraint whatsapp_automation_runs_status_check check (status in ('QUEUED', 'RUNNING', 'WAITING', 'SUCCEEDED', 'FAILED', 'SKIPPED', 'CANCELLED'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automation_runs_payload_object_check' and conrelid = 'public.whatsapp_automation_runs'::regclass) then
    alter table public.whatsapp_automation_runs add constraint whatsapp_automation_runs_payload_object_check check (jsonb_typeof(trigger_payload) = 'object' and jsonb_typeof(context) = 'object');
  end if;
end
$$;

create unique index if not exists whatsapp_automation_runs_dedupe_idx on public.whatsapp_automation_runs (automation_id, trigger_event_key) where trigger_event_key is not null;
create index if not exists whatsapp_automation_runs_status_created_idx on public.whatsapp_automation_runs (status, created_at desc);
create index if not exists whatsapp_automation_runs_automation_created_idx on public.whatsapp_automation_runs (automation_id, created_at desc);
create index if not exists whatsapp_automation_runs_contact_created_idx on public.whatsapp_automation_runs (contact_id, created_at desc) where contact_id is not null;

create table if not exists public.whatsapp_automation_jobs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.whatsapp_automation_runs(id) on delete cascade,
  automation_id uuid not null references public.whatsapp_automations(id) on delete cascade,
  status text not null default 'PENDING',
  due_at timestamptz not null,
  action_index integer not null,
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  locked_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automation_jobs_status_check' and conrelid = 'public.whatsapp_automation_jobs'::regclass) then
    alter table public.whatsapp_automation_jobs add constraint whatsapp_automation_jobs_status_check check (status in ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automation_jobs_attempts_check' and conrelid = 'public.whatsapp_automation_jobs'::regclass) then
    alter table public.whatsapp_automation_jobs add constraint whatsapp_automation_jobs_attempts_check check (attempts >= 0 and max_attempts >= 1 and action_index >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automation_jobs_payload_object_check' and conrelid = 'public.whatsapp_automation_jobs'::regclass) then
    alter table public.whatsapp_automation_jobs add constraint whatsapp_automation_jobs_payload_object_check check (jsonb_typeof(payload) = 'object');
  end if;
end
$$;

create index if not exists whatsapp_automation_jobs_due_idx on public.whatsapp_automation_jobs (status, due_at) where status in ('PENDING', 'PROCESSING');
create index if not exists whatsapp_automation_jobs_run_idx on public.whatsapp_automation_jobs (run_id, created_at);

create table if not exists public.whatsapp_automation_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.whatsapp_automation_runs(id) on delete cascade,
  automation_id uuid not null references public.whatsapp_automations(id) on delete cascade,
  event_type text not null,
  action_index integer,
  status text not null default 'INFO',
  detail jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automation_events_status_check' and conrelid = 'public.whatsapp_automation_events'::regclass) then
    alter table public.whatsapp_automation_events add constraint whatsapp_automation_events_status_check check (status in ('INFO', 'SUCCESS', 'SKIPPED', 'ERROR'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_automation_events_detail_object_check' and conrelid = 'public.whatsapp_automation_events'::regclass) then
    alter table public.whatsapp_automation_events add constraint whatsapp_automation_events_detail_object_check check (jsonb_typeof(detail) = 'object');
  end if;
end
$$;

create index if not exists whatsapp_automation_events_run_created_idx on public.whatsapp_automation_events (run_id, created_at);
create index if not exists whatsapp_automation_events_automation_created_idx on public.whatsapp_automation_events (automation_id, created_at desc);

-- One private row lets Supabase Cron authenticate to the processor without adding another Vercel environment secret.
create table if not exists public.whatsapp_automation_runtime_config (
  id text primary key,
  processor_secret text not null default encode(gen_random_bytes(32), 'hex'),
  processor_url text not null default 'https://webgrowth.info/api/internal/whatsapp/automations/process/',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_automation_runtime_config_id_check check (id = 'default')
);

insert into public.whatsapp_automation_runtime_config (id)
values ('default')
on conflict (id) do nothing;

-- Keep the runtime data service-role-only. Browser clients never read workflow secrets or run internals directly.
alter table public.whatsapp_automations enable row level security;
alter table public.whatsapp_automation_runs enable row level security;
alter table public.whatsapp_automation_jobs enable row level security;
alter table public.whatsapp_automation_events enable row level security;
alter table public.whatsapp_automation_runtime_config enable row level security;

revoke all on public.whatsapp_automations from anon, authenticated;
revoke all on public.whatsapp_automation_runs from anon, authenticated;
revoke all on public.whatsapp_automation_jobs from anon, authenticated;
revoke all on public.whatsapp_automation_events from anon, authenticated;
revoke all on public.whatsapp_automation_runtime_config from anon, authenticated;

grant all on public.whatsapp_automations to service_role;
grant all on public.whatsapp_automation_runs to service_role;
grant all on public.whatsapp_automation_jobs to service_role;
grant all on public.whatsapp_automation_events to service_role;
grant all on public.whatsapp_automation_runtime_config to service_role;

-- Replace any older job with the one complete Stage 6 processor tick.
do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'webgrowth-whatsapp-automation-processor' limit 1;
  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
end
$$;

select cron.schedule(
  'webgrowth-whatsapp-automation-processor',
  '* * * * *',
  $cron$
    select net.http_post(
      url := (select processor_url from public.whatsapp_automation_runtime_config where id = 'default'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webgrowth-automation-secret', (select processor_secret from public.whatsapp_automation_runtime_config where id = 'default')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 50000
    ) as request_id;
  $cron$
);
