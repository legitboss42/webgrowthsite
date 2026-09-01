-- Stage 3 Contact CRM core fields.
-- Additive only. Apply manually in the Supabase SQL editor; do NOT run supabase db push.

alter table public.whatsapp_contacts
  add column if not exists lead_stage text not null default 'NEW',
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists custom_fields jsonb not null default '{}'::jsonb,
  add column if not exists opt_in_status text not null default 'UNKNOWN',
  add column if not exists opt_in_at timestamptz,
  add column if not exists opt_out_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_contacts_lead_stage_check'
      and conrelid = 'public.whatsapp_contacts'::regclass
  ) then
    alter table public.whatsapp_contacts
      add constraint whatsapp_contacts_lead_stage_check
      check (lead_stage in ('NEW', 'QUALIFIED', 'FOLLOW_UP', 'CUSTOMER', 'REPEAT_CUSTOMER', 'LOST'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_contacts_opt_in_status_check'
      and conrelid = 'public.whatsapp_contacts'::regclass
  ) then
    alter table public.whatsapp_contacts
      add constraint whatsapp_contacts_opt_in_status_check
      check (opt_in_status in ('UNKNOWN', 'OPTED_IN', 'OPTED_OUT'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_contacts_custom_fields_object_check'
      and conrelid = 'public.whatsapp_contacts'::regclass
  ) then
    alter table public.whatsapp_contacts
      add constraint whatsapp_contacts_custom_fields_object_check
      check (jsonb_typeof(custom_fields) = 'object');
  end if;
end
$$;

create index if not exists whatsapp_contacts_lead_stage_idx
  on public.whatsapp_contacts (lead_stage, updated_at desc);

create index if not exists whatsapp_contacts_opt_in_status_idx
  on public.whatsapp_contacts (opt_in_status, updated_at desc);

create index if not exists whatsapp_contacts_tags_gin_idx
  on public.whatsapp_contacts using gin (tags);
