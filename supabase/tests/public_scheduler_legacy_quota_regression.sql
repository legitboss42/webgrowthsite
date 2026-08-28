begin;

set local statement_timeout = '20s';

do $$
declare
  v_user_id constant uuid := '00000000-0000-0000-0000-0000000012e1';
  v_first_accepted boolean;
  v_second_accepted boolean;
begin
  if exists (
    select 1
    from public.scheduler_users
    where id = v_user_id
      or tiktok_open_id = 'task12-root-cause-legacy-20260828'
  ) then
    raise exception 'Task 12 legacy quota regression fixture already exists.';
  end if;

  insert into public.scheduler_users (
    id,
    tiktok_open_id,
    display_name,
    status,
    terms_version,
    privacy_version
  ) values (
    v_user_id,
    'task12-root-cause-legacy-20260828',
    'Task 12 legacy quota regression fixture',
    'ACTIVE',
    '2026-08-23',
    '2026-08-23'
  );

  -- These two rows model posts scheduled before scheduled_at was added. Their
  -- creation timestamps are inside the rolling window and must consume two
  -- daily slots even though the newly added column is null.
  insert into public.scheduled_posts (
    id,
    user_id,
    kind,
    title,
    caption,
    status,
    scheduled_for,
    timezone,
    scheduled_at,
    created_at,
    updated_at
  ) values
    (
      '00000000-0000-0000-0000-0000000012e2',
      v_user_id,
      'PHOTO',
      'Task 12 legacy quota baseline A',
      '',
      'SCHEDULED',
      '2026-08-28T13:00:00Z',
      'Africa/Lagos',
      null,
      '2026-08-28T11:00:00Z',
      '2026-08-28T11:00:00Z'
    ),
    (
      '00000000-0000-0000-0000-0000000012e3',
      v_user_id,
      'PHOTO',
      'Task 12 legacy quota baseline B',
      '',
      'SCHEDULED',
      '2026-08-28T13:30:00Z',
      'Africa/Lagos',
      null,
      '2026-08-28T11:30:00Z',
      '2026-08-28T11:30:00Z'
    ),
    (
      '00000000-0000-0000-0000-0000000012e4',
      v_user_id,
      'PHOTO',
      'Task 12 legacy quota candidate A',
      '',
      'NEEDS_APPROVAL',
      null,
      null,
      null,
      '2026-08-28T11:40:00Z',
      '2026-08-28T11:40:00Z'
    ),
    (
      '00000000-0000-0000-0000-0000000012e5',
      v_user_id,
      'PHOTO',
      'Task 12 legacy quota candidate B',
      '',
      'NEEDS_APPROVAL',
      null,
      null,
      null,
      '2026-08-28T11:41:00Z',
      '2026-08-28T11:41:00Z'
    );

  insert into public.post_approvals (
    id,
    post_id,
    user_id,
    fingerprint,
    snapshot
  ) values
    (
      '00000000-0000-0000-0000-0000000012e6',
      '00000000-0000-0000-0000-0000000012e4',
      v_user_id,
      'task12-legacy-quota-candidate-a',
      '{}'::jsonb
    ),
    (
      '00000000-0000-0000-0000-0000000012e7',
      '00000000-0000-0000-0000-0000000012e5',
      v_user_id,
      'task12-legacy-quota-candidate-b',
      '{}'::jsonb
    );

  update public.scheduled_posts
  set approval_id = case id
    when '00000000-0000-0000-0000-0000000012e4'::uuid
      then '00000000-0000-0000-0000-0000000012e6'::uuid
    when '00000000-0000-0000-0000-0000000012e5'::uuid
      then '00000000-0000-0000-0000-0000000012e7'::uuid
  end
  where id in (
    '00000000-0000-0000-0000-0000000012e4'::uuid,
    '00000000-0000-0000-0000-0000000012e5'::uuid
  );

  v_first_accepted := public.reserve_public_scheduler_slot(
    '00000000-0000-0000-0000-0000000012e4',
    v_user_id,
    '2026-08-28T14:00:00Z',
    'Africa/Lagos',
    '2026-08-28T12:00:00Z'
  );
  v_second_accepted := public.reserve_public_scheduler_slot(
    '00000000-0000-0000-0000-0000000012e5',
    v_user_id,
    '2026-08-28T14:30:00Z',
    'Africa/Lagos',
    '2026-08-28T12:00:00Z'
  );

  if v_first_accepted is distinct from true
    or v_second_accepted is distinct from false then
    raise exception
      'Legacy daily quota regression: expected first=true and second=false, got first=% and second=%.',
      v_first_accepted,
      v_second_accepted;
  end if;
end;
$$;

rollback;
