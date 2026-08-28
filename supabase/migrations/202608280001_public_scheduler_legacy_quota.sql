begin;

-- scheduled_at was introduced after the private scheduler had already created
-- schedule events. Preserve those events in the rolling public-beta quota.
update public.scheduled_posts post
set scheduled_at = post.created_at
where post.scheduled_at is null
  and post.scheduled_for is not null;

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
      where coalesce(post.scheduled_at, post.created_at) >= p_now - interval '24 hours'
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

revoke execute on function public.reserve_public_scheduler_slot(uuid, uuid, timestamptz, text, timestamptz) from public, anon, authenticated;
grant execute on function public.reserve_public_scheduler_slot(uuid, uuid, timestamptz, text, timestamptz) to service_role;

commit;
