create table if not exists public.whatsapp_calls (
  call_id text primary key,
  direction text not null check (direction in ('inbound', 'outbound')),
  customer_wa_id text,
  customer_name text,
  status text not null default 'unknown',
  started_at timestamptz,
  answered_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer generated always as (
    case
      when answered_at is not null and ended_at is not null
      then greatest(0, floor(extract(epoch from (ended_at - answered_at)))::integer)
      else null
    end
  ) stored,
  last_event_at timestamptz not null default now(),
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_calls_last_event_idx
  on public.whatsapp_calls (last_event_at desc);

create index if not exists whatsapp_calls_direction_idx
  on public.whatsapp_calls (direction, last_event_at desc);

create index if not exists whatsapp_calls_customer_idx
  on public.whatsapp_calls (customer_wa_id, last_event_at desc);

alter table public.whatsapp_calls enable row level security;
revoke all on public.whatsapp_calls from anon, authenticated;
grant all on public.whatsapp_calls to service_role;
