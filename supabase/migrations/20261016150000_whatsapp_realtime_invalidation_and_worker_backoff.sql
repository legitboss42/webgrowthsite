-- Reduce idle WhatsApp API traffic while preserving live UI updates and queue processing.
-- Realtime carries invalidation metadata only. Business rows remain service-role-only.

create or replace function public.broadcast_whatsapp_workspace_invalidation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  workspace_id_value text;
begin
  workspace_id_value := case
    when tg_op = 'DELETE' then to_jsonb(old)->>'workspace_id'
    else to_jsonb(new)->>'workspace_id'
  end;

  if workspace_id_value is not null and workspace_id_value <> '' then
    perform realtime.send(
      jsonb_build_object('table', tg_table_name, 'operation', tg_op),
      'changed',
      'whatsapp:' || workspace_id_value,
      false
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.broadcast_whatsapp_workspace_invalidation() from public, anon, authenticated;

-- One trigger per user-facing table. No row values are broadcast.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'whatsapp_conversations',
    'whatsapp_messages',
    'whatsapp_team_members',
    'whatsapp_internal_notes',
    'whatsapp_note_mentions',
    'whatsapp_team_activity',
    'whatsapp_conversation_presence',
    'whatsapp_calls'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop trigger if exists %I on public.%I', 'broadcast_' || table_name || '_invalidation', table_name);
      execute format(
        'create trigger %I after insert or update or delete on public.%I for each row execute function public.broadcast_whatsapp_workspace_invalidation()',
        'broadcast_' || table_name || '_invalidation',
        table_name
      );
    end if;
  end loop;
end $$;

-- Existing setting becomes a slow safety reconciliation. Realtime is now the fast path.
update public.whatsapp_settings
set settings = jsonb_set(
      coalesce(settings, '{}'::jsonb),
      '{console}',
      coalesce(settings->'console', '{}'::jsonb) || '{"inboxRefreshSeconds":300}'::jsonb,
      true
    ),
    updated_at = now();

-- Track adaptive idle probes for background processors.
create table if not exists public.whatsapp_worker_backoff (
  worker_name text primary key check (worker_name in ('automation', 'campaign')),
  idle_streak integer not null default 0 check (idle_streak >= 0),
  next_probe_at timestamptz not null default now(),
  last_work_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_worker_backoff enable row level security;
grant all on public.whatsapp_worker_backoff to service_role;

insert into public.whatsapp_worker_backoff (worker_name)
values ('automation'), ('campaign')
on conflict (worker_name) do nothing;

create or replace function public.whatsapp_worker_has_work(p_worker text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_worker = 'campaign' then
    return exists (
      select 1
      from public.whatsapp_campaign_recipients r
      join public.whatsapp_campaigns c on c.id = r.campaign_id
      where r.status = 'PENDING'
        and c.status in ('SCHEDULED', 'RUNNING')
        and coalesce(r.scheduled_at, c.scheduled_at, now()) <= now()
      limit 1
    ) or exists (
      select 1
      from public.whatsapp_campaign_recipients r
      where r.status = 'SENDING'
        and r.locked_at < now() - interval '15 minutes'
      limit 1
    );
  end if;

  if p_worker = 'automation' then
    return exists (
      select 1
      from public.whatsapp_automation_jobs j
      where j.status = 'PENDING'
        and j.due_at <= now()
      limit 1
    ) or exists (
      select 1
      from public.whatsapp_automations a
      where a.status = 'ACTIVE'
        and a.trigger_type in ('NO_CUSTOMER_REPLY', 'NO_AGENT_REPLY', 'BUSINESS_HOURS')
      limit 1
    );
  end if;

  raise exception 'Unsupported WhatsApp worker: %', p_worker;
end;
$$;

create or replace function public.whatsapp_should_invoke_worker(p_worker text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  state public.whatsapp_worker_backoff%rowtype;
  has_work boolean;
  next_streak integer;
  delay_minutes integer;
begin
  has_work := public.whatsapp_worker_has_work(p_worker);

  insert into public.whatsapp_worker_backoff (worker_name)
  values (p_worker)
  on conflict (worker_name) do nothing;

  select * into state
  from public.whatsapp_worker_backoff
  where worker_name = p_worker
  for update;

  if has_work then
    update public.whatsapp_worker_backoff
    set idle_streak = 0,
        next_probe_at = now() + interval '1 minute',
        last_work_at = now(),
        updated_at = now()
    where worker_name = p_worker;
    return true;
  end if;

  if state.next_probe_at > now() then
    return false;
  end if;

  next_streak := least(state.idle_streak + 1, 5);
  delay_minutes := least(15, power(2, greatest(next_streak - 1, 0))::integer);
  update public.whatsapp_worker_backoff
  set idle_streak = next_streak,
      next_probe_at = now() + make_interval(mins => delay_minutes),
      updated_at = now()
  where worker_name = p_worker;

  -- Periodic health probe: 1m -> 2m -> 4m -> 8m -> 15m while idle.
  return true;
end;
$$;

revoke all on function public.whatsapp_worker_has_work(text) from public, anon, authenticated;
revoke all on function public.whatsapp_should_invoke_worker(text) from public, anon, authenticated;
grant execute on function public.whatsapp_worker_has_work(text) to service_role;
grant execute on function public.whatsapp_should_invoke_worker(text) to service_role;

-- Reschedule the existing minute cron ticks. The cheap indexed work check still runs each
-- minute so newly due work wakes immediately, while external HTTP worker calls back off.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'webgrowth-whatsapp-automation-processor') then
    perform cron.unschedule('webgrowth-whatsapp-automation-processor');
  end if;
  if exists (select 1 from cron.job where jobname = 'webgrowth-whatsapp-campaign-processor') then
    perform cron.unschedule('webgrowth-whatsapp-campaign-processor');
  end if;
end $$;

select cron.schedule(
  'webgrowth-whatsapp-automation-processor',
  '* * * * *',
  $cron$
    do $worker$
    begin
      if public.whatsapp_should_invoke_worker('automation') then
        perform net.http_post(
          url := (select processor_url from public.whatsapp_automation_runtime_config where id = 'default'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webgrowth-automation-secret', (select processor_secret from public.whatsapp_automation_runtime_config where id = 'default')
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 50000
        );
      end if;
    end
    $worker$;
  $cron$
);

select cron.schedule(
  'webgrowth-whatsapp-campaign-processor',
  '* * * * *',
  $cron$
    do $worker$
    begin
      if public.whatsapp_should_invoke_worker('campaign') then
        perform net.http_post(
          url := (select processor_url from public.whatsapp_campaign_runtime_config where id = 'default'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webgrowth-automation-secret', (select processor_secret from public.whatsapp_automation_runtime_config where id = 'default')
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 50000
        );
      end if;
    end
    $worker$;
  $cron$
);
