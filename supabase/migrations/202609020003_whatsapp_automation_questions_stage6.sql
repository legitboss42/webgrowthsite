-- Stage 6 conversational questions: durable customer-choice waits.
-- Additive/idempotent. Apply manually in Supabase SQL Editor only.
-- Never run supabase db push and never apply WhatsApp migrations to Neon/DATABASE_URL.

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_automation_jobs_status_check'
      and conrelid = 'public.whatsapp_automation_jobs'::regclass
  ) then
    alter table public.whatsapp_automation_jobs
      drop constraint whatsapp_automation_jobs_status_check;
  end if;
end
$$;

alter table public.whatsapp_automation_jobs
  add constraint whatsapp_automation_jobs_status_check
  check (status in ('PENDING', 'PROCESSING', 'WAITING_INPUT', 'SUCCEEDED', 'FAILED', 'CANCELLED'));

create index if not exists whatsapp_automation_jobs_waiting_input_idx
  on public.whatsapp_automation_jobs (created_at asc)
  where status = 'WAITING_INPUT';
