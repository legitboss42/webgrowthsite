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
  add column if not exists probe_metadata jsonb;

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
  with due as (
    select post.id
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
    order by post.scheduled_for, post.id
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
    and asset.validation_status = 'VALID';

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

revoke execute on function public.reserve_public_scheduler_slot(uuid, uuid, timestamptz, text, timestamptz) from public, anon, authenticated;
grant execute on function public.reserve_public_scheduler_slot(uuid, uuid, timestamptz, text, timestamptz) to service_role;
revoke execute on function public.claim_due_tiktok_posts(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.claim_due_tiktok_posts(timestamptz, integer) to service_role;
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
