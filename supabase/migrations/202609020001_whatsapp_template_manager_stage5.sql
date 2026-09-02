-- Stage 5 WhatsApp Template Manager persistent local drafts.
-- Submitted/approved template truth remains at Meta; this table stores Web Growth drafts.
-- Apply manually in the Supabase SQL editor. Do NOT run supabase db push.

create table if not exists public.whatsapp_template_drafts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  language text not null default 'en_US',
  category text not null,
  header_text text,
  body_text text not null,
  footer_text text,
  buttons jsonb not null default '[]'::jsonb,
  variable_examples jsonb not null default '{}'::jsonb,
  meta_template_id text,
  submitted_at timestamptz,
  created_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  updated_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_template_drafts_category_check'
      and conrelid = 'public.whatsapp_template_drafts'::regclass
  ) then
    alter table public.whatsapp_template_drafts
      add constraint whatsapp_template_drafts_category_check
      check (category in ('MARKETING', 'UTILITY'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_template_drafts_buttons_array_check'
      and conrelid = 'public.whatsapp_template_drafts'::regclass
  ) then
    alter table public.whatsapp_template_drafts
      add constraint whatsapp_template_drafts_buttons_array_check
      check (jsonb_typeof(buttons) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_template_drafts_examples_object_check'
      and conrelid = 'public.whatsapp_template_drafts'::regclass
  ) then
    alter table public.whatsapp_template_drafts
      add constraint whatsapp_template_drafts_examples_object_check
      check (jsonb_typeof(variable_examples) = 'object');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_template_drafts_submission_bundle_check'
      and conrelid = 'public.whatsapp_template_drafts'::regclass
  ) then
    alter table public.whatsapp_template_drafts
      add constraint whatsapp_template_drafts_submission_bundle_check
      check (
        (meta_template_id is null and submitted_at is null)
        or
        (nullif(trim(meta_template_id), '') is not null and submitted_at is not null)
      );
  end if;
end
$$;

create unique index if not exists whatsapp_template_drafts_name_language_unique_idx
  on public.whatsapp_template_drafts (lower(name), language);

create index if not exists whatsapp_template_drafts_updated_idx
  on public.whatsapp_template_drafts (updated_at desc);

create index if not exists whatsapp_template_drafts_submitted_idx
  on public.whatsapp_template_drafts (submitted_at desc)
  where submitted_at is not null;
