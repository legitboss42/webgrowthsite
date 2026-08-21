create extension if not exists pgcrypto;

create table public.scheduler_users (
  id uuid primary key default gen_random_uuid(),
  tiktok_open_id text not null unique,
  display_name text,
  avatar_url text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED')),
  terms_version text,
  terms_accepted_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tiktok_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.scheduler_users(id) on delete cascade,
  encrypted_tokens text not null,
  scopes text[] not null default '{}',
  access_expires_at timestamptz not null,
  refresh_expires_at timestamptz not null,
  reconnect_required boolean not null default false,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.scheduler_users(id) on delete cascade,
  kind text not null check (kind in ('PHOTO','VIDEO')),
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  checksum text not null,
  width integer,
  height integer,
  duration_seconds numeric,
  validation_status text not null default 'PENDING' check (validation_status in ('PENDING','VALID','INVALID')),
  article_slug text,
  retained_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.scheduler_users(id) on delete cascade,
  kind text not null check (kind in ('PHOTO','VIDEO')),
  title text not null default '',
  caption text not null default '',
  status text not null default 'DRAFT' check (status in ('DRAFT','NEEDS_CONNECTION','NEEDS_APPROVAL','SCHEDULED','CLAIMED','SUBMITTING','PROCESSING','PUBLISHED','FAILED_RETRYABLE','NEEDS_ATTENTION','CANCELLED')),
  approval_id uuid,
  scheduled_for timestamptz,
  timezone text,
  claim_token uuid,
  claimed_at timestamptz,
  publish_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_media (
  post_id uuid not null references public.scheduled_posts(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete restrict,
  position integer not null check (position >= 0),
  primary key (post_id, position),
  unique (post_id, media_id)
);

create table public.post_approvals (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.scheduled_posts(id) on delete cascade,
  user_id uuid not null references public.scheduler_users(id) on delete cascade,
  fingerprint text not null,
  snapshot jsonb not null,
  approved_at timestamptz not null default now(),
  invalidated_at timestamptz,
  unique (post_id, fingerprint)
);

alter table public.scheduled_posts
  add constraint scheduled_posts_approval_fk foreign key (approval_id) references public.post_approvals(id);

create table public.publish_attempts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.scheduled_posts(id) on delete cascade,
  approval_id uuid not null references public.post_approvals(id) on delete restrict,
  request_fingerprint text not null,
  publish_id text,
  status text not null,
  error_code text,
  error_message text,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, approval_id, request_fingerprint)
);

create unique index publish_attempts_publish_id_idx on public.publish_attempts (publish_id) where publish_id is not null;
create index scheduled_posts_due_idx on public.scheduled_posts (scheduled_for) where status in ('SCHEDULED','FAILED_RETRYABLE');
create index media_assets_retention_idx on public.media_assets (retained_until) where retained_until is not null;

create table public.scheduler_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.scheduler_users(id) on delete set null,
  target_type text not null,
  target_id uuid,
  event_type text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.scheduler_users enable row level security;
alter table public.tiktok_connections enable row level security;
alter table public.media_assets enable row level security;
alter table public.scheduled_posts enable row level security;
alter table public.post_media enable row level security;
alter table public.post_approvals enable row level security;
alter table public.publish_attempts enable row level security;
alter table public.scheduler_audit_log enable row level security;

insert into storage.buckets (id, name, public)
values ('tiktok-scheduler-media', 'tiktok-scheduler-media', false)
on conflict (id) do update set public = false;

create or replace function public.claim_due_tiktok_posts(p_now timestamptz, p_limit integer)
returns setof public.scheduled_posts
language plpgsql security definer set search_path = public
as $$
begin
  return query
  with due as (
    select id from public.scheduled_posts
    where status in ('SCHEDULED','FAILED_RETRYABLE') and scheduled_for <= p_now
    order by scheduled_for for update skip locked limit greatest(1, least(p_limit, 25))
  )
  update public.scheduled_posts p
  set status = 'CLAIMED', claim_token = gen_random_uuid(), claimed_at = p_now, updated_at = p_now
  from due where p.id = due.id returning p.*;
end;
$$;

create or replace function public.reserve_tiktok_daily_slot(p_user_id uuid, p_now timestamptz, p_limit integer default 3)
returns boolean language plpgsql security definer set search_path = public
as $$
declare used integer;
begin
  select count(*) into used from public.scheduled_posts
  where user_id = p_user_id and status not in ('DRAFT','NEEDS_CONNECTION','NEEDS_APPROVAL','CANCELLED')
    and created_at > p_now - interval '24 hours';
  return used < greatest(1, p_limit);
end;
$$;

create or replace function public.cancel_tiktok_connection_jobs(p_user_id uuid)
returns integer language plpgsql security definer set search_path = public
as $$
declare affected integer;
begin
  update public.scheduled_posts set status = 'CANCELLED', updated_at = now()
  where user_id = p_user_id and status in ('SCHEDULED','FAILED_RETRYABLE');
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke execute on function public.claim_due_tiktok_posts(timestamptz, integer) from public, anon, authenticated;
revoke execute on function public.reserve_tiktok_daily_slot(uuid, timestamptz, integer) from public, anon, authenticated;
revoke execute on function public.cancel_tiktok_connection_jobs(uuid) from public, anon, authenticated;

