-- Stage 11: cover the composite tenant foreign keys used to prevent cross-workspace parent/child links.
create index if not exists whatsapp_conversations_contact_workspace_idx
  on public.whatsapp_conversations (contact_id, workspace_id);
create index if not exists whatsapp_messages_conversation_workspace_idx
  on public.whatsapp_messages (conversation_id, workspace_id);
create index if not exists whatsapp_automation_runs_automation_workspace_idx
  on public.whatsapp_automation_runs (automation_id, workspace_id);
create index if not exists whatsapp_automation_jobs_run_workspace_idx
  on public.whatsapp_automation_jobs (run_id, workspace_id);
create index if not exists whatsapp_campaign_recipients_campaign_workspace_idx
  on public.whatsapp_campaign_recipients (campaign_id, workspace_id);
create index if not exists whatsapp_campaign_events_recipient_workspace_idx
  on public.whatsapp_campaign_events (recipient_id, workspace_id);
create index if not exists whatsapp_ai_actions_run_workspace_idx
  on public.whatsapp_ai_actions (run_id, workspace_id);
