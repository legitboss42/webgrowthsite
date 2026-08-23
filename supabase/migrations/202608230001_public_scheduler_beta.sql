begin;

alter table public.scheduler_users
  add column if not exists privacy_version text,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text,
  add column if not exists deletion_requested_at timestamptz;

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

create or replace function public.reserve_public_scheduler_slot(
  p_post_id uuid,
  p_user_id uuid,
  p_scheduled_for timestamptz,
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
    or p_now is null
    or p_scheduled_for <= p_now then
    return false;
  end if;

  perform 1
  from public.scheduler_users user_record
  where user_record.id = p_user_id
    and user_record.status = 'ACTIVE'
    and user_record.suspended_at is null
    and user_record.deletion_requested_at is null;

  if not found then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

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
  v_request_fingerprint text;
  v_last_attempt_number integer;
  v_next_attempt_number integer;
begin
  if p_post_id is null or p_user_id is null then
    return null;
  end if;

  select post.approval_id
  into v_approval_id
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
  for update;

  if not found or v_approval_id is null then
    return null;
  end if;

  if exists (
    select 1
    from public.publish_attempts attempt
    where attempt.post_id = p_post_id
      and attempt.approval_id = v_approval_id
      and attempt.publish_id is not null
  ) then
    return null;
  end if;

  select attempt.request_fingerprint, attempt.attempt_number
  into v_request_fingerprint, v_last_attempt_number
  from public.publish_attempts attempt
  where attempt.post_id = p_post_id
    and attempt.approval_id = v_approval_id
    and attempt.publish_id is null
  order by attempt.attempt_number desc
  limit 1
  for update;

  if not found then
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
    v_request_fingerprint,
    v_next_attempt_number,
    'SCHEDULED'
  );

  update public.scheduled_posts post
  set
    status = 'SCHEDULED',
    retry_eligible = false,
    next_retry_at = null,
    user_failure_code = null,
    updated_at = now()
  where post.id = p_post_id
    and post.user_id = p_user_id;

  return v_next_attempt_number;
end;
$$;

revoke execute on function public.reserve_public_scheduler_slot(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.create_safe_publish_retry(uuid, uuid) from public, anon, authenticated;

commit;
