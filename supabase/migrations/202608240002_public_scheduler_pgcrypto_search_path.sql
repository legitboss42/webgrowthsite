begin;

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
      encode(extensions.digest(p_user_id::text, 'sha256'), 'hex'),
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
      and request.user_reference_hash = encode(extensions.digest(p_user_id::text, 'sha256'), 'hex')
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

revoke execute on function public.request_scheduler_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.request_scheduler_account_deletion(uuid) to service_role;
revoke execute on function public.complete_scheduler_account_deletion(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_scheduler_account_deletion(uuid, uuid) to service_role;

commit;
