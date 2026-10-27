-- Stop redundant HTTP processor calls while there is no actionable work.
-- The existing per-minute cron continues to check due jobs in Postgres, so new
-- automation jobs and campaign recipients still wake immediately.
-- Timed no-reply workflows need an open conversation; business-hours workflows
-- remain eligible for periodic checks even without open conversations.
create or replace function public.whatsapp_should_invoke_worker(p_worker text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  state public.whatsapp_worker_backoff%rowtype;
  has_work boolean;
  next_streak integer;
  max_delay_minutes integer;
  delay_minutes integer;
begin
  has_work := public.whatsapp_worker_has_work(p_worker);

  if not has_work then
    -- Campaigns have no separate timer-discovery work; the due/stale queue
    -- check above already covers scheduled and recoverable recipients.
    if p_worker = 'campaign' then
      return false;
    end if;

    -- scanNoReplyTriggers only reads open conversations. With none present,
    -- the timer scanner has no candidates. BUSINESS_HOURS may still fire
    -- without conversations, so keep its existing bounded idle probe.
    if p_worker = 'automation'
       and not exists (
         select 1 from public.whatsapp_conversations
         where status = 'open'
       )
       and not exists (
         select 1 from public.whatsapp_automations
         where status = 'ACTIVE'
           and trigger_type = 'BUSINESS_HOURS'
       ) then
      return false;
    end if;
  end if;

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
  max_delay_minutes := case when p_worker = 'automation' then 5 else 15 end;
  delay_minutes := least(max_delay_minutes, power(2, greatest(next_streak - 1, 0))::integer);
  update public.whatsapp_worker_backoff
  set idle_streak = next_streak,
      next_probe_at = now() + make_interval(mins => delay_minutes),
      updated_at = now()
  where worker_name = p_worker;

  return true;
end;
$function$;

-- Keep the processor predicate private. The scheduled postgres job executes
-- with its current privileges; do not expose it to browsers.
revoke all on function public.whatsapp_should_invoke_worker(text) from public, anon, authenticated;
grant execute on function public.whatsapp_should_invoke_worker(text) to service_role;
