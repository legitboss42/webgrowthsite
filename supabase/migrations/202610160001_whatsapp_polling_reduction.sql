-- Reduce idle WhatsApp API Gateway traffic without weakening inbox freshness.
--
-- 1. Database Broadcast emits opaque workspace-scoped invalidations only; no row data
--    is sent to the browser.
-- 2. Cron still evaluates once per minute, but idle workers stop making HTTP requests
--    and back off to at most one API invocation every five minutes. Due queued work
--    bypasses the backoff immediately on the next cron minute.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- -----------------------------------------------------------------------------
-- Workspace-scoped Realtime invalidation topics
-- -----------------------------------------------------------------------------

alter table public.whatsapp_workspaces
  add column if not exists realtime_topic_token text;

update public.whatsapp_workspaces
set realtime_topic_token = encode(extensions.gen_random_bytes(24), 'hex')
where realtime_topic_token is null or btrim(realtime_topic_token) = '';

alter table public.whatsapp_workspaces
  alter column realtime_topic_token set default encode(extensions.gen_random_bytes(24), 'hex');

alter table public.whatsapp_workspaces
  alter column realtime_topic_token set not null;

create unique index if not exists whatsapp_workspaces_realtime_topic_token_uidx
  on public.whatsapp_workspaces(realtime_topic_token);

create or replace function public.broadcast_whatsapp_workspace_invalidation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  workspace_uuid uuid;
  topic_token text;
begin
  -- The 30-second collaboration heartbeat only refreshes last_seen_at. Do not turn
  -- that liveness write into another read cycle unless typing state actually changed.
  if tg_table_name = 'whatsapp_conversation_presence'
     and tg_op = 'UPDATE'
     and new.is_typing is not distinct from old.is_typing then
    return null;
  end if;

  workspace_uuid := case when tg_op = 'DELETE' then old.workspace_id else new.workspace_id end;
  if workspace_uuid is null then
    return null;
  end if;

  select w.realtime_topic_token
  into topic_token
  from public.whatsapp_workspaces w
  where w.id = workspace_uuid;

  if topic_token is not null then
    perform realtime.send(
      jsonb_build_object(
        'scope', tg_table_name,
        'operation', tg_op
      ),
      'invalidate',
      'whatsapp:' || topic_token,
      false
    );
  end if;

  return null;
end;
$$;

revoke all on function public.broadcast_whatsapp_workspace_invalidation() from public, anon, authenticated;

-- Broadcast only tables that feed live user-facing WhatsApp surfaces. The payload
-- contains table name + operation only; clients re-fetch through authorized routes.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'whatsapp_messages',
    'whatsapp_conversations',
    'whatsapp_team_members',
    'whatsapp_team_activity',
    'whatsapp_internal_notes',
    'whatsapp_note_mentions',
    'whatsapp_conversation_presence',
    'whatsapp_calls',
    'whatsapp_settings'
  ]
  loop
    execute format(
      'drop trigger if exists whatsapp_realtime_invalidation on public.%I',
      table_name
    );
    execute format(
      'create trigger whatsapp_realtime_invalidation after insert or update or delete on public.%I for each row execute function public.broadcast_whatsapp_workspace_invalidation()',
      table_name
    );
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Idle worker backoff
-- -----------------------------------------------------------------------------

create table if not exists public.whatsapp_worker_backoff (
  worker_name text primary key check (worker_name in ('automation', 'campaign')),
  idle_streak integer not null default 0 check (idle_streak >= 0),
  next_run_at timestamptz not null default now(),
  last_result_at timestamptz,
  last_work_count integer not null default 0 check (last_work_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_worker_backoff enable row level security;
revoke all on public.whatsapp_worker_backoff from anon, authenticated;
grant all on public.whatsapp_worker_backoff to service_role;

insert into public.whatsapp_worker_backoff(worker_name)
values ('automation'), ('campaign')
on conflict (worker_name) do nothing;

create or replace function public.whatsapp_worker_has_due_work(p_worker_name text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_worker_name = 'automation' then
    return exists (
      select 1
      from public.whatsapp_automation_jobs j
      where j.status = 'PENDING'
        and j.due_at <= now()
      limit 1
    );
  end if;

  if p_worker_name = 'campaign' then
    return exists (
      select 1
      from public.whatsapp_campaign_recipients r
      join public.whatsapp_campaigns c
        on c.id = r.campaign_id
       and c.workspace_id = r.workspace_id
      where (
        r.status = 'PENDING'
        and c.status in ('SCHEDULED', 'RUNNING')
        and coalesce(r.scheduled_at, c.scheduled_at, now()) <= now()
      ) or (
        r.status = 'SENDING'
        and r.locked_at < now() - interval '15 minutes'
      )
      limit 1
    );
  end if;

  return false;
end;
$$;

create or replace function public.whatsapp_worker_should_dispatch(p_worker_name text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_allowed timestamptz;
begin
  if p_worker_name not in ('automation', 'campaign') then
    return false;
  end if;

  insert into public.whatsapp_worker_backoff(worker_name)
  values (p_worker_name)
  on conflict (worker_name) do nothing;

  -- Queued work always wins over idle backoff. Campaigns therefore retain the
  -- existing next-minute processing behavior even after a long idle period.
  if public.whatsapp_worker_has_due_work(p_worker_name) then
    return true;
  end if;

  select b.next_run_at
  into next_allowed
  from public.whatsapp_worker_backoff b
  where b.worker_name = p_worker_name;

  return coalesce(next_allowed, now()) <= now();
end;
$$;

create or replace function public.record_whatsapp_worker_result(
  p_worker_name text,
  p_work_count integer default 0
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_streak integer;
  next_streak integer;
  delay_interval interval;
  normalized_count integer := greatest(coalesce(p_work_count, 0), 0);
begin
  if p_worker_name not in ('automation', 'campaign') then
    return;
  end if;

  insert into public.whatsapp_worker_backoff(worker_name)
  values (p_worker_name)
  on conflict (worker_name) do nothing;

  select b.idle_streak
  into previous_streak
  from public.whatsapp_worker_backoff b
  where b.worker_name = p_worker_name
  for update;

  if normalized_count > 0 then
    next_streak := 0;
    delay_interval := interval '1 minute';
  else
    next_streak := least(coalesce(previous_streak, 0) + 1, 3);
    delay_interval := case next_streak
      when 1 then interval '2 minutes'
      when 2 then interval '3 minutes'
      else interval '5 minutes'
    end;
  end if;

  update public.whatsapp_worker_backoff
  set
    idle_streak = next_streak,
    next_run_at = now() + delay_interval,
    last_result_at = now(),
    last_work_count = normalized_count,
    updated_at = now()
  where worker_name = p_worker_name;
end;
$$;

revoke all on function public.whatsapp_worker_has_due_work(text) from public, anon, authenticated;
revoke all on function public.whatsapp_worker_should_dispatch(text) from public, anon, authenticated;
revoke all on function public.record_whatsapp_worker_result(text, integer) from public, anon, authenticated;
grant execute on function public.whatsapp_worker_has_due_work(text) to service_role;
grant execute on function public.whatsapp_worker_should_dispatch(text) to service_role;
grant execute on function public.record_whatsapp_worker_result(text, integer) to service_role;

-- Keep the one-minute cron resolution so newly due queue rows are detected promptly,
-- but skip the external HTTP call while an idle worker is inside its backoff window.
do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'webgrowth-whatsapp-automation-processor'
  limit 1;
  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
end;
$$;

select cron.schedule(
  'webgrowth-whatsapp-automation-processor',
  '* * * * *',
  $cron$
    select case
      when public.whatsapp_worker_should_dispatch('automation') then
        net.http_post(
          url := (select processor_url from public.whatsapp_automation_runtime_config where id = 'default'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webgrowth-automation-secret', (select processor_secret from public.whatsapp_automation_runtime_config where id = 'default')
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 50000
        )
      else null
    end as request_id;
  $cron$
);

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'webgrowth-whatsapp-campaign-processor'
  limit 1;
  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
end;
$$;

select cron.schedule(
  'webgrowth-whatsapp-campaign-processor',
  '* * * * *',
  $cron$
    select case
      when public.whatsapp_worker_should_dispatch('campaign') then
        net.http_post(
          url := (select processor_url from public.whatsapp_campaign_runtime_config where id = 'default'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webgrowth-automation-secret', (select processor_secret from public.whatsapp_automation_runtime_config where id = 'default')
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 50000
        )
      else null
    end as request_id;
  $cron$
);
