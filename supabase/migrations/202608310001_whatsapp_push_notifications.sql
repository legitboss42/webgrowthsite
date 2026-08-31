create table if not exists public.whatsapp_push_config (
  id text primary key,
  public_key text not null,
  private_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_push_deliveries (
  message_id text primary key,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_push_config enable row level security;
alter table public.whatsapp_push_subscriptions enable row level security;
alter table public.whatsapp_push_deliveries enable row level security;

revoke all on public.whatsapp_push_config from anon, authenticated;
revoke all on public.whatsapp_push_subscriptions from anon, authenticated;
revoke all on public.whatsapp_push_deliveries from anon, authenticated;

grant all on public.whatsapp_push_config to service_role;
grant all on public.whatsapp_push_subscriptions to service_role;
grant all on public.whatsapp_push_deliveries to service_role;
