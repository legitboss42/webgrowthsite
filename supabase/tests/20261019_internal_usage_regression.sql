-- Read-only post-deployment checks. Should return rows; no writes.
select pg_size_pretty(pg_database_size(current_database())) as database_size;
select n.nspname as schema_name, c.relname as relation_name,
       pg_size_pretty(pg_total_relation_size(c.oid)) as total_size
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where (n.nspname = 'net' and c.relname = '_http_response')
   or (n.nspname = 'cron' and c.relname = 'job_run_details')
order by total_size desc;

select count(*) as cron_rows,
       count(*) filter (
         where start_time < now() - interval '7 days' and status is distinct from 'running'
       ) as expired_cron_rows,
       count(*) filter (where status = 'running') as active_runs
from cron.job_run_details;
select count(*) as recent_http_responses,
       min(created) as oldest_response
from net._http_response;

select jobname, schedule, active, left(command, 110) as command_prefix
from cron.job
where jobname in (
  'webgrowth-whatsapp-automation-processor',
  'webgrowth-whatsapp-campaign-processor',
  'webgrowth-whatsapp-processors',
  'webgrowth-tiktok-publish-5m',
  'webgrowth-tiktok-cleanup-daily',
  'webgrowth-internal-log-retention',
  'webgrowth-internal-log-compaction'
)
order by jobname;

select public.whatsapp_worker_has_work('automation') as automation_due,
       public.whatsapp_worker_has_work('campaign') as campaign_due,
       public.scheduler_publish_cron_should_invoke() as tiktok_should_invoke;

-- Strict invariants. The daily cron retention can lag by up to 24 hours,
-- and pg_net's cleanup is asynchronous. Tolerate ordinary time-boundary rollover.
-- Exception means release must be investigated.
do $verify$
begin
  if (select count(*) from cron.job
      where jobname = 'webgrowth-whatsapp-processors'
        and schedule = '* * * * *' and active) <> 1 then
    raise exception 'Consolidated WhatsApp minute job is missing';
  end if;

  if exists (select 1 from cron.job
             where jobname in (
               'webgrowth-whatsapp-automation-processor',
               'webgrowth-whatsapp-campaign-processor'
             ) and active) then
    raise exception 'Old duplicate WhatsApp cron jobs are still active';
  end if;

  if (select count(*) from cron.job
      where jobname = 'webgrowth-tiktok-publish-5m'
        and schedule = '*/5 * * * *' and active
        and position('scheduler_publish_cron_should_invoke' in command) > 0) <> 1 then
    raise exception 'Guarded TikTok five-minute publish job missing';
  end if;

  if (select count(*) from cron.job
      where jobname = 'webgrowth-tiktok-cleanup-daily'
        and schedule = '17 3 * * *' and active) <> 1 then
    raise exception 'TikTok daily cleanup missing';
  end if;

  if (select count(*) from cron.job
      where jobname = 'webgrowth-internal-log-retention'
        and schedule = '18 3 * * *' and active) <> 1 then
    raise exception 'Seven-day cron history retention is missing';
  end if;

  if (select count(*) from cron.job
      where jobname = 'webgrowth-internal-log-compaction'
        and schedule = '29 4 * * 0' and active) <> 1 then
    raise exception 'Weekly thresholded internal compaction job is missing';
  end if;

  if exists (select 1 from cron.job_run_details
             where start_time < now() - interval '8 days'
               and status is distinct from 'running') then
    raise exception 'Cron history exceeded the daily retention grace window';
  end if;

  if exists (select 1 from net._http_response
             where created < now() - interval '7 hours') then
    raise exception 'pg_net responses exceeded their cleanup grace window';
  end if;
end
$verify$;
