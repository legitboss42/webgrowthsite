create extension if not exists pgcrypto;

create table if not exists public.whatsapp_contacts (
  id uuid primary key default gen_random_uuid(),
  wa_id text not null unique,
  phone text,
  display_name text,
  business_name text,
  email text,
  website text,
  source text,
  tracker_reference text,
  lead_status text not null default 'open',
  lead_temperature text not null default 'COLD' check (lead_temperature in ('COLD', 'WARM', 'HOT')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null unique references public.whatsapp_contacts(id) on delete cascade,
  status text not null default 'open',
  first_message_at timestamptz,
  last_message_at timestamptz,
  intent text,
  human_review_required boolean not null default false,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_events (
  id uuid primary key default gen_random_uuid(),
  meta_event_id text not null unique,
  event_type text not null,
  payload jsonb,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  whatsapp_message_id text unique,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null default 'text',
  message_text text,
  message_timestamp timestamptz,
  delivery_status text,
  raw_event_reference uuid references public.whatsapp_events(id),
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_conversations_review_idx on public.whatsapp_conversations (human_review_required, last_message_at desc);
create index if not exists whatsapp_messages_conversation_idx on public.whatsapp_messages (conversation_id, message_timestamp desc);
create index if not exists whatsapp_contacts_temperature_idx on public.whatsapp_contacts (lead_temperature, updated_at desc);

alter table public.whatsapp_contacts enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_events enable row level security;
alter table public.whatsapp_messages enable row level security;
