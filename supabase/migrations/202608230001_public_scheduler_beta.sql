begin;

alter table public.scheduler_users
  add column if not exists privacy_version text,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text,
  add column if not exists deletion_requested_at timestamptz;

alter table public.media_assets
  add column if not exists video_codec text,
  add column if not exists frame_rate numeric,
  add column if not exists validation_version text,
  add column if not exists probe_metadata jsonb,
  add column if not exists storage_deleted_at timestamptz,
  add column if not exists cleanup_state text not null default 'PENDING',
  add column if not exists cleanup_started_at timestamptz,
  add column if not exists cleanup_attempts integer not null default 0,
  add column if not exists cleanup_last_error_code text;

alter table public.media_assets
  drop constraint if exists media_assets_cleanup_state_check;

alter table public.media_assets
  add constraint media_assets_cleanup_state_check
  check (cleanup_state in ('PENDING', 'RUNNING', 'COMPLETE', 'NEEDS_ATTENTION'));

alter table public.media_staging_objects
  add column if not exists cleanup_state text not null default 'PENDING',
  add column if not exists cleanup_started_at timestamptz,
  add column if not exists cleanup_attempts integer not null default 0,
  add column if not exists cleanup_last_error_code text;

alter table public.media_staging_objects
  drop constraint if exists media_staging_objects_cleanup_state_check;

alter table public.media_staging_objects
  add constraint media_staging_objects_cleanup_state_check
  check (cleanup_state in ('PENDING', 'RUNNING', 'COMPLETE', 'NEEDS_ATTENTION'));

alter table public.scheduled_posts
  add column if not exists terminal_at timestamptz,
  add column if not exists retry_eligible boolean not null default false,
  add column if not exists next_retry_at timestamptz,
  add column if not exists user_failure_code text,
  add column if not exists scheduled_at timestamptz;

alter table public.publish_attempts
  add column if not exists attempt_number integer not null default 1;

with numbered_attempts as (
  select
    id,
    row_number() over (
      partition by post_id, approval_id
      order by created_at, id
    )::integer as attempt_number
  from public.publish_attempts
)
update public.publish_attempts attempt
set attempt_number = numbered_attempts.attempt_number
from numbered_attempts
where attempt.id = numbered_attempts.id
  and attempt.attempt_number <> numbered_attempts.attempt_number;

create unique index if not exists publish_attempts_number_idx
  on public.publish_attempts(post_id, approval_id, attempt_number);

alter table public.publish_attempts
  drop constraint if exists publish_attempts_post_id_approval_id_request_fingerprint_key;

create index if not exists scheduled_posts_active_queue_idx
  on public.scheduled_posts(user_id, scheduled_for)
  where status in ('SCHEDULED', 'FAILED_RETRYABLE', 'CLAIMED', 'SUBMITTING', 'PROCESSING')
    and terminal_at is null;

create index if not exists scheduled_posts_schedule_event_idx
  on public.scheduled_posts(user_id, scheduled_at)
  where scheduled_at is not null;

create index if not exists scheduler_users_deletion_cleanup_idx
  on public.scheduler_users(deletion_requested_at)
  where deletion_requested_at is not null;

create index if not exists scheduled_posts_terminal_cleanup_idx
  on public.scheduled_posts(terminal_at)
  where terminal_at is not null;

create index if not exists media_assets_storage_cleanup_idx
  on public.media_assets(cleanup_state, created_at)
  where storage_deleted_at is null;

create index if not exists media_staging_terminal_cleanup_idx
  on public.media_staging_objects(cleanup_state, created_at)
  where removed_at is null;

create table if not exists public.scheduler_account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.scheduler_users(id) on delete set null,
  user_reference_hash text not null,
  status text not null default 'REQUESTED'
    check (status in ('REQUESTED', 'RUNNING', 'COMPLETE', 'NEEDS_ATTENTION')),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  attempt_count integer not null default 0,
  last_error_code text,
  updated_at timestamptz not null default now()
);

comment on table public.scheduler_account_deletion_requests is
  'Minimal deletion receipt retained after account removal: state, timestamps, attempts, sanitized errors, and a one-way internal user reference only.';

alter table public.scheduler_account_deletion_requests enable row level security;

create index if not exists scheduler_account_deletion_work_idx
  on public.scheduler_account_deletion_requests(status, updated_at)
  where status in ('REQUESTED', 'RUNNING', 'NEEDS_ATTENTION');

create table if not exists public.scheduler_worker_health (
  worker_name text primary key,
  last_started_at timestamptz,
  last_succeeded_at timestamptz,
  last_error_code text,
  updated_at timestamptz not null default now()
);

alter table public.scheduler_worker_health enable row level security;

create or replace function public.claim_due_tiktok_posts(p_now timestamptz, p_limit integer)
returns setof public.scheduled_posts
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with ranked_due as (
    select
      post.id,
      post.scheduled_for,
      row_number() over (
        partition by post.user_id
        order by post.scheduled_for, post.id
      ) as user_rank
    from public.scheduled_posts post
    join public.scheduler_users user_record
      on user_record.id = post.user_id
      and user_record.status = 'ACTIVE'
      and user_record.suspended_at is null
      and user_record.deletion_requested_at is null
      and user_record.terms_version = '2026-08-23'
      and user_record.privacy_version = '2026-08-23'
    where post.terminal_at is null
      and post.scheduled_for <= p_now
      and (
        post.status = 'SCHEDULED'
        or (
          post.status = 'FAILED_RETRYABLE'
          and post.retry_eligible = true
          and post.next_retry_at is not null
          and post.next_retry_at <= p_now
        )
      )
  ), due as (
    select post.id
    from public.scheduled_posts post
    join ranked_due ranked on ranked.id = post.id
    where ranked.user_rank <= 2
    order by ranked.scheduled_for, post.id
    for update of post skip locked
    limit greatest(1, least(p_limit, 25))
  )
  update public.scheduled_posts post
  set
    status = 'CLAIMED',
    claim_token = gen_random_uuid(),
    claimed_at = p_now,
    updated_at = p_now
  from due
  where post.id = due.id
  returning post.*;
end;
$$;

create or replace function public.record_scheduler_worker_started(
  p_worker_name text,
  p_started_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(btrim(p_worker_name), '') = '' or p_started_at is null then return false; end if;
  insert into public.scheduler_worker_health as health (
    worker_name, last_started_at, last_error_code, updated_at
  ) values (
    left(btrim(p_worker_name), 80), p_started_at, null, p_started_at
  ) on conflict (worker_name) do update set
    last_started_at = excluded.last_started_at,
    last_error_code = null,
    updated_at = excluded.updated_at;
  return true;
end;
$$;

create or replace function public.record_scheduler_worker_succeeded(
  p_worker_name text,
  p_succeeded_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(btrim(p_worker_name), '') = '' or p_succeeded_at is null then return false; end if;
  insert into public.scheduler_worker_health as health (
    worker_name, last_succeeded_at, last_error_code, updated_at
  ) values (
    left(btrim(p_worker_name), 80), p_succeeded_at, null, p_succeeded_at
  ) on conflict (worker_name) do update set
    last_succeeded_at = excluded.last_succeeded_at,
    last_error_code = null,
    updated_at = excluded.updated_at;
  return true;
end;
$$;

create or replace function public.record_scheduler_worker_failure(
  p_worker_name text,
  p_error_code text,
  p_failed_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_error_code text := case
    when upper(btrim(coalesce(p_error_code, ''))) ~ '^[A-Z0-9_]{1,80}$'
      then upper(btrim(p_error_code))
    else 'WORKER_FAILURE'
  end;
begin
  if coalesce(btrim(p_worker_name), '') = '' or p_failed_at is null then return false; end if;
  insert into public.scheduler_worker_health as health (
    worker_name, last_error_code, updated_at
  ) values (
    left(btrim(p_worker_name), 80), v_error_code, p_failed_at
  ) on conflict (worker_name) do update set
    last_error_code = excluded.last_error_code,
    updated_at = excluded.updated_at;
  return true;
end;
$$;

create or replace function public.get_scheduler_owner_operations()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_heartbeat jsonb;
begin
  select jsonb_build_object(
    'lastStartedAt', health.last_started_at,
    'lastSucceededAt', health.last_succeeded_at,
    'lastErrorCode', health.last_error_code
  ) into v_heartbeat
  from public.scheduler_worker_health health
  where health.worker_name = 'tiktok-publishing';

  return jsonb_build_object(
    'users', (select jsonb_build_object(
      'total', count(*),
      'active', count(*) filter (where status = 'ACTIVE' and suspended_at is null),
      'suspended', count(*) filter (where status = 'SUSPENDED' or suspended_at is not null)
    ) from public.scheduler_users),
    'workflow', (select jsonb_build_object(
      'scheduled', count(*) filter (where status = 'SCHEDULED'),
      'overdue', count(*) filter (where status in ('SCHEDULED', 'FAILED_RETRYABLE') and scheduled_for < now()),
      'submitting', count(*) filter (where status in ('CLAIMED', 'SUBMITTING')),
      'processing', count(*) filter (where status = 'PROCESSING'),
      'published', count(*) filter (where status = 'PUBLISHED'),
      'failed', count(*) filter (where status in ('FAILED_RETRYABLE', 'NEEDS_ATTENTION')),
      'cancelled', count(*) filter (where status = 'CANCELLED')
    ) from public.scheduled_posts),
    'heartbeat', coalesce(v_heartbeat, jsonb_build_object('lastStartedAt', null, 'lastSucceededAt', null, 'lastErrorCode', null)),
    'cleanup', (select jsonb_build_object(
      'pending', count(*) filter (where cleanup_state in ('PENDING', 'RUNNING', 'NEEDS_ATTENTION')),
      'overdue', count(*) filter (where cleanup_state in ('PENDING', 'RUNNING', 'NEEDS_ATTENTION') and created_at <= now() - interval '7 days')
    ) from public.media_assets where storage_deleted_at is null),
    'reconnectRequired', (select count(*) from public.scheduler_users user_record
      left join public.tiktok_connections connection_record on connection_record.user_id = user_record.id
      where user_record.status = 'ACTIVE' and user_record.suspended_at is null
        and (connection_record.id is null or connection_record.access_expires_at <= now())),
    'failureCategories', (select coalesce(jsonb_object_agg(category, total), '{}'::jsonb) from (
      select user_failure_code as category, count(*)::integer as total
      from public.scheduled_posts
      where user_failure_code ~ '^[A-Z0-9_]{1,80}$'
      group by user_failure_code
    ) failures)
  );
end;
$$;

create or replace function public.suspend_scheduler_user(p_user_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.scheduler_users
  set status = 'SUSPENDED', suspended_at = now(), suspension_reason = left(btrim(coalesce(p_reason, '')), 240)
  where id = p_user_id and deletion_requested_at is null;
  return found;
end;
$$;

create or replace function public.restore_scheduler_user(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.scheduler_users
  set status = 'ACTIVE', suspended_at = null, suspension_reason = null
  where id = p_user_id and deletion_requested_at is null;
  return found;
end;
$$;

create or replace function public.reserve_public_scheduler_slot(
  p_post_id uuid,
  p_user_id uuid,
  p_scheduled_for timestamptz,
  p_timezone text,
  p_now timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daily_used integer;
  v_active_used integer;
begin
  if p_post_id is null
    or p_user_id is null
    or p_scheduled_for is null
    or p_timezone is null
    or btrim(p_timezone) = ''
    or p_now is null
    or p_scheduled_for <= p_now then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  perform 1
  from public.scheduler_users user_record
  where user_record.id = p_user_id
    and user_record.status = 'ACTIVE'
    and user_record.suspended_at is null
    and user_record.deletion_requested_at is null
    and user_record.terms_version = '2026-08-23'
    and user_record.privacy_version = '2026-08-23'
  for update;

  if not found then
    return false;
  end if;

  perform 1
  from public.scheduled_posts post
  join public.post_approvals approval
    on approval.id = post.approval_id
    and approval.post_id = post.id
    and approval.user_id = post.user_id
  where post.id = p_post_id
    and post.user_id = p_user_id
    and post.status in ('DRAFT', 'NEEDS_CONNECTION', 'NEEDS_APPROVAL')
    and approval.invalidated_at is null
  for update of post;

  if not found then
    return false;
  end if;

  select
    count(*) filter (
      where post.scheduled_at >= p_now - interval '24 hours'
    ),
    count(*) filter (
      where post.status in ('SCHEDULED', 'FAILED_RETRYABLE', 'CLAIMED', 'SUBMITTING', 'PROCESSING')
        and post.terminal_at is null
        and post.scheduled_for > p_now
    )
  into v_daily_used, v_active_used
  from public.scheduled_posts post
  where post.user_id = p_user_id;

  if v_daily_used >= 3 or v_active_used >= 20 then
    return false;
  end if;

  update public.scheduled_posts post
  set
    status = 'SCHEDULED',
    scheduled_for = p_scheduled_for,
    timezone = p_timezone,
    scheduled_at = p_now,
    updated_at = p_now
  where post.id = p_post_id
    and post.user_id = p_user_id;

  return true;
end;
$$;

create or replace function public.create_safe_publish_retry(
  p_post_id uuid,
  p_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_approval_id uuid;
  v_approval_fingerprint text;
  v_last_attempt_number integer;
  v_next_attempt_number integer;
  v_current_attempt_status text;
  v_current_error_code text;
  v_current_publish_id text;
begin
  if p_post_id is null or p_user_id is null then
    return null;
  end if;

  perform 1
  from public.scheduler_users user_record
  where user_record.id = p_user_id
    and user_record.status = 'ACTIVE'
    and user_record.suspended_at is null
    and user_record.deletion_requested_at is null
    and user_record.terms_version = '2026-08-23'
    and user_record.privacy_version = '2026-08-23'
  for update;

  if not found then
    return null;
  end if;

  select post.approval_id, approval.fingerprint
  into v_approval_id, v_approval_fingerprint
  from public.scheduled_posts post
  join public.post_approvals approval
    on approval.id = post.approval_id
    and approval.post_id = post.id
    and approval.user_id = post.user_id
  where post.id = p_post_id
    and post.user_id = p_user_id
    and post.status = 'FAILED_RETRYABLE'
    and post.retry_eligible = true
    and post.terminal_at is null
    and (post.next_retry_at is null or post.next_retry_at <= now())
    and approval.invalidated_at is null
  for update of post, approval;

  if not found or v_approval_id is null then
    return null;
  end if;

  perform 1
  from public.publish_attempts attempt
  where attempt.post_id = p_post_id
    and attempt.approval_id = v_approval_id
  order by attempt.attempt_number
  for update;

  if not found then
    return null;
  end if;

  select max(attempt.attempt_number)
  into v_last_attempt_number
  from public.publish_attempts attempt
  where attempt.post_id = p_post_id
    and attempt.approval_id = v_approval_id;

  if v_last_attempt_number is null or v_last_attempt_number >= 5 then
    return null;
  end if;

  if exists (
    select 1
    from public.publish_attempts attempt
    where attempt.post_id = p_post_id
      and attempt.approval_id = v_approval_id
      and attempt.status in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
  ) then
    return null;
  end if;

  if exists (
    select 1
    from public.publish_attempts attempt
    where attempt.post_id = p_post_id
      and attempt.approval_id = v_approval_id
      and attempt.publish_id is not null
      and attempt.status <> 'NEEDS_ATTENTION'
  ) then
    return null;
  end if;

  select attempt.status, attempt.error_code, attempt.publish_id
  into v_current_attempt_status, v_current_error_code, v_current_publish_id
  from public.publish_attempts attempt
  join public.post_approvals approval
    on approval.id = attempt.approval_id
    and approval.fingerprint = attempt.request_fingerprint
  where attempt.post_id = p_post_id
    and attempt.approval_id = v_approval_id
    and attempt.attempt_number = v_last_attempt_number
    and attempt.request_fingerprint = v_approval_fingerprint;

  if not found
    or v_current_attempt_status in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
    or not (
      (
        v_current_attempt_status = 'FAILED_RETRYABLE'
        and v_current_publish_id is null
        and upper(btrim(v_current_error_code)) in ('PRE_ACCEPTANCE_INFRASTRUCTURE')
      )
      or (
        v_current_attempt_status = 'NEEDS_ATTENTION'
        and v_current_publish_id is not null
        and upper(btrim(v_current_error_code)) in (
          'DURATION_CHECK_FAILED',
          'FILE_FORMAT_CHECK_FAILED',
          'FRAME_RATE_CHECK_FAILED',
          'PICTURE_SIZE_CHECK_FAILED',
          'PHOTO_PROCESS_FAILED',
          'PHOTO_PULL_FAILED',
          'VIDEO_PROCESS_FAILED',
          'VIDEO_PULL_FAILED'
        )
      )
    ) then
    return null;
  end if;

  v_next_attempt_number := v_last_attempt_number + 1;

  insert into public.publish_attempts (
    post_id,
    approval_id,
    request_fingerprint,
    attempt_number,
    status
  )
  values (
    p_post_id,
    v_approval_id,
    v_approval_fingerprint,
    v_next_attempt_number,
    'SCHEDULED'
  );

  update public.scheduled_posts post
  set
    status = 'SCHEDULED',
    retry_eligible = false,
    next_retry_at = null,
    user_failure_code = null,
    claim_token = null,
    claimed_at = null,
    updated_at = now()
  where post.id = p_post_id
    and post.user_id = p_user_id;

  return v_next_attempt_number;
end;
$$;

create or replace function public.begin_tiktok_publish_submission(
  p_post_id uuid,
  p_user_id uuid,
  p_claim_token uuid,
  p_attempt_id uuid,
  p_attempt_number integer,
  p_approval_id uuid,
  p_request_fingerprint text,
  p_validation_version text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_kind text;
  v_total_media_count integer := 0;
  v_valid_media_count integer := 0;
  v_locked_media_id uuid;
  v_locked_asset_id uuid;
  v_attempt_count integer := 0;
  v_post_count integer := 0;
begin
  if p_post_id is null
    or p_user_id is null
    or p_claim_token is null
    or p_attempt_id is null
    or p_attempt_number is null
    or p_attempt_number < 1
    or p_approval_id is null
    or p_request_fingerprint is null
    or btrim(p_request_fingerprint) = ''
    or p_validation_version is null
    or btrim(p_validation_version) = '' then
    return false;
  end if;

  perform 1
  from public.scheduler_users user_record
  where user_record.id = p_user_id
    and user_record.status = 'ACTIVE'
    and user_record.suspended_at is null
    and user_record.deletion_requested_at is null
    and user_record.terms_version = '2026-08-23'
    and user_record.privacy_version = '2026-08-23'
  for update of user_record;

  if not found then
    return false;
  end if;

  select post.kind
  into v_post_kind
  from public.scheduled_posts post
  join public.post_approvals approval
    on approval.id = post.approval_id
    and approval.post_id = post.id
    and approval.user_id = post.user_id
  join public.publish_attempts attempt
    on attempt.id = p_attempt_id
    and attempt.post_id = post.id
    and attempt.approval_id = approval.id
    and attempt.request_fingerprint = approval.fingerprint
  where post.id = p_post_id
    and post.user_id = p_user_id
    and post.claim_token = p_claim_token
    and post.status = 'CLAIMED'
    and post.terminal_at is null
    and approval.id = p_approval_id
    and approval.fingerprint = p_request_fingerprint
    and approval.invalidated_at is null
    and attempt.attempt_number = p_attempt_number
    and attempt.attempt_number = (
      select max(current_attempt.attempt_number)
      from public.publish_attempts current_attempt
      where current_attempt.post_id = post.id
        and current_attempt.approval_id = approval.id
    )
    and attempt.status = 'SCHEDULED'
    and attempt.publish_id is null
  for update of post, approval, attempt;

  if not found then
    return false;
  end if;

  for v_locked_media_id in
    select post_media.media_id
    from public.post_media post_media
    where post_media.post_id = p_post_id
    order by post_media.position
    for update of post_media
  loop
    null;
  end loop;

  for v_locked_asset_id in
    select asset.id
    from public.media_assets asset
    join public.post_media post_media on post_media.media_id = asset.id
    where post_media.post_id = p_post_id
    order by asset.id
    for update of asset
  loop
    null;
  end loop;

  select
    count(*),
    count(*) filter (
      where asset.user_id = p_user_id
        and asset.kind = v_post_kind
        and asset.validation_status = 'VALID'
        and (
          v_post_kind <> 'VIDEO'
          or asset.validation_version = p_validation_version
        )
    )
  into v_total_media_count, v_valid_media_count
  from public.post_media post_media
  join public.media_assets asset on asset.id = post_media.media_id
  where post_media.post_id = p_post_id;

  if v_total_media_count < 1
    or v_total_media_count > 10
    or v_total_media_count <> v_valid_media_count
    or (v_post_kind = 'VIDEO' and v_total_media_count <> 1) then
    return false;
  end if;

  update public.publish_attempts attempt
  set
    status = 'SUBMITTING',
    error_code = null,
    error_message = null,
    updated_at = now()
  where attempt.id = p_attempt_id
    and attempt.post_id = p_post_id
    and attempt.approval_id = p_approval_id
    and attempt.attempt_number = p_attempt_number
    and attempt.status = 'SCHEDULED'
    and attempt.publish_id is null;
  get diagnostics v_attempt_count = row_count;

  update public.scheduled_posts post
  set
    status = 'SUBMITTING',
    retry_eligible = false,
    next_retry_at = null,
    updated_at = now()
  where post.id = p_post_id
    and post.user_id = p_user_id
    and post.claim_token = p_claim_token
    and post.status = 'CLAIMED';
  get diagnostics v_post_count = row_count;

  if v_attempt_count <> 1 or v_post_count <> 1 then
    raise exception 'TikTok submission state transition was not exact' using errcode = 'P0001';
  end if;

  return true;
end;
$$;

create or replace function public.record_tiktok_publish_id(
  p_post_id uuid,
  p_user_id uuid,
  p_claim_token uuid,
  p_attempt_id uuid,
  p_attempt_number integer,
  p_publish_id text,
  p_submitted_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_count integer := 0;
  v_post_count integer := 0;
begin
  if p_post_id is null
    or p_user_id is null
    or p_claim_token is null
    or p_attempt_id is null
    or p_attempt_number is null
    or p_attempt_number < 1
    or p_publish_id is null
    or btrim(p_publish_id) = ''
    or p_submitted_at is null then
    return false;
  end if;

  perform 1
  from public.scheduled_posts post
  join public.publish_attempts attempt
    on attempt.id = p_attempt_id
    and attempt.post_id = post.id
    and attempt.approval_id = post.approval_id
  where post.id = p_post_id
    and post.user_id = p_user_id
    and post.claim_token = p_claim_token
    and post.status in ('SUBMITTING', 'PROCESSING', 'CLAIMED')
    and (post.publish_id is null or post.publish_id = p_publish_id)
    and attempt.attempt_number = p_attempt_number
    and attempt.attempt_number = (
      select max(current_attempt.attempt_number)
      from public.publish_attempts current_attempt
      where current_attempt.post_id = post.id
        and current_attempt.approval_id = attempt.approval_id
    )
    and attempt.status in ('SUBMITTING', 'PROCESSING')
    and (attempt.publish_id is null or attempt.publish_id = p_publish_id)
  for update of post, attempt;

  if not found then
    return false;
  end if;

  update public.publish_attempts attempt
  set
    publish_id = p_publish_id,
    status = 'PROCESSING',
    submitted_at = coalesce(attempt.submitted_at, p_submitted_at),
    error_code = null,
    error_message = null,
    updated_at = now()
  where attempt.id = p_attempt_id
    and attempt.post_id = p_post_id
    and attempt.attempt_number = p_attempt_number
    and (attempt.publish_id is null or attempt.publish_id = p_publish_id);
  get diagnostics v_attempt_count = row_count;

  update public.scheduled_posts post
  set
    publish_id = p_publish_id,
    status = 'PROCESSING',
    retry_eligible = false,
    next_retry_at = null,
    terminal_at = null,
    updated_at = now()
  where post.id = p_post_id
    and post.user_id = p_user_id
    and post.claim_token = p_claim_token
    and (post.publish_id is null or post.publish_id = p_publish_id);
  get diagnostics v_post_count = row_count;

  if v_attempt_count <> 1 or v_post_count <> 1 then
    raise exception 'TikTok publish ID persistence was not exact' using errcode = 'P0001';
  end if;

  return true;
end;
$$;

create or replace function public.record_tiktok_publish_failure(
  p_post_id uuid,
  p_user_id uuid,
  p_claim_token uuid,
  p_attempt_id uuid,
  p_attempt_number integer,
  p_failure_kind text,
  p_error_code text,
  p_failed_at timestamptz,
  p_publish_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_effective_attempt_id uuid;
  v_effective_attempt_number integer;
  v_existing_attempt_publish_id text;
  v_existing_post_publish_id text;
  v_publish_id text;
  v_failure_kind text;
  v_error_code text;
  v_attempt_status text;
  v_post_status text;
  v_user_failure_code text;
  v_next_retry_at timestamptz;
  v_terminal_at timestamptz;
  v_attempt_count integer := 0;
  v_post_count integer := 0;
begin
  if p_post_id is null
    or p_user_id is null
    or p_claim_token is null
    or ((p_attempt_id is null) <> (p_attempt_number is null))
    or (p_attempt_number is not null and p_attempt_number < 1)
    or p_failure_kind is null
    or p_error_code is null
    or p_failed_at is null then
    return false;
  end if;

  if p_attempt_id is null and p_attempt_number is null then
    perform 1
    from public.scheduled_posts post
    where post.id = p_post_id
      and post.user_id = p_user_id
      and post.claim_token = p_claim_token
      and post.status = 'CLAIMED'
    for update of post;

    if not found then
      return false;
    end if;

    select attempt.id, attempt.attempt_number, attempt.publish_id, post.publish_id
    into v_effective_attempt_id, v_effective_attempt_number, v_existing_attempt_publish_id, v_existing_post_publish_id
    from public.scheduled_posts post
    join public.publish_attempts attempt
      on attempt.post_id = post.id
      and attempt.approval_id = post.approval_id
    where post.id = p_post_id
      and post.user_id = p_user_id
      and post.claim_token = p_claim_token
      and post.status = 'CLAIMED'
      and attempt.status in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
      and attempt.attempt_number = (
        select max(current_attempt.attempt_number)
        from public.publish_attempts current_attempt
        where current_attempt.post_id = post.id
          and current_attempt.approval_id = attempt.approval_id
      )
    order by attempt.attempt_number desc
    limit 1
    for update of attempt;

    if found then
      null;
    else
      update public.scheduled_posts post
      set
        status = 'NEEDS_ATTENTION',
        retry_eligible = false,
        next_retry_at = null,
        user_failure_code = 'PUBLISH_BLOCKED',
        terminal_at = p_failed_at,
        updated_at = now()
      where post.id = p_post_id
        and post.user_id = p_user_id
        and post.claim_token = p_claim_token
        and post.status = 'CLAIMED';
      get diagnostics v_post_count = row_count;

      if v_post_count <> 1 then
        raise exception 'TikTok claim failure persistence was not exact' using errcode = 'P0001';
      end if;

      return true;
    end if;
  else
    v_effective_attempt_id := p_attempt_id;
    v_effective_attempt_number := p_attempt_number;

    select attempt.publish_id, post.publish_id
    into v_existing_attempt_publish_id, v_existing_post_publish_id
    from public.scheduled_posts post
    join public.publish_attempts attempt
      on attempt.id = p_attempt_id
      and attempt.post_id = post.id
      and attempt.approval_id = post.approval_id
    where post.id = p_post_id
      and post.user_id = p_user_id
      and post.claim_token = p_claim_token
      and post.status in ('CLAIMED', 'SUBMITTING', 'PROCESSING')
      and attempt.attempt_number = p_attempt_number
      and attempt.attempt_number = (
        select max(current_attempt.attempt_number)
        from public.publish_attempts current_attempt
        where current_attempt.post_id = post.id
          and current_attempt.approval_id = attempt.approval_id
      )
      and attempt.status in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
    for update of post, attempt;

    if not found then
      return false;
    end if;
  end if;

  if (v_existing_attempt_publish_id is not null and p_publish_id is not null and v_existing_attempt_publish_id <> p_publish_id)
    or (v_existing_post_publish_id is not null and p_publish_id is not null and v_existing_post_publish_id <> p_publish_id)
    or (v_existing_attempt_publish_id is not null and v_existing_post_publish_id is not null and v_existing_attempt_publish_id <> v_existing_post_publish_id) then
    return false;
  end if;

  v_publish_id := coalesce(v_existing_attempt_publish_id, v_existing_post_publish_id, p_publish_id);
  v_failure_kind := upper(btrim(p_failure_kind));
  v_error_code := upper(btrim(p_error_code));

  if v_publish_id is null
    and v_failure_kind = 'SAFE'
    and v_error_code = 'PRE_ACCEPTANCE_INFRASTRUCTURE'
    and v_effective_attempt_number < 5 then
    v_attempt_status := 'FAILED_RETRYABLE';
    v_post_status := 'FAILED_RETRYABLE';
    v_user_failure_code := 'PUBLISH_RETRY_SCHEDULED';
    v_next_retry_at := p_failed_at + least(
      interval '15 minutes',
      interval '1 minute' * power(2::numeric, greatest(0, least(30, v_effective_attempt_number - 1)))::double precision
    );
    v_terminal_at := null;
  else
    v_attempt_status := 'NEEDS_ATTENTION';
    v_post_status := 'NEEDS_ATTENTION';
    v_next_retry_at := null;
    v_terminal_at := p_failed_at;
    if v_publish_id is not null or v_failure_kind = 'AMBIGUOUS' then
      v_error_code := 'POST_ACCEPTANCE_AMBIGUOUS';
      v_user_failure_code := 'PUBLISH_RECONCILIATION_REQUIRED';
    else
      v_user_failure_code := 'PUBLISH_BLOCKED';
    end if;
  end if;

  update public.publish_attempts attempt
  set
    status = v_attempt_status,
    publish_id = v_publish_id,
    submitted_at = case
      when v_publish_id is not null then coalesce(attempt.submitted_at, p_failed_at)
      else attempt.submitted_at
    end,
    error_code = v_error_code,
    error_message = null,
    updated_at = now()
  where attempt.id = v_effective_attempt_id
    and attempt.post_id = p_post_id
    and attempt.attempt_number = v_effective_attempt_number;
  get diagnostics v_attempt_count = row_count;

  update public.scheduled_posts post
  set
    status = v_post_status,
    publish_id = v_publish_id,
    retry_eligible = v_post_status = 'FAILED_RETRYABLE',
    next_retry_at = v_next_retry_at,
    user_failure_code = v_user_failure_code,
    terminal_at = v_terminal_at,
    updated_at = now()
  where post.id = p_post_id
    and post.user_id = p_user_id
    and post.claim_token = p_claim_token;
  get diagnostics v_post_count = row_count;

  if v_attempt_count <> 1 or v_post_count <> 1 then
    raise exception 'TikTok publish failure persistence was not exact' using errcode = 'P0001';
  end if;

  return true;
end;
$$;

create or replace function public.create_public_scheduler_post(
  p_user_id uuid,
  p_media_ids uuid[],
  p_title text,
  p_caption text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid;
  v_kind text;
  v_requested_count integer;
  v_distinct_count integer;
  v_owned_count integer;
  v_single_kind boolean;
  v_video_count integer;
  v_locked_asset_id uuid;
begin
  if p_user_id is null or p_media_ids is null or p_title is null or p_caption is null then
    return jsonb_build_object('ok', false, 'code', 'INVALID_MEDIA');
  end if;

  perform 1
  from public.scheduler_users user_record
  where user_record.id = p_user_id
    and user_record.status = 'ACTIVE'
    and user_record.suspended_at is null
    and user_record.deletion_requested_at is null
    and user_record.terms_version = '2026-08-23'
    and user_record.privacy_version = '2026-08-23'
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'ACCESS_DENIED');
  end if;

  v_requested_count := cardinality(p_media_ids);
  if not (cardinality(p_media_ids) between 1 and 10) then
    return jsonb_build_object('ok', false, 'code', 'INVALID_MEDIA');
  end if;

  select count(distinct requested_id)
  into v_distinct_count
  from unnest(p_media_ids) requested(requested_id);

  if v_distinct_count <> cardinality(p_media_ids) then
    return jsonb_build_object('ok', false, 'code', 'INVALID_MEDIA');
  end if;

  for v_locked_asset_id in
    select asset.id
    from public.media_assets asset
    where asset.id = any(p_media_ids)
    order by asset.id
    for update of asset
  loop
    null;
  end loop;

  select
    count(*),
    count(distinct asset.kind) = 1,
    count(*) filter (where asset.kind = 'VIDEO'),
    min(asset.kind)
  into v_owned_count, v_single_kind, v_video_count, v_kind
  from unnest(p_media_ids) requested(requested_id)
  join public.media_assets asset
    on asset.id = requested.requested_id
    and asset.user_id = p_user_id
    and asset.validation_status = 'VALID'
    and asset.storage_deleted_at is null
    and asset.cleanup_state = 'PENDING';

  if v_owned_count <> v_requested_count then
    return jsonb_build_object('ok', false, 'code', 'MEDIA_OWNERSHIP');
  end if;

  if not v_single_kind or (v_video_count > 0 and cardinality(p_media_ids) <> 1) then
    return jsonb_build_object('ok', false, 'code', 'INVALID_MEDIA');
  end if;

  insert into public.scheduled_posts (user_id, kind, title, caption, status)
  values (p_user_id, v_kind, p_title, p_caption, 'NEEDS_APPROVAL')
  returning id into v_post_id;

  insert into public.post_media (post_id, media_id, position)
  select v_post_id, requested_id, (ordinality - 1)::integer
  from unnest(p_media_ids) with ordinality requested(requested_id, ordinality);

  return jsonb_build_object('ok', true, 'postId', v_post_id::text);
end;
$$;

create or replace function public.approve_public_scheduler_post(
  p_user_id uuid,
  p_post_id uuid,
  p_fingerprint text,
  p_snapshot jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_open_id text;
  v_post public.scheduled_posts%rowtype;
  v_total_media_count integer;
  v_media_count integer;
  v_snapshot_match_count integer;
  v_approval_id uuid;
  v_updated_post_id uuid;
  v_locked_media_id uuid;
  v_locked_asset_id uuid;
begin
  if p_user_id is null
    or p_post_id is null
    or p_fingerprint is null
    or p_fingerprint !~ '^[0-9a-f]{64}$'
    or p_snapshot is null then
    return jsonb_build_object('ok', false, 'code', 'POST_CHANGED');
  end if;

  select user_record.tiktok_open_id
  into v_user_open_id
  from public.scheduler_users user_record
  where user_record.id = p_user_id
    and user_record.status = 'ACTIVE'
    and user_record.suspended_at is null
    and user_record.deletion_requested_at is null
    and user_record.terms_version = '2026-08-23'
    and user_record.privacy_version = '2026-08-23'
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'ACCESS_DENIED');
  end if;

  select post.*
  into v_post
  from public.scheduled_posts post
  where post.id = p_post_id
    and post.user_id = p_user_id
    and post.status in ('DRAFT', 'NEEDS_CONNECTION', 'NEEDS_APPROVAL')
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'POST_NOT_FOUND');
  end if;

  if jsonb_typeof(p_snapshot) <> 'object'
    or jsonb_typeof(p_snapshot -> 'media') <> 'array'
    or p_snapshot ->> 'creatorOpenId' <> v_user_open_id
    or p_snapshot ->> 'title' <> v_post.title
    or p_snapshot ->> 'caption' <> v_post.caption then
    return jsonb_build_object('ok', false, 'code', 'POST_CHANGED');
  end if;

  for v_locked_media_id in
    select post_media.media_id
    from public.post_media post_media
    where post_media.post_id = p_post_id
    order by post_media.position
    for update of post_media
  loop
    null;
  end loop;

  for v_locked_asset_id in
    select asset.id
    from public.media_assets asset
    join public.post_media post_media on post_media.media_id = asset.id
    where post_media.post_id = p_post_id
    order by asset.id
    for update of asset
  loop
    null;
  end loop;

  select count(*)
  into v_total_media_count
  from public.post_media post_media
  where post_media.post_id = p_post_id;

  select count(*)
  into v_media_count
  from public.post_media post_media
  join public.media_assets asset
    on asset.id = post_media.media_id
    and asset.user_id = p_user_id
    and asset.validation_status = 'VALID'
    and asset.storage_deleted_at is null
    and asset.cleanup_state = 'PENDING'
  where post_media.post_id = p_post_id;

  if v_total_media_count <> v_media_count
    or jsonb_array_length(p_snapshot -> 'media') <> v_media_count then
    return jsonb_build_object('ok', false, 'code', 'POST_CHANGED');
  end if;

  select count(distinct post_media.position)
  into v_snapshot_match_count
  from public.post_media post_media
  join public.media_assets asset
    on asset.id = post_media.media_id
    and asset.user_id = p_user_id
    and asset.validation_status = 'VALID'
    and asset.storage_deleted_at is null
    and asset.cleanup_state = 'PENDING'
  join lateral jsonb_array_elements(p_snapshot -> 'media') media_item
    on media_item ->> 'id' = asset.id::text
    and media_item ->> 'checksum' = asset.checksum
    and media_item ->> 'position' = post_media.position::text
  where post_media.post_id = p_post_id;

  if v_snapshot_match_count <> v_media_count then
    return jsonb_build_object('ok', false, 'code', 'POST_CHANGED');
  end if;

  insert into public.post_approvals (post_id, user_id, fingerprint, snapshot)
  values (p_post_id, p_user_id, p_fingerprint, p_snapshot)
  on conflict (post_id, fingerprint) do nothing
  returning id into v_approval_id;

  if v_approval_id is null then
    select approval.id
    into v_approval_id
    from public.post_approvals approval
    where approval.post_id = p_post_id
      and approval.user_id = p_user_id
      and approval.fingerprint = p_fingerprint
      and approval.snapshot = p_snapshot
      and approval.invalidated_at is null;
  end if;

  if v_approval_id is null then
    return jsonb_build_object('ok', false, 'code', 'POST_CHANGED');
  end if;

  update public.scheduled_posts post
  set
    approval_id = v_approval_id,
    status = 'NEEDS_APPROVAL',
    updated_at = now()
  where post.id = p_post_id
    and post.user_id = p_user_id
  returning post.id into v_updated_post_id;

  if v_updated_post_id is null then
    raise exception 'Atomic approval post update failed.' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'ok', true,
    'postId', p_post_id::text,
    'approvalId', v_approval_id::text
  );
end;
$$;

create or replace function public.save_active_tiktok_connection(
  p_user_id uuid,
  p_tiktok_open_id text,
  p_encrypted_tokens text,
  p_scopes text[],
  p_access_expires_at timestamptz,
  p_refresh_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null
    or p_tiktok_open_id is null
    or p_encrypted_tokens is null
    or p_scopes is null
    or p_access_expires_at is null
    or p_refresh_expires_at is null then
    return false;
  end if;

  perform 1
  from public.scheduler_users user_record
  where user_record.id = p_user_id
    and user_record.tiktok_open_id = p_tiktok_open_id
    and user_record.status = 'ACTIVE'
    and user_record.suspended_at is null
    and user_record.deletion_requested_at is null
  for update;

  if not found then
    return false;
  end if;

  insert into public.tiktok_connections (
    user_id,
    encrypted_tokens,
    scopes,
    access_expires_at,
    refresh_expires_at,
    reconnect_required
  )
  values (
    p_user_id,
    p_encrypted_tokens,
    p_scopes,
    p_access_expires_at,
    p_refresh_expires_at,
    false
  )
  on conflict (user_id) do update
  set
    encrypted_tokens = excluded.encrypted_tokens,
    scopes = excluded.scopes,
    access_expires_at = excluded.access_expires_at,
    refresh_expires_at = excluded.refresh_expires_at,
    reconnect_required = false,
    updated_at = now();

  return true;
end;
$$;

create or replace function public.refresh_active_tiktok_connection(
  p_user_id uuid,
  p_expected_encrypted_tokens text,
  p_encrypted_tokens text,
  p_scopes text[],
  p_access_expires_at timestamptz,
  p_refresh_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_count integer := 0;
begin
  if p_user_id is null
    or p_expected_encrypted_tokens is null
    or p_encrypted_tokens is null
    or p_scopes is null
    or p_access_expires_at is null
    or p_refresh_expires_at is null then
    return false;
  end if;

  perform 1
  from public.scheduler_users user_record
  where user_record.id = p_user_id
    and user_record.status = 'ACTIVE'
    and user_record.suspended_at is null
    and user_record.deletion_requested_at is null
  for update;

  if not found then
    return false;
  end if;

  update public.tiktok_connections connection_record
  set
    encrypted_tokens = p_encrypted_tokens,
    scopes = p_scopes,
    access_expires_at = p_access_expires_at,
    refresh_expires_at = p_refresh_expires_at,
    reconnect_required = false,
    updated_at = now()
  where connection_record.user_id = p_user_id
    and connection_record.encrypted_tokens = p_expected_encrypted_tokens;

  get diagnostics v_updated_count = row_count;
  return v_updated_count = 1;
end;
$$;

create or replace function public.disconnect_tiktok_scheduler_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cancelled integer := 0;
begin
  if p_user_id is null then
    return null;
  end if;

  perform 1
  from public.scheduler_users user_record
  where user_record.id = p_user_id
    and user_record.deletion_requested_at is null
  for update;

  if not found then
    return null;
  end if;

  delete from public.tiktok_connections connection_record
  where connection_record.user_id = p_user_id;

  update public.publish_attempts attempt
  set
    status = 'CANCELLED',
    completed_at = coalesce(attempt.completed_at, now()),
    error_code = 'CONNECTION_DISCONNECTED',
    updated_at = now()
  from public.scheduled_posts post
  where attempt.post_id = post.id
    and post.user_id = p_user_id
    and post.status in ('SCHEDULED', 'FAILED_RETRYABLE')
    and post.publish_id is null
    and attempt.status = 'SCHEDULED'
    and attempt.publish_id is null
    and not exists (
      select 1
      from public.publish_attempts active_attempt
      where active_attempt.post_id = post.id
        and (
          active_attempt.publish_id is not null
          or active_attempt.status in ('SUBMITTING', 'PROCESSING')
        )
    );

  update public.scheduled_posts post
  set
    status = 'CANCELLED',
    terminal_at = coalesce(post.terminal_at, now()),
    retry_eligible = false,
    next_retry_at = null,
    user_failure_code = 'CONNECTION_DISCONNECTED',
    updated_at = now()
  where post.user_id = p_user_id
    and post.status in ('SCHEDULED', 'FAILED_RETRYABLE')
    and post.publish_id is null
    and not exists (
      select 1
      from public.publish_attempts attempt
      where attempt.post_id = post.id
        and (
          attempt.publish_id is not null
          or attempt.status in ('SUBMITTING', 'PROCESSING')
        )
    );

  get diagnostics v_cancelled = row_count;

  insert into public.scheduler_audit_log (
    actor_user_id,
    target_type,
    target_id,
    event_type,
    metadata
  ) values (
    p_user_id,
    'scheduler_user',
    p_user_id,
    'TIKTOK_CONNECTION_DISCONNECTED',
    jsonb_build_object('cancelledJobs', v_cancelled)
  );

  return jsonb_build_object('ok', true, 'cancelledJobs', v_cancelled);
end;
$$;

create or replace function public.request_scheduler_account_deletion(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_state text;
  v_created boolean := false;
  v_requested_at timestamptz := now();
begin
  if p_user_id is null then
    return null;
  end if;

  perform 1
  from public.scheduler_users user_record
  where user_record.id = p_user_id
  for update;

  if not found then
    return null;
  end if;

  select request.id, request.status
  into v_request_id, v_state
  from public.scheduler_account_deletion_requests request
  where request.user_id = p_user_id
  for update;

  if v_request_id is null then
    insert into public.scheduler_account_deletion_requests (
      user_id,
      user_reference_hash,
      status,
      requested_at,
      updated_at
    ) values (
      p_user_id,
      encode(digest(p_user_id::text, 'sha256'), 'hex'),
      'REQUESTED',
      v_requested_at,
      v_requested_at
    )
    returning id, status into v_request_id, v_state;
    v_created := true;
  end if;

  update public.scheduler_users user_record
  set
    deletion_requested_at = coalesce(user_record.deletion_requested_at, v_requested_at),
    updated_at = v_requested_at
  where user_record.id = p_user_id;

  delete from public.tiktok_connections connection_record
  where connection_record.user_id = p_user_id;

  update public.publish_attempts attempt
  set
    status = 'CANCELLED',
    completed_at = coalesce(attempt.completed_at, v_requested_at),
    error_code = 'ACCOUNT_DELETION_REQUESTED',
    updated_at = v_requested_at
  from public.scheduled_posts post
  where attempt.post_id = post.id
    and post.user_id = p_user_id
    and post.status in ('SCHEDULED', 'FAILED_RETRYABLE')
    and post.publish_id is null
    and attempt.status = 'SCHEDULED'
    and attempt.publish_id is null
    and not exists (
      select 1
      from public.publish_attempts active_attempt
      where active_attempt.post_id = post.id
        and (
          active_attempt.publish_id is not null
          or active_attempt.status in ('SUBMITTING', 'PROCESSING')
        )
    );

  update public.scheduled_posts post
  set
    status = 'CANCELLED',
    terminal_at = coalesce(post.terminal_at, v_requested_at),
    retry_eligible = false,
    next_retry_at = null,
    user_failure_code = 'ACCOUNT_DELETION_REQUESTED',
    updated_at = v_requested_at
  where post.user_id = p_user_id
    and post.status in ('SCHEDULED', 'FAILED_RETRYABLE')
    and post.publish_id is null
    and not exists (
      select 1
      from public.publish_attempts attempt
      where attempt.post_id = post.id
        and (
          attempt.publish_id is not null
          or attempt.status in ('SUBMITTING', 'PROCESSING')
        )
    );

  if v_created then
    insert into public.scheduler_audit_log (
      actor_user_id,
      target_type,
      target_id,
      event_type,
      metadata
    ) values (
      p_user_id,
      'account_deletion_request',
      v_request_id,
      'ACCOUNT_DELETION_REQUESTED',
      '{}'::jsonb
    );
  end if;

  return jsonb_build_object('requestId', v_request_id::text, 'state', v_state);
end;
$$;

create or replace function public.claim_scheduler_media_cleanup(p_now timestamptz, p_limit integer)
returns table (
  id uuid,
  user_id uuid,
  storage_path text,
  created_at timestamptz,
  terminal_at timestamptz,
  terminal_status text,
  attached_to_post boolean,
  approved_for_post boolean,
  has_active_reference boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select asset.id
    from public.media_assets asset
    join public.scheduler_users user_record on user_record.id = asset.user_id
    where asset.storage_deleted_at is null
      and user_record.deletion_requested_at is null
      and (
        asset.cleanup_state in ('PENDING', 'NEEDS_ATTENTION')
        or (
          asset.cleanup_state = 'RUNNING'
          and asset.cleanup_started_at <= p_now - interval '15 minutes'
        )
      )
      and not exists (
        select 1
        from public.post_media post_media
        join public.scheduled_posts post on post.id = post_media.post_id
        left join public.publish_attempts attempt on attempt.post_id = post.id
        where post_media.media_id = asset.id
          and (
            post.status in ('SCHEDULED', 'CLAIMED', 'SUBMITTING', 'PROCESSING', 'FAILED_RETRYABLE')
            or attempt.status in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
            or attempt.error_code = 'POST_ACCEPTANCE_AMBIGUOUS'
            or (attempt.publish_id is not null and attempt.completed_at is null)
          )
      )
      and (
        (
          asset.created_at <= p_now - interval '24 hours'
          and not exists (
            select 1 from public.post_media post_media where post_media.media_id = asset.id
          )
        )
        or (
          exists (
            select 1 from public.post_media post_media where post_media.media_id = asset.id
          )
          and not exists (
            select 1
            from public.post_media post_media
            join public.scheduled_posts post on post.id = post_media.post_id
            where post_media.media_id = asset.id
              and (
                post.status not in ('PUBLISHED', 'CANCELLED', 'NEEDS_ATTENTION')
                or post.terminal_at is null
                or post.terminal_at > p_now - interval '7 days'
              )
          )
        )
      )
    order by asset.created_at, asset.id
    for update of asset skip locked
    limit greatest(1, least(coalesce(p_limit, 100), 100))
  ), claimed as (
    update public.media_assets asset
    set
      cleanup_state = 'RUNNING',
      cleanup_started_at = p_now,
      cleanup_attempts = asset.cleanup_attempts + 1,
      cleanup_last_error_code = null,
      updated_at = p_now
    from candidates
    where asset.id = candidates.id
    returning asset.*
  )
  select
    claimed.id,
    claimed.user_id,
    claimed.storage_path,
    claimed.created_at,
    stats.terminal_at,
    stats.terminal_status,
    stats.attached_to_post,
    stats.approved_for_post,
    stats.has_active_reference
  from claimed
  cross join lateral (
    select
      max(post.terminal_at) as terminal_at,
      case
        when count(post.id) > 0
          and bool_and(post.status in ('PUBLISHED', 'CANCELLED', 'NEEDS_ATTENTION'))
        then max(post.status)
        else null
      end as terminal_status,
      count(post.id) > 0 as attached_to_post,
      count(approval.id) > 0 as approved_for_post,
      coalesce(bool_or(
        post.status in ('SCHEDULED', 'CLAIMED', 'SUBMITTING', 'PROCESSING', 'FAILED_RETRYABLE')
        or attempt.status in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
        or attempt.error_code = 'POST_ACCEPTANCE_AMBIGUOUS'
        or (attempt.publish_id is not null and attempt.completed_at is null)
      ), false) as has_active_reference
    from public.post_media post_media
    join public.scheduled_posts post on post.id = post_media.post_id
    left join public.post_approvals approval on approval.post_id = post.id
    left join public.publish_attempts attempt on attempt.post_id = post.id
    where post_media.media_id = claimed.id
  ) stats;
end;
$$;

create or replace function public.complete_scheduler_media_cleanup(
  p_asset_id uuid,
  p_user_id uuid,
  p_deleted_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer := 0;
begin
  if exists (
    select 1
    from public.media_assets asset
    where asset.id = p_asset_id
      and asset.user_id = p_user_id
      and asset.storage_deleted_at is not null
  ) then
    return true;
  end if;

  update public.media_assets asset
  set
    storage_deleted_at = p_deleted_at,
    cleanup_state = 'COMPLETE',
    cleanup_started_at = null,
    cleanup_last_error_code = null,
    updated_at = p_deleted_at
  where asset.id = p_asset_id
    and asset.user_id = p_user_id
    and asset.cleanup_state = 'RUNNING'
    and asset.storage_deleted_at is null
    and not exists (
      select 1
      from storage.objects object_record
      where object_record.bucket_id = 'tiktok-scheduler-media'
        and object_record.name = asset.storage_path
    )
    and not exists (
      select 1
      from public.post_media post_media
      join public.scheduled_posts post on post.id = post_media.post_id
      left join public.publish_attempts attempt on attempt.post_id = post.id
      where post_media.media_id = asset.id
        and (
          post.status in ('SCHEDULED', 'CLAIMED', 'SUBMITTING', 'PROCESSING', 'FAILED_RETRYABLE')
          or attempt.status in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
          or attempt.error_code = 'POST_ACCEPTANCE_AMBIGUOUS'
          or (attempt.publish_id is not null and attempt.completed_at is null)
        )
    );

  get diagnostics v_updated = row_count;
  if v_updated = 1 then
    insert into public.scheduler_audit_log (
      actor_user_id,
      target_type,
      target_id,
      event_type,
      metadata
    ) values (
      p_user_id,
      'media_asset',
      p_asset_id,
      'MEDIA_STORAGE_DELETED',
      '{}'::jsonb
    );
  end if;
  return v_updated = 1;
end;
$$;

create or replace function public.record_scheduler_media_cleanup_failure(
  p_asset_id uuid,
  p_user_id uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_error_code text := case
    when upper(btrim(coalesce(p_error_code, ''))) ~ '^[A-Z0-9_]{1,80}$'
      then upper(btrim(p_error_code))
    else 'MEDIA_CLEANUP_FAILED'
  end;
  v_updated integer := 0;
begin
  update public.media_assets asset
  set
    cleanup_state = 'NEEDS_ATTENTION',
    cleanup_started_at = null,
    cleanup_last_error_code = v_error_code,
    updated_at = now()
  where asset.id = p_asset_id
    and asset.user_id = p_user_id
    and asset.storage_deleted_at is null;
  get diagnostics v_updated = row_count;

  if v_updated = 1 then
    insert into public.scheduler_audit_log (
      actor_user_id, target_type, target_id, event_type, metadata
    ) values (
      p_user_id, 'media_asset', p_asset_id, 'MEDIA_CLEANUP_NEEDS_ATTENTION',
      jsonb_build_object('errorCode', v_error_code)
    );
  end if;
  return v_updated = 1;
end;
$$;

create or replace function public.claim_terminal_staging_cleanup(p_now timestamptz, p_limit integer)
returns table (
  id uuid,
  user_id uuid,
  attempt_id uuid,
  storage_path text,
  terminal_reconciled boolean,
  expires_at timestamptz,
  post_status text,
  post_terminal_at timestamptz,
  attempt_status text,
  attempt_publish_id text,
  attempt_completed_at timestamptz,
  attempt_error_code text,
  has_unresolved_publication boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select staging.id
    from public.media_staging_objects staging
    join public.publish_attempts attempt on attempt.id = staging.attempt_id
    join public.scheduled_posts post on post.id = attempt.post_id
    where staging.removed_at is null
      and (
        staging.cleanup_state in ('PENDING', 'NEEDS_ATTENTION')
        or (
          staging.cleanup_state = 'RUNNING'
          and staging.cleanup_started_at <= p_now - interval '15 minutes'
        )
      )
      and (
        (
          post.terminal_at is not null
          and post.status in ('PUBLISHED', 'CANCELLED', 'NEEDS_ATTENTION')
          and not exists (
            select 1
            from public.publish_attempts unresolved
            where unresolved.post_id = post.id
              and (
                unresolved.status in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
                or unresolved.error_code = 'POST_ACCEPTANCE_AMBIGUOUS'
                or (unresolved.publish_id is not null and unresolved.completed_at is null)
              )
          )
        )
        or (
          staging.expires_at <= p_now
          and attempt.status not in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
          and coalesce(attempt.error_code, '') <> 'POST_ACCEPTANCE_AMBIGUOUS'
          and not (attempt.publish_id is not null and attempt.completed_at is null)
        )
      )
    order by coalesce(post.terminal_at, staging.expires_at), staging.id
    for update of staging, attempt, post skip locked
    limit greatest(1, least(coalesce(p_limit, 100), 100))
  ), claimed as (
    update public.media_staging_objects staging
    set
      cleanup_state = 'RUNNING',
      cleanup_started_at = p_now,
      cleanup_attempts = staging.cleanup_attempts + 1,
      cleanup_last_error_code = null
    from candidates
    where staging.id = candidates.id
    returning staging.*
  )
  select
    claimed.id,
    post.user_id,
    claimed.attempt_id,
    claimed.storage_path,
    true,
    claimed.expires_at,
    post.status,
    post.terminal_at,
    attempt.status,
    attempt.publish_id,
    attempt.completed_at,
    attempt.error_code,
    exists (
      select 1
      from public.publish_attempts unresolved
      where unresolved.post_id = post.id
        and (
          unresolved.status in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
          or unresolved.error_code = 'POST_ACCEPTANCE_AMBIGUOUS'
          or (unresolved.publish_id is not null and unresolved.completed_at is null)
        )
    )
  from claimed
  join public.publish_attempts attempt on attempt.id = claimed.attempt_id
  join public.scheduled_posts post on post.id = attempt.post_id;
end;
$$;

create or replace function public.complete_terminal_staging_cleanup(
  p_object_id uuid,
  p_user_id uuid,
  p_removed_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer := 0;
begin
  if exists (
    select 1
    from public.media_staging_objects staging
    join public.publish_attempts attempt on attempt.id = staging.attempt_id
    join public.scheduled_posts post on post.id = attempt.post_id
    where staging.id = p_object_id
      and post.user_id = p_user_id
      and staging.removed_at is not null
  ) then
    return true;
  end if;

  update public.media_staging_objects staging
  set
    removed_at = p_removed_at,
    cleanup_state = 'COMPLETE',
    cleanup_started_at = null,
    cleanup_last_error_code = null
  from public.publish_attempts attempt, public.scheduled_posts post
  where staging.id = p_object_id
    and staging.attempt_id = attempt.id
    and attempt.post_id = post.id
    and post.user_id = p_user_id
    and staging.cleanup_state = 'RUNNING'
    and staging.removed_at is null
    and (
      (
        post.terminal_at is not null
        and post.status in ('PUBLISHED', 'CANCELLED', 'NEEDS_ATTENTION')
        and not exists (
          select 1
          from public.publish_attempts unresolved
          where unresolved.post_id = post.id
            and (
              unresolved.status in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
              or unresolved.error_code = 'POST_ACCEPTANCE_AMBIGUOUS'
              or (unresolved.publish_id is not null and unresolved.completed_at is null)
            )
        )
      )
      or (
        staging.expires_at <= p_removed_at
        and attempt.status not in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
        and coalesce(attempt.error_code, '') <> 'POST_ACCEPTANCE_AMBIGUOUS'
        and not (attempt.publish_id is not null and attempt.completed_at is null)
      )
    )
    and not exists (
      select 1
      from storage.objects object_record
      where object_record.bucket_id = 'tiktok-publishing-staging'
        and object_record.name = staging.storage_path
    );
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create or replace function public.record_terminal_staging_cleanup_failure(
  p_object_id uuid,
  p_user_id uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_error_code text := case
    when upper(btrim(coalesce(p_error_code, ''))) ~ '^[A-Z0-9_]{1,80}$'
      then upper(btrim(p_error_code))
    else 'STAGING_CLEANUP_FAILED'
  end;
  v_updated integer := 0;
begin
  update public.media_staging_objects staging
  set
    cleanup_state = 'NEEDS_ATTENTION',
    cleanup_started_at = null,
    cleanup_last_error_code = v_error_code
  from public.publish_attempts attempt, public.scheduled_posts post
  where staging.id = p_object_id
    and staging.attempt_id = attempt.id
    and attempt.post_id = post.id
    and post.user_id = p_user_id
    and staging.removed_at is null;
  get diagnostics v_updated = row_count;

  if v_updated = 1 then
    insert into public.scheduler_audit_log (
      actor_user_id, target_type, target_id, event_type, metadata
    ) values (
      p_user_id, 'media_staging_object', p_object_id, 'STAGING_CLEANUP_NEEDS_ATTENTION',
      jsonb_build_object('errorCode', v_error_code)
    );
  end if;
  return v_updated = 1;
end;
$$;

create or replace function public.claim_scheduler_account_deletions(p_now timestamptz, p_limit integer)
returns table (request_id uuid, user_id uuid, state text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select request.id
    from public.scheduler_account_deletion_requests request
    where request.user_id is not null
      and (
        request.status in ('REQUESTED', 'NEEDS_ATTENTION')
        or (
          request.status = 'RUNNING'
          and request.started_at <= p_now - interval '15 minutes'
        )
      )
    order by request.requested_at, request.id
    for update of request skip locked
    limit greatest(1, least(coalesce(p_limit, 10), 10))
  )
  update public.scheduler_account_deletion_requests request
  set
    status = 'RUNNING',
    started_at = p_now,
    attempt_count = request.attempt_count + 1,
    last_error_code = null,
    updated_at = p_now
  from candidates
  where request.id = candidates.id
  returning request.id, request.user_id, 'RUNNING'::text;
end;
$$;

create or replace function public.get_scheduler_account_deletion_manifest(
  p_request_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ready boolean := false;
  v_original_paths jsonb := '[]'::jsonb;
  v_staging_objects jsonb := '[]'::jsonb;
  v_publish_ids jsonb := '[]'::jsonb;
begin
  perform 1
  from public.scheduler_account_deletion_requests request
  where request.id = p_request_id
    and request.user_id = p_user_id
    and request.status = 'RUNNING'
  for update;

  if not found then
    return null;
  end if;

  v_ready := not exists (
    select 1
    from public.scheduled_posts post
    left join public.publish_attempts attempt on attempt.post_id = post.id
    where post.user_id = p_user_id
      and (
        post.status in ('CLAIMED', 'SUBMITTING', 'PROCESSING')
        or attempt.status in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
        or (attempt.id is not null and attempt.completed_at is null)
        or attempt.error_code = 'POST_ACCEPTANCE_AMBIGUOUS'
      )
  );

  select coalesce(jsonb_agg(asset.storage_path order by asset.storage_path), '[]'::jsonb)
  into v_original_paths
  from public.media_assets asset
  where asset.user_id = p_user_id
    and asset.storage_deleted_at is null
    and asset.article_slug is null;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'attemptId', attempt.id::text,
      'storagePath', staging.storage_path
    ) order by staging.storage_path
  ), '[]'::jsonb)
  into v_staging_objects
  from public.media_staging_objects staging
  join public.publish_attempts attempt on attempt.id = staging.attempt_id
  join public.scheduled_posts post on post.id = attempt.post_id
  where post.user_id = p_user_id
    and staging.removed_at is null;

  select coalesce(jsonb_agg(identifier order by identifier), '[]'::jsonb)
  into v_publish_ids
  from (
    select distinct post.publish_id as identifier
    from public.scheduled_posts post
    where post.user_id = p_user_id and post.publish_id is not null
    union
    select distinct attempt.publish_id as identifier
    from public.publish_attempts attempt
    join public.scheduled_posts post on post.id = attempt.post_id
    where post.user_id = p_user_id and attempt.publish_id is not null
  ) identifiers;

  return jsonb_build_object(
    'ready', v_ready,
    'userId', p_user_id::text,
    'originalPaths', v_original_paths,
    'stagingObjects', v_staging_objects,
    'recordedPublishIds', v_publish_ids
  );
end;
$$;

create or replace function public.complete_scheduler_account_deletion(
  p_request_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_user integer := 0;
begin
  if exists (
    select 1
    from public.scheduler_account_deletion_requests request
    where request.id = p_request_id
      and request.status = 'COMPLETE'
      and request.user_id is null
      and request.user_reference_hash = encode(digest(p_user_id::text, 'sha256'), 'hex')
  ) then
    return true;
  end if;

  perform 1
  from public.scheduler_account_deletion_requests request
  where request.id = p_request_id
    and request.user_id = p_user_id
    and request.status = 'RUNNING'
  for update;
  if not found then
    return false;
  end if;

  if exists (
    select 1
    from public.scheduled_posts post
    left join public.publish_attempts attempt on attempt.post_id = post.id
    where post.user_id = p_user_id
      and (
        post.status in ('CLAIMED', 'SUBMITTING', 'PROCESSING')
        or attempt.status in ('SCHEDULED', 'SUBMITTING', 'PROCESSING')
        or (attempt.id is not null and attempt.completed_at is null)
        or attempt.error_code = 'POST_ACCEPTANCE_AMBIGUOUS'
      )
  ) then
    return false;
  end if;

  if exists (
    select 1
    from storage.objects object_record
    join public.media_assets asset
      on object_record.bucket_id = 'tiktok-scheduler-media'
      and object_record.name = asset.storage_path
    where asset.user_id = p_user_id
  ) or exists (
    select 1
    from storage.objects object_record
    join public.media_staging_objects staging
      on object_record.bucket_id = 'tiktok-publishing-staging'
      and object_record.name = staging.storage_path
    join public.publish_attempts attempt on attempt.id = staging.attempt_id
    join public.scheduled_posts post on post.id = attempt.post_id
    where post.user_id = p_user_id
  ) then
    return false;
  end if;

  delete from public.media_staging_objects staging
  using public.publish_attempts attempt, public.scheduled_posts post
  where staging.attempt_id = attempt.id
    and attempt.post_id = post.id
    and post.user_id = p_user_id;

  delete from public.publish_attempts attempt
  using public.scheduled_posts post
  where attempt.post_id = post.id
    and post.user_id = p_user_id;

  update public.scheduled_posts post
  set approval_id = null
  where post.user_id = p_user_id;

  delete from public.post_approvals approval
  where approval.user_id = p_user_id;

  delete from public.post_media post_media
  using public.scheduled_posts post
  where post_media.post_id = post.id
    and post.user_id = p_user_id;

  delete from public.scheduled_posts post
  where post.user_id = p_user_id;

  delete from public.media_assets asset
  where asset.user_id = p_user_id;

  delete from public.tiktok_connections connection_record
  where connection_record.user_id = p_user_id;

  delete from public.scheduler_users user_record
  where user_record.id = p_user_id;
  get diagnostics v_deleted_user = row_count;

  if v_deleted_user <> 1 then
    raise exception 'Scheduler account deletion lost the user row.' using errcode = 'P0001';
  end if;

  update public.scheduler_account_deletion_requests request
  set
    status = 'COMPLETE',
    completed_at = now(),
    last_error_code = null,
    updated_at = now()
  where request.id = p_request_id
    and request.user_id is null;

  if not found then
    raise exception 'Scheduler account deletion receipt was not preserved.' using errcode = 'P0001';
  end if;

  insert into public.scheduler_audit_log (
    actor_user_id, target_type, target_id, event_type, metadata
  ) values (
    null, 'account_deletion_request', p_request_id, 'ACCOUNT_DELETION_COMPLETE', '{}'::jsonb
  );

  return true;
end;
$$;

create or replace function public.mark_scheduler_account_deletion_attention(
  p_request_id uuid,
  p_user_id uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_error_code text := case
    when upper(btrim(coalesce(p_error_code, ''))) ~ '^[A-Z0-9_]{1,80}$'
      then upper(btrim(p_error_code))
    else 'ACCOUNT_DELETION_FAILED'
  end;
  v_updated integer := 0;
begin
  update public.scheduler_account_deletion_requests request
  set
    status = 'NEEDS_ATTENTION',
    started_at = null,
    last_error_code = v_error_code,
    updated_at = now()
  where request.id = p_request_id
    and request.user_id = p_user_id
    and request.status in ('RUNNING', 'NEEDS_ATTENTION');
  get diagnostics v_updated = row_count;

  if v_updated = 1 then
    insert into public.scheduler_audit_log (
      actor_user_id, target_type, target_id, event_type, metadata
    ) values (
      p_user_id, 'account_deletion_request', p_request_id, 'ACCOUNT_DELETION_NEEDS_ATTENTION',
      jsonb_build_object('errorCode', v_error_code)
    );
  end if;
  return v_updated = 1;
end;
$$;

revoke execute on function public.disconnect_tiktok_scheduler_user(uuid) from public, anon, authenticated;
grant execute on function public.disconnect_tiktok_scheduler_user(uuid) to service_role;
revoke execute on function public.request_scheduler_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.request_scheduler_account_deletion(uuid) to service_role;
revoke execute on function public.claim_scheduler_media_cleanup(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.claim_scheduler_media_cleanup(timestamptz, integer) to service_role;
revoke execute on function public.complete_scheduler_media_cleanup(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.complete_scheduler_media_cleanup(uuid, uuid, timestamptz) to service_role;
revoke execute on function public.record_scheduler_media_cleanup_failure(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.record_scheduler_media_cleanup_failure(uuid, uuid, text) to service_role;
revoke execute on function public.claim_terminal_staging_cleanup(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.claim_terminal_staging_cleanup(timestamptz, integer) to service_role;
revoke execute on function public.complete_terminal_staging_cleanup(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.complete_terminal_staging_cleanup(uuid, uuid, timestamptz) to service_role;
revoke execute on function public.record_terminal_staging_cleanup_failure(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.record_terminal_staging_cleanup_failure(uuid, uuid, text) to service_role;
revoke execute on function public.claim_scheduler_account_deletions(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.claim_scheduler_account_deletions(timestamptz, integer) to service_role;
revoke execute on function public.get_scheduler_account_deletion_manifest(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_scheduler_account_deletion_manifest(uuid, uuid) to service_role;
revoke execute on function public.complete_scheduler_account_deletion(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_scheduler_account_deletion(uuid, uuid) to service_role;
revoke execute on function public.mark_scheduler_account_deletion_attention(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.mark_scheduler_account_deletion_attention(uuid, uuid, text) to service_role;

revoke execute on function public.reserve_public_scheduler_slot(uuid, uuid, timestamptz, text, timestamptz) from public, anon, authenticated;
grant execute on function public.reserve_public_scheduler_slot(uuid, uuid, timestamptz, text, timestamptz) to service_role;
revoke execute on function public.claim_due_tiktok_posts(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.claim_due_tiktok_posts(timestamptz, integer) to service_role;
revoke execute on function public.record_scheduler_worker_started(text, timestamptz) from public, anon, authenticated;
grant execute on function public.record_scheduler_worker_started(text, timestamptz) to service_role;
revoke execute on function public.record_scheduler_worker_succeeded(text, timestamptz) from public, anon, authenticated;
grant execute on function public.record_scheduler_worker_succeeded(text, timestamptz) to service_role;
revoke execute on function public.record_scheduler_worker_failure(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.record_scheduler_worker_failure(text, text, timestamptz) to service_role;
revoke execute on function public.get_scheduler_owner_operations() from public, anon, authenticated;
grant execute on function public.get_scheduler_owner_operations() to service_role;
revoke execute on function public.suspend_scheduler_user(uuid, text) from public, anon, authenticated;
grant execute on function public.suspend_scheduler_user(uuid, text) to service_role;
revoke execute on function public.restore_scheduler_user(uuid) from public, anon, authenticated;
grant execute on function public.restore_scheduler_user(uuid) to service_role;
revoke execute on function public.create_safe_publish_retry(uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_safe_publish_retry(uuid, uuid) to service_role;
revoke execute on function public.begin_tiktok_publish_submission(uuid, uuid, uuid, uuid, integer, uuid, text, text) from public, anon, authenticated;
grant execute on function public.begin_tiktok_publish_submission(uuid, uuid, uuid, uuid, integer, uuid, text, text) to service_role;
revoke execute on function public.record_tiktok_publish_id(uuid, uuid, uuid, uuid, integer, text, timestamptz) from public, anon, authenticated;
grant execute on function public.record_tiktok_publish_id(uuid, uuid, uuid, uuid, integer, text, timestamptz) to service_role;
revoke execute on function public.record_tiktok_publish_failure(uuid, uuid, uuid, uuid, integer, text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.record_tiktok_publish_failure(uuid, uuid, uuid, uuid, integer, text, text, timestamptz, text) to service_role;
revoke execute on function public.create_public_scheduler_post(uuid, uuid[], text, text) from public, anon, authenticated;
revoke execute on function public.approve_public_scheduler_post(uuid, uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.save_active_tiktok_connection(uuid, text, text, text[], timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.refresh_active_tiktok_connection(uuid, text, text, text[], timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.refresh_active_tiktok_connection(uuid, text, text, text[], timestamptz, timestamptz) to service_role;

commit;
