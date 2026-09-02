begin;

create index if not exists whatsapp_automation_jobs_automation_idx
  on public.whatsapp_automation_jobs (automation_id);

create index if not exists whatsapp_automations_created_by_idx
  on public.whatsapp_automations (created_by_member_id)
  where created_by_member_id is not null;

create index if not exists whatsapp_automations_updated_by_idx
  on public.whatsapp_automations (updated_by_member_id)
  where updated_by_member_id is not null;

create index if not exists whatsapp_flows_created_by_idx
  on public.whatsapp_flows (created_by_member_id)
  where created_by_member_id is not null;

create index if not exists whatsapp_flows_updated_by_idx
  on public.whatsapp_flows (updated_by_member_id)
  where updated_by_member_id is not null;

create index if not exists whatsapp_flow_versions_created_by_idx
  on public.whatsapp_flow_versions (created_by_member_id)
  where created_by_member_id is not null;

create index if not exists whatsapp_flow_events_contact_idx
  on public.whatsapp_flow_events (contact_id)
  where contact_id is not null;

create index if not exists whatsapp_flow_events_conversation_idx
  on public.whatsapp_flow_events (conversation_id)
  where conversation_id is not null;

commit;
