-- Quick replies: saved snippets the team can insert into an inbox reply.
-- Additive and reversible: creates one new table, touches nothing that exists.
-- RLS is enabled with no policies, matching the other WhatsApp tables, so the
-- table is reachable only through the server-side service-role key.

create table if not exists public.whatsapp_quick_replies (
  id uuid primary key default gen_random_uuid(),
  shortcut text not null unique,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_quick_replies_shortcut_format check (shortcut ~ '^[a-z0-9][a-z0-9-]{0,31}$'),
  constraint whatsapp_quick_replies_title_length check (char_length(title) between 1 and 80),
  constraint whatsapp_quick_replies_body_length check (char_length(body) between 1 and 1024)
);

create index if not exists whatsapp_quick_replies_shortcut_idx
  on public.whatsapp_quick_replies (shortcut);

alter table public.whatsapp_quick_replies enable row level security;
