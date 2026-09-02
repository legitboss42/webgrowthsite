begin;

create table if not exists public.whatsapp_flows (
  id uuid primary key default gen_random_uuid(),
  meta_flow_id text unique,
  name text not null,
  categories text[] not null default array['OTHER']::text[],
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','DEPRECATED','BLOCKED','THROTTLED','UNKNOWN')),
  json_version text not null default '7.2',
  data_api_version text,
  endpoint_uri text,
  preview_url text,
  preview_expires_at timestamptz,
  health_status jsonb not null default '{}'::jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  flow_json jsonb not null default '{}'::jsonb,
  builder_definition jsonb not null default '{"screens":[],"dynamic":false,"completionButtonLabel":"Submit"}'::jsonb,
  crm_mapping jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  created_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  updated_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  published_at timestamptz,
  deprecated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_flow_versions (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.whatsapp_flows(id) on delete cascade,
  version integer not null check (version > 0),
  flow_json jsonb not null default '{}'::jsonb,
  builder_definition jsonb not null default '{}'::jsonb,
  crm_mapping jsonb not null default '{}'::jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  created_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (flow_id, version)
);

create table if not exists public.whatsapp_flow_submissions (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid references public.whatsapp_flows(id) on delete set null,
  meta_flow_id text,
  contact_id uuid references public.whatsapp_contacts(id) on delete set null,
  conversation_id uuid references public.whatsapp_conversations(id) on delete set null,
  flow_token text unique,
  message_id text,
  status text not null default 'STARTED' check (status in ('STARTED','COMPLETED','FAILED')),
  response_json jsonb not null default '{}'::jsonb,
  mapped_fields jsonb not null default '{}'::jsonb,
  source text not null default 'FLOW_SEND',
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_flow_events (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid references public.whatsapp_flows(id) on delete cascade,
  submission_id uuid references public.whatsapp_flow_submissions(id) on delete set null,
  contact_id uuid references public.whatsapp_contacts(id) on delete set null,
  conversation_id uuid references public.whatsapp_conversations(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_flow_runtime_config (
  id text primary key default 'default',
  data_api_version text not null default '3.0',
  endpoint_path text not null default '/api/whatsapp/flows/data/',
  encryption_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (id = 'default')
);

insert into public.whatsapp_flow_runtime_config (id)
values ('default')
on conflict (id) do nothing;

create index if not exists whatsapp_flows_status_updated_idx
  on public.whatsapp_flows (status, updated_at desc);
create index if not exists whatsapp_flows_meta_flow_idx
  on public.whatsapp_flows (meta_flow_id) where meta_flow_id is not null;
create index if not exists whatsapp_flow_versions_flow_idx
  on public.whatsapp_flow_versions (flow_id, version desc);
create index if not exists whatsapp_flow_submissions_flow_created_idx
  on public.whatsapp_flow_submissions (flow_id, created_at desc);
create index if not exists whatsapp_flow_submissions_contact_created_idx
  on public.whatsapp_flow_submissions (contact_id, created_at desc) where contact_id is not null;
create index if not exists whatsapp_flow_submissions_conversation_created_idx
  on public.whatsapp_flow_submissions (conversation_id, created_at desc) where conversation_id is not null;
create index if not exists whatsapp_flow_submissions_status_idx
  on public.whatsapp_flow_submissions (status, created_at desc);
create index if not exists whatsapp_flow_events_flow_created_idx
  on public.whatsapp_flow_events (flow_id, created_at desc);
create index if not exists whatsapp_flow_events_submission_idx
  on public.whatsapp_flow_events (submission_id, created_at asc) where submission_id is not null;

alter table public.whatsapp_flows enable row level security;
alter table public.whatsapp_flow_versions enable row level security;
alter table public.whatsapp_flow_submissions enable row level security;
alter table public.whatsapp_flow_events enable row level security;
alter table public.whatsapp_flow_runtime_config enable row level security;

comment on table public.whatsapp_flows is 'Stage 8 WhatsApp Flow definitions mirrored from the official Meta Cloud API. Server-only service-role access.';
comment on table public.whatsapp_flow_versions is 'Immutable local snapshots of editable WhatsApp Flow definitions before publication.';
comment on table public.whatsapp_flow_submissions is 'Customer Flow launches and completions, including CRM-mapped response data.';
comment on table public.whatsapp_flow_events is 'Audit/event stream for WhatsApp Flow lifecycle and completion activity.';
comment on table public.whatsapp_flow_runtime_config is 'Non-secret WhatsApp Flow runtime settings. Private encryption keys remain environment-only.';

commit;
