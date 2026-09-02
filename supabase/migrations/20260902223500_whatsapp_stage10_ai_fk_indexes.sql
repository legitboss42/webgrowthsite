-- Stage 10 AI layer: cover foreign keys used by deletes, joins and operational lookups.
create index if not exists whatsapp_ai_agents_created_by_member_idx
  on public.whatsapp_ai_agents (created_by_member_id);
create index if not exists whatsapp_ai_agents_updated_by_member_idx
  on public.whatsapp_ai_agents (updated_by_member_id);
create index if not exists whatsapp_ai_knowledge_sources_created_by_member_idx
  on public.whatsapp_ai_knowledge_sources (created_by_member_id);
create index if not exists whatsapp_ai_knowledge_sources_updated_by_member_idx
  on public.whatsapp_ai_knowledge_sources (updated_by_member_id);
create index if not exists whatsapp_ai_settings_updated_by_member_idx
  on public.whatsapp_ai_settings (updated_by_member_id);
create index if not exists whatsapp_ai_usage_conversation_idx
  on public.whatsapp_ai_usage (conversation_id);
create index if not exists whatsapp_ai_usage_run_idx
  on public.whatsapp_ai_usage (run_id);
create index if not exists whatsapp_conversations_ai_agent_idx
  on public.whatsapp_conversations (ai_agent_id);
