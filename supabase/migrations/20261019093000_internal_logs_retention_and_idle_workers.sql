-- Web Growth internal logging and idle worker maintenance (2026-10-19).
-- Deploy once as one transaction. Preserves user/business data, due-work latency,
-- recent HTTP responses and seven days of cron diagnostic history.
--
-- IMPORTANT: This migration performs one-time table compaction via TRUNCATE +
-- restoration under an ACCESS EXCLUSIVE lock. Schedule during a quiet period.
-- The application deployment and migration are a SINGLE coordinated release.

-- Maintenance uses TRUNCATE+restore instead of owner-only ALTER TABLE options.
-- The connected postgres role can TRUNCATE/INSERT but does not own pg_net/pg_cron tables.

-- Lock before copying to avoid losing pg_net responses or in-flight cron writes.
-- Keep seven days of completed runs AND any running / timestamp-less runs.
-- pg_net normally retains its responses for six hours; preserve the whole window.
-- Both restored tables retain their original schema, extension ownership,
-- indexes, privileges and sequences (TRUNCATE does not RESTART IDENTITY).
do $compact$
begin
  lock table cron.job_run_details, net._http_response in access exclusive mode;

  create temporary table wg_recent_cron_runs on commit drop as
    select jobid, runid, job_pid, database, username, command, status,
           return_message, start_time, end_time
    from cron.job_run_details
    where start_time >= now() - interval '7 days'
       or start_time is null
       or status = 'running';

  create temporary table wg_recent_net_responses on commit drop as
    select id, status_code, content_type, headers, content, timed_out,
           error_msg, created
    from net._http_response
    where created >= now() - interval '6 hours';

  truncate table cron.job_run_details;
  insert into cron.job_run_details (
    jobid, runid, job_pid, database, username, command, status,
    return_message, start_time, end_time
  )
  select jobid, runid, job_pid, database, username, command, status,
         return_message, start_time, end_time
  from wg_recent_cron_runs;

  truncate table net._http_response;
  insert into net._http_response (
    id, status_code, content_type, headers, content, timed_out, error_msg, created
  )
  select id, status_code, content_type, headers, content, timed_out, error_msg, created
  from wg_recent_net_responses;
end
$compact$;

-- Daily incremental retention. The initial backlog was compacted above;
-- subsequent DELETEs are small enough for autovacuum to reuse space.
do $retention$
begin
  if exists (select 1 from cron.job where jobname = 'webgrowth-internal-log-retention') then
    perform cron.unschedule('webgrowth-internal-log-retention');
  end if;
end
$retention$;

select cron.schedule(
  'webgrowth-internal-log-retention',
  '18 3 * * *',
  $cron$
    delete from cron.job_run_details
    where start_time < now() - interval '7 days'
      and status is distinct from 'running';
  $cron$
);

-- Weekly physical compaction only when internal-table storage has grown.
-- Fast-path does nothing for small tables. The cron history is already pruned
-- daily; compacting a swollen heap also returns its free pages to disk.
-- Keep pg_net's six-hour response window and preserve running cron entries.
do $maintenance_schedule$
begin
  if exists (select 1 from cron.job where jobname = 'webgrowth-internal-log-compaction') then
    perform cron.unschedule('webgrowth-internal-log-compaction');
  end if;
end
$maintenance_schedule$;

select cron.schedule(
  'webgrowth-internal-log-compaction',
  '29 4 * * 0',
  $cron$
    do $compact$
    begin
      if pg_catalog.pg_total_relation_size('net._http_response'::regclass) > 33554432 then
        lock table net._http_response in access exclusive mode;
        create temporary table wg_weekly_net_responses on commit drop as
          select id, status_code, content_type, headers, content,
                 timed_out, error_msg, created
          from net._http_response
          where created >= now() - interval '6 hours';
        truncate table net._http_response;
        insert into net._http_response (
          id, status_code, content_type, headers, content, timed_out,
          error_msg, created
        )
        select id, status_code, content_type, headers, content, timed_out,
               error_msg, created
        from wg_weekly_net_responses;
      end if;

      if pg_catalog.pg_total_relation_size('cron.job_run_details'::regclass) > 50331648 then
        lock table cron.job_run_details in access exclusive mode;
        create temporary table wg_weekly_cron_runs on commit drop as
          select jobid, runid, job_pid, database, username, command,
                 status, return_message, start_time, end_time
          from cron.job_run_details
          where start_time >= now() - interval '7 days'
             or start_time is null
             or status = 'running';
        truncate table cron.job_run_details;
        insert into cron.job_run_details (
          jobid, runid, job_pid, database, username, command,
          status, return_message, start_time, end_time
        )
        select jobid, runid, job_pid, database, username, command,
               status, return_message, start_time, end_time
        from wg_weekly_cron_runs;
      end if;
    end
    $compact$;
  $cron$
);

-- Merge two WhatsApp cron TICKS, not the workers themselves.
-- Each worker independently checks for due work; on idle each uses its
-- existing progressive HTTP backoff. Exceptions are isolated to preserve
-- campaign processing even when automation config / invocation fails.
do $replace$
begin
  if exists (select 1 from cron.job where jobname = 'webgrowth-whatsapp-automation-processor') then
    perform cron.unschedule('webgrowth-whatsapp-automation-processor');
  end if;
  if exists (select 1 from cron.job where jobname = 'webgrowth-whatsapp-campaign-processor') then
    perform cron.unschedule('webgrowth-whatsapp-campaign-processor');
  end if;
  if exists (select 1 from cron.job where jobname = 'webgrowth-whatsapp-processors') then
    perform cron.unschedule('webgrowth-whatsapp-processors');
  end if;
end
$replace$;

select cron.schedule(
  'webgrowth-whatsapp-processors',
  '* * * * *',
  $cron$
    do $worker$
    begin
      begin
        if public.whatsapp_should_invoke_worker('automation') then
          perform net.http_post(
            url := (select processor_url from public.whatsapp_automation_runtime_config where id = 'default'),
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'x-webgrowth-automation-secret',
              (select processor_secret from public.whatsapp_automation_runtime_config where id = 'default')
            ),
            body := '{}'::jsonb,
            timeout_milliseconds := 50000
          );
        end if;
      exception when others then
        raise warning 'WhatsApp automation cron tick failed: %', sqlerrm;
      end;

      begin
        if public.whatsapp_should_invoke_worker('campaign') then
          perform net.http_post(
            url := (select processor_url from public.whatsapp_campaign_runtime_config where id = 'default'),
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'x-webgrowth-automation-secret',
              (select processor_secret from public.whatsapp_automation_runtime_config where id = 'default')
            ),
            body := '{}'::jsonb,
            timeout_milliseconds := 50000
          );
        end if;
      exception when others then
        raise warning 'WhatsApp campaign cron tick failed: %', sqlerrm;
      end;
    end
    $worker$;
  $cron$
);

-- Keep the five-minute TikTok due check. Skip expensive serverless HTTP +
-- numerous Supabase RPCs when no scheduled post or unresolved publication exists.
-- Hourly reconciliation protects media cleanup and health checks, even if a
-- publication has no corresponding claimable row.
create or replace function public.scheduler_publish_cron_should_invoke()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1 from public.scheduled_posts
    where status in ('SCHEDULED', 'FAILED_RETRYABLE')
      and scheduled_for <= now()
  ) or exists (
    select 1 from public.publish_attempts
    where publish_id is not null
      and (
        status = 'PROCESSING'
        or (status = 'NEEDS_ATTENTION' and error_code = 'POST_ACCEPTANCE_AMBIGUOUS')
      )
  ) or extract(minute from now()) < 5;
$fn$;

revoke all on function public.scheduler_publish_cron_should_invoke()
  from public, anon, authenticated;

-- Make the guarded behavior survive administrator reconfiguration of TikTok
-- scheduler credentials. Keep existing same-host validation and Vault semantics.
create or replace function public.configure_tiktok_scheduler_cron(
  p_base_url text,
  p_cron_secret text
)
returns table(jobname text, schedule text, active boolean)
language plpgsql
security definer
set search_path = public, extensions, vault
as $fn$
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
    base_url, 'webgrowth_scheduler_base_url',
    'Base URL used by Supabase Cron for Web Growth TikTok scheduler callbacks.'
  );
  perform vault.create_secret(
    cron_secret, 'webgrowth_scheduler_cron_secret',
    'Bearer token used by Supabase Cron when calling protected Web Growth scheduler callbacks.'
  );

  publish_command := $command$
    do $publish$
    begin
      if public.scheduler_publish_cron_should_invoke() then
        perform net.http_get(
          url := (
            select decrypted_secret from vault.decrypted_secrets
            where name = 'webgrowth_scheduler_base_url' limit 1
          ) || '/api/scheduler/cron/publish/',
          headers := jsonb_build_object(
            'Authorization',
            'Bearer ' || (
              select decrypted_secret from vault.decrypted_secrets
              where name = 'webgrowth_scheduler_cron_secret' limit 1
            )
          ),
          timeout_milliseconds := 30000
        );
      end if;
    end
    $publish$;
  $command$;

  cleanup_command := $command$
    select net.http_get(
      url := (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'webgrowth_scheduler_base_url' limit 1
      ) || '/api/scheduler/cron/cleanup/',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret from vault.decrypted_secrets
          where name = 'webgrowth_scheduler_cron_secret' limit 1
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
$fn$;

revoke execute on function public.configure_tiktok_scheduler_cron(text,text)
  from public, anon, authenticated;

-- Patch the existing schedule without rotating stored Vault secrets.
do $tiktok$
begin
  if exists (select 1 from cron.job where jobname = 'webgrowth-tiktok-publish-5m') then
    perform cron.unschedule('webgrowth-tiktok-publish-5m');
  end if;
end
$tiktok$;

select cron.schedule(
  'webgrowth-tiktok-publish-5m',
  '*/5 * * * *',
  $cron$
    do $publish$
    begin
      if public.scheduler_publish_cron_should_invoke() then
        perform net.http_get(
          url := (
            select decrypted_secret from vault.decrypted_secrets
            where name = 'webgrowth_scheduler_base_url' limit 1
          ) || '/api/scheduler/cron/publish/',
          headers := jsonb_build_object(
            'Authorization',
            'Bearer ' || (
              select decrypted_secret from vault.decrypted_secrets
              where name = 'webgrowth_scheduler_cron_secret' limit 1
            )
          ),
          timeout_milliseconds := 30000
        );
      end if;
    end
    $publish$;
  $cron$
);
