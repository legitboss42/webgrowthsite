-- Stage 9 Advanced Analytics
-- Additive time-range indexes only. No analytics copies or PII duplication.

create index if not exists whatsapp_messages_timestamp_idx
  on public.whatsapp_messages (message_timestamp desc);

create index if not exists whatsapp_team_activity_created_idx
  on public.whatsapp_team_activity (created_at desc);

create index if not exists whatsapp_automation_runs_created_idx
  on public.whatsapp_automation_runs (created_at desc);

create index if not exists whatsapp_campaign_recipients_created_idx
  on public.whatsapp_campaign_recipients (created_at desc);

create index if not exists whatsapp_flow_submissions_created_idx
  on public.whatsapp_flow_submissions (created_at desc);

create index if not exists whatsapp_calls_started_idx
  on public.whatsapp_calls (started_at desc)
  where started_at is not null;

create index if not exists whatsapp_contacts_created_idx
  on public.whatsapp_contacts (created_at desc);
