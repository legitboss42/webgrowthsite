-- Stage 7 WhatsApp Campaigns & Audiences.
-- Production migration version already applied in Supabase as 20260902120037.
-- This source file mirrors the durable campaign schema for repository history.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.whatsapp_segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  condition_join text not null default 'AND' check (condition_join in ('AND','OR')),
  conditions jsonb not null default '[]'::jsonb check (jsonb_typeof(conditions) = 'array'),
  created_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  updated_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status text not null default 'DRAFT' check (status in ('DRAFT','SCHEDULED','RUNNING','PAUSED','COMPLETED','CANCELLED','FAILED')),
  segment_id uuid references public.whatsapp_segments(id) on delete set null,
  audience_snapshot jsonb not null default '{}'::jsonb,
  template_id text not null,
  template_name text not null,
  template_language text not null default 'en_US',
  template_category text,
  template_snapshot jsonb not null default '{}'::jsonb,
  variable_mappings jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  paused_at timestamptz,
  cancelled_at timestamptz,
  audience_count integer not null default 0,
  eligible_count integer not null default 0,
  sent_count integer not null default 0,
  delivered_count integer not null default 0,
  read_count integer not null default 0,
  replied_count integer not null default 0,
  failed_count integer not null default 0,
  skipped_count integer not null default 0,
  created_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  updated_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.whatsapp_campaigns(id) on delete cascade,
  contact_id uuid references public.whatsapp_contacts(id) on delete set null,
  wa_id text not null,
  display_name text,
  status text not null default 'PENDING' check (status in ('PENDING','SENDING','SENT','DELIVERED','READ','REPLIED','FAILED','SKIPPED','CANCELLED')),
  skip_reason text,
  message_id text,
  contact_snapshot jsonb not null default '{}'::jsonb,
  variable_values jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  scheduled_at timestamptz,
  locked_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  failed_at timestamptz,
  reply_message_id text,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.whatsapp_campaigns(id) on delete cascade,
  recipient_id uuid references public.whatsapp_campaign_recipients(id) on delete cascade,
  event_type text not null,
  status text not null default 'INFO' check (status in ('INFO','SUCCESS','SKIPPED','ERROR')),
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail) = 'object'),
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_campaign_runtime_config (
  id text primary key check (id = 'default'),
  processor_url text not null default 'https://webgrowth.info/api/internal/whatsapp/campaigns/process/',
  batch_size integer not null default 25,
  max_marketing_per_24h integer not null default 1,
  max_marketing_per_7d integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.whatsapp_campaign_runtime_config (id)
values ('default')
on conflict (id) do nothing;

create index if not exists whatsapp_campaigns_status_schedule_idx on public.whatsapp_campaigns(status, scheduled_at);
create index if not exists whatsapp_campaign_recipients_campaign_idx on public.whatsapp_campaign_recipients(campaign_id, status);
create index if not exists whatsapp_campaign_recipients_queue_idx on public.whatsapp_campaign_recipients(status, scheduled_at, created_at);
create index if not exists whatsapp_campaign_recipients_message_idx on public.whatsapp_campaign_recipients(message_id) where message_id is not null;
create index if not exists whatsapp_campaign_recipients_contact_sent_idx on public.whatsapp_campaign_recipients(contact_id, sent_at desc) where sent_at is not null;
create index if not exists whatsapp_campaign_events_campaign_idx on public.whatsapp_campaign_events(campaign_id, created_at desc);

alter table public.whatsapp_segments enable row level security;
alter table public.whatsapp_campaigns enable row level security;
alter table public.whatsapp_campaign_recipients enable row level security;
alter table public.whatsapp_campaign_events enable row level security;
alter table public.whatsapp_campaign_runtime_config enable row level security;

grant all on public.whatsapp_segments to service_role;
grant all on public.whatsapp_campaigns to service_role;
grant all on public.whatsapp_campaign_recipients to service_role;
grant all on public.whatsapp_campaign_events to service_role;
grant all on public.whatsapp_campaign_runtime_config to service_role;

create or replace function public.claim_whatsapp_campaign_recipients(p_limit integer default 25)
returns setof public.whatsapp_campaign_recipients
language sql
set search_path = ''
as $$
  with picked as (
    select r.id
    from public.whatsapp_campaign_recipients r
    join public.whatsapp_campaigns c on c.id = r.campaign_id
    where r.status = 'PENDING'
      and c.status in ('SCHEDULED','RUNNING')
      and coalesce(r.scheduled_at, c.scheduled_at, now()) <= now()
    order by coalesce(r.scheduled_at, c.scheduled_at, r.created_at), r.created_at
    for update of r skip locked
    limit greatest(1, least(coalesce(p_limit, 25), 100))
  )
  update public.whatsapp_campaign_recipients r
  set status = 'SENDING', locked_at = now(), attempts = r.attempts + 1, updated_at = now()
  from picked
  where r.id = picked.id
  returning r.*;
$$;

create or replace function public.refresh_whatsapp_campaign_counts(p_campaign_id uuid)
returns void
language sql
set search_path = ''
as $$
  update public.whatsapp_campaigns c
  set
    audience_count = x.audience_count,
    eligible_count = x.eligible_count,
    sent_count = x.sent_count,
    delivered_count = x.delivered_count,
    read_count = x.read_count,
    replied_count = x.replied_count,
    failed_count = x.failed_count,
    skipped_count = x.skipped_count,
    completed_at = case
      when c.status in ('RUNNING','SCHEDULED') and x.pending_count = 0 and x.sending_count = 0 and x.audience_count > 0 then coalesce(c.completed_at, now())
      else c.completed_at
    end,
    status = case
      when c.status in ('RUNNING','SCHEDULED') and x.pending_count = 0 and x.sending_count = 0 and x.audience_count > 0 then 'COMPLETED'
      else c.status
    end,
    updated_at = now()
  from (
    select
      count(*)::integer as audience_count,
      count(*) filter (where status <> 'SKIPPED')::integer as eligible_count,
      count(*) filter (where status in ('SENT','DELIVERED','READ','REPLIED'))::integer as sent_count,
      count(*) filter (where status in ('DELIVERED','READ','REPLIED'))::integer as delivered_count,
      count(*) filter (where status in ('READ','REPLIED'))::integer as read_count,
      count(*) filter (where status = 'REPLIED')::integer as replied_count,
      count(*) filter (where status = 'FAILED')::integer as failed_count,
      count(*) filter (where status = 'SKIPPED')::integer as skipped_count,
      count(*) filter (where status = 'PENDING')::integer as pending_count,
      count(*) filter (where status = 'SENDING')::integer as sending_count
    from public.whatsapp_campaign_recipients
    where campaign_id = p_campaign_id
  ) x
  where c.id = p_campaign_id;
$$;

grant execute on function public.claim_whatsapp_campaign_recipients(integer) to service_role;
grant execute on function public.refresh_whatsapp_campaign_counts(uuid) to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'webgrowth-whatsapp-campaign-processor') then
    perform cron.unschedule('webgrowth-whatsapp-campaign-processor');
  end if;
end $$;

select cron.schedule(
  'webgrowth-whatsapp-campaign-processor',
  '* * * * *',
  $cron$
    select net.http_post(
      url := (select processor_url from public.whatsapp_campaign_runtime_config where id = 'default'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webgrowth-automation-secret', (select processor_secret from public.whatsapp_automation_runtime_config where id = 'default')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 50000
    ) as request_id;
  $cron$
);
