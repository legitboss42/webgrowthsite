-- WhatsApp console settings: the parts of the console an operator controls.
--
-- Additive and reversible: creates one new table, touches nothing that exists.
-- RLS is enabled with no policies, matching the other WhatsApp tables, so the
-- table is reachable only through the server-side service-role key.
--
-- The settings live in one jsonb document rather than a column per setting. This
-- project's migrations are applied by hand in the Supabase SQL editor, so each new
-- column would cost another manual run. Keeping the shape in TypeScript instead
-- (src/lib/whatsapp/settings.ts validates every field and fills in defaults on
-- read) means adding a setting later needs no migration at all. Only server code
-- holding the service-role key can write here, and it always writes a document it
-- has already validated.

create table if not exists public.whatsapp_settings (
  id text primary key default 'default',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  -- One row, always. The console upserts on this id rather than tracking which
  -- row is current.
  constraint whatsapp_settings_single_row check (id = 'default'),
  constraint whatsapp_settings_is_object check (jsonb_typeof(settings) = 'object')
);

alter table public.whatsapp_settings enable row level security;

-- Seed the row so a first save is an ordinary update, and so a fresh install reads
-- an empty document (all defaults) instead of no row at all.
insert into public.whatsapp_settings (id, settings)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;
