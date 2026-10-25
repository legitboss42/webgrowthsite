-- Owner-approved one-time OpenClaw business social delegation.
-- Credentials remain exclusively inside Web Growth provider services.
create table if not exists public.openclaw_social_requests (
  nonce text primary key check (char_length(nonce) between 32 and 36),
  approval_id text unique,
  operation text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.openclaw_social_approvals (
  approval_id text primary key check (approval_id ~ '^ap_[A-Za-z0-9_-]{8,100}$'),
  business_id text not null check (business_id = 'webgrowth'),
  agent_id text not null,
  operation text not null,
  resource_id text not null,
  payload_digest text not null check (payload_digest ~ '^[a-f0-9]{64}$'),
  approved_by text not null,
  approved_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  check (expires_at > approved_at and expires_at <= approved_at + interval '1 hour')
);
create index if not exists openclaw_social_requests_time_idx on public.openclaw_social_requests(created_at);
alter table public.openclaw_social_requests enable row level security;
alter table public.openclaw_social_approvals enable row level security;
revoke all on public.openclaw_social_requests from anon,authenticated;
revoke all on public.openclaw_social_approvals from anon,authenticated;
comment on table public.openclaw_social_approvals is 'Backend-only one-time permission to execute exact owner-reviewed public social or WhatsApp action; never contains tokens';
