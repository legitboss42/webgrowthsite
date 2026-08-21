create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create or replace function public.configure_tiktok_scheduler_cron(
  p_base_url text,
  p_cron_secret text
)
returns table(jobname text, schedule text, active boolean)
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  base_url text := trim(trailing '/' from coalesce(p_base_url, ''));
  cron_secret text := coalesce(p_cron_secret, '');
  publish_command text;
  cleanup_command text;
begin
  if base_url <> 'https://webgrowth.info' then
    raise exception 'Scheduler base URL must be https://webgrowth.info';
  end if;

  if length(cron_secret) < 16 then
    raise exception 'Scheduler cron secret is too short';
  end if;

  delete from vault.secrets
  where name in ('webgrowth_scheduler_base_url', 'webgrowth_scheduler_cron_secret');

  perform vault.create_secret(
    base_url,
    'webgrowth_scheduler_base_url',
    'Base URL used by Supabase Cron for Web Growth TikTok scheduler callbacks.'
  );

  perform vault.create_secret(
    cron_secret,
    'webgrowth_scheduler_cron_secret',
    'Bearer token used by Supabase Cron when calling protected Web Growth scheduler callbacks.'
  );

  publish_command := $command$
    select net.http_get(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'webgrowth_scheduler_base_url'
        limit 1
      ) || '/api/scheduler/cron/publish',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'webgrowth_scheduler_cron_secret'
          limit 1
        )
      ),
      timeout_milliseconds := 30000
    );
  $command$;

  cleanup_command := $command$
    select net.http_get(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'webgrowth_scheduler_base_url'
        limit 1
      ) || '/api/scheduler/cron/cleanup',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'webgrowth_scheduler_cron_secret'
          limit 1
        )
      ),
      timeout_milliseconds := 30000
    );
  $command$;

  perform cron.unschedule(jobid)
  from cron.job
  where cron.job.jobname in ('webgrowth-tiktok-publish-5m', 'webgrowth-tiktok-cleanup-daily');

  perform cron.schedule('webgrowth-tiktok-publish-5m', '*/5 * * * *', publish_command);
  perform cron.schedule('webgrowth-tiktok-cleanup-daily', '17 3 * * *', cleanup_command);

  return query
  select j.jobname, j.schedule, j.active
  from cron.job j
  where j.jobname in ('webgrowth-tiktok-publish-5m', 'webgrowth-tiktok-cleanup-daily')
  order by j.jobname;
end;
$$;

create or replace function public.get_tiktok_scheduler_cron_status()
returns table(jobname text, schedule text, active boolean)
language sql
security definer
set search_path = public
as $$
  select j.jobname, j.schedule, j.active
  from cron.job j
  where j.jobname in ('webgrowth-tiktok-publish-5m', 'webgrowth-tiktok-cleanup-daily')
  order by j.jobname;
$$;

revoke execute on function public.configure_tiktok_scheduler_cron(text, text) from public, anon, authenticated;
revoke execute on function public.get_tiktok_scheduler_cron_status() from public, anon, authenticated;
