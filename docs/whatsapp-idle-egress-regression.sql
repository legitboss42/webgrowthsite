-- Execute on Web Growth only. All state changes roll back.
-- Fails if either idle worker emits an HTTP processor call with zero due work.
begin;
update public.whatsapp_worker_backoff
set next_probe_at = now() - interval '1 hour'
where worker_name in ('automation', 'campaign');
do $test$
begin
  if public.whatsapp_worker_has_work('automation')
      or public.whatsapp_worker_has_work('campaign') then
    raise exception 'Invalid test setup: there is due queue work';
  end if;
  if exists(select 1 from public.whatsapp_conversations where status = 'open')
     or exists(select 1 from public.whatsapp_automations
                 where status='ACTIVE' and trigger_type='BUSINESS_HOURS') then
    raise exception 'Invalid test setup: timed automation candidates exist';
  end if;
  if public.whatsapp_should_invoke_worker('automation') then
    raise exception 'Idle automation processor should not wake';
  end if;
  if public.whatsapp_should_invoke_worker('campaign') then
    raise exception 'Idle campaign processor should not wake';
  end if;
end;
$test$;
rollback;
