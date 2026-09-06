begin;

create table if not exists public.social_automation_jobs (
  id uuid primary key default gen_random_uuid(),
  article_slug text not null,
  source_commit_sha text not null,
  automation_version text not null,
  idempotency_key text not null unique,
  status text not null default 'QUEUED' check (status in ('QUEUED','GENERATING','RENDERING','UPLOADING','WAITING_FOR_ARTICLE','PUBLISHING','PARTIALLY_PUBLISHED','COMPLETE','NEEDS_ATTENTION')),
  article_snapshot jsonb not null default '{}'::jsonb,
  meta_media_id uuid,
  tiktok_media_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_media_assets (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.social_automation_jobs(id) on delete cascade,
  profile text not null check (profile in ('META','TIKTOK')),
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  width integer,
  height integer,
  duration_seconds numeric,
  checksum text,
  retained_until timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_publications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.social_automation_jobs(id) on delete cascade,
  platform text not null check (platform in ('INSTAGRAM','FACEBOOK','TIKTOK')),
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','NEEDS_APPROVAL','PUBLISHED','FAILED_RETRYABLE','NEEDS_ATTENTION','SKIPPED')),
  caption text not null default '',
  media_id uuid references public.social_media_assets(id) on delete set null,
  external_publication_id text,
  external_url text,
  provider_state jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_retry_at timestamptz,
  last_error_code text,
  last_error_message text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, platform)
);

create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  provider text not null default 'META' unique check (provider in ('META')),
  encrypted_tokens text not null,
  facebook_page_id text,
  facebook_page_name text,
  instagram_account_id text,
  instagram_account_name text,
  scopes text[] not null default '{}',
  access_expires_at timestamptz,
  reconnect_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_automation_settings (
  singleton_id boolean primary key default true check (singleton_id = true),
  enabled boolean not null default true,
  instagram_enabled boolean not null default true,
  facebook_enabled boolean not null default true,
  tiktok_generation_enabled boolean not null default true,
  asset_retention_days integer not null default 7 check (asset_retention_days between 1 and 30),
  default_timezone text not null default 'Africa/Lagos',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_automation_audit_log (
  id bigint generated always as identity primary key,
  job_id uuid references public.social_automation_jobs(id) on delete set null,
  publication_id uuid references public.social_publications(id) on delete set null,
  event_type text not null,
  actor text not null default 'SYSTEM',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.social_automation_jobs enable row level security;
alter table public.social_publications enable row level security;
alter table public.social_connections enable row level security;
alter table public.social_automation_settings enable row level security;
alter table public.social_media_assets enable row level security;
alter table public.social_automation_audit_log enable row level security;

revoke all on public.social_automation_jobs from anon, authenticated;
revoke all on public.social_publications from anon, authenticated;
revoke all on public.social_connections from anon, authenticated;
revoke all on public.social_automation_settings from anon, authenticated;
revoke all on public.social_media_assets from anon, authenticated;
revoke all on public.social_automation_audit_log from anon, authenticated;

grant select, insert, update, delete on public.social_automation_jobs to service_role;
grant select, insert, update, delete on public.social_publications to service_role;
grant select, insert, update, delete on public.social_connections to service_role;
grant select, insert, update, delete on public.social_automation_settings to service_role;
grant select, insert, update, delete on public.social_media_assets to service_role;
grant select, insert, update, delete on public.social_automation_audit_log to service_role;
grant usage, select on sequence public.social_automation_audit_log_id_seq to service_role;

insert into public.social_automation_settings
  (singleton_id, enabled, instagram_enabled, facebook_enabled, tiktok_generation_enabled, asset_retention_days, default_timezone)
values
  (true, true, true, true, true, 7, 'Africa/Lagos')
on conflict (singleton_id) do nothing;

insert into storage.buckets (id, name, public)
values ('social-automation', 'social-automation', false)
on conflict (id) do update set public = false;

create index if not exists social_jobs_status_idx on public.social_automation_jobs(status, created_at desc);
create index if not exists social_publications_retry_idx on public.social_publications(status, next_retry_at);
create index if not exists social_media_assets_retention_idx on public.social_media_assets(retained_until) where deleted_at is null;
create index if not exists social_audit_job_idx on public.social_automation_audit_log(job_id, created_at desc);

commit;
