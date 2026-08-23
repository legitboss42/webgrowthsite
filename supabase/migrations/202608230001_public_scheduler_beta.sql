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

revoke execute on function public.reserve_public_scheduler_slot(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.create_safe_publish_retry(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.create_public_scheduler_post(uuid, uuid[], text, text) from public, anon, authenticated;
revoke execute on function public.approve_public_scheduler_post(uuid, uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.save_active_tiktok_connection(uuid, text, text, text[], timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.refresh_active_tiktok_connection(uuid, text, text, text[], timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.refresh_active_tiktok_connection(uuid, text, text, text[], timestamptz, timestamptz) to service_role;

commit;
