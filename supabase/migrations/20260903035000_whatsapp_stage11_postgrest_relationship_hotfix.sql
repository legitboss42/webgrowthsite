-- Stage 11 hotfix: remove legacy single-column foreign keys that became
-- ambiguous to PostgREST after tenant-safe composite foreign keys were added.
--
-- The composite (entity_id, workspace_id) constraints are strictly stronger:
-- they preserve the original referential action while also preventing a child
-- row from referencing a parent in another workspace. This migration refuses
-- to drop a legacy constraint unless its validated composite replacement exists.

do $$
declare
  required_constraint text;
begin
  foreach required_constraint in array array[
    'whatsapp_conversations_contact_workspace_fkey',
    'whatsapp_messages_conversation_workspace_fkey',
    'whatsapp_automation_runs_automation_workspace_fkey',
    'whatsapp_automation_jobs_run_workspace_fkey',
    'whatsapp_campaign_recipients_campaign_workspace_fkey',
    'whatsapp_campaign_events_recipient_workspace_fkey',
    'whatsapp_ai_actions_run_workspace_fkey'
  ]
  loop
    if not exists (
      select 1
      from pg_constraint
      where conname = required_constraint
        and convalidated
    ) then
      raise exception 'Refusing Stage 11 relationship hotfix: required validated constraint % is missing', required_constraint;
    end if;
  end loop;
end $$;

alter table public.whatsapp_conversations
  drop constraint if exists whatsapp_conversations_contact_id_fkey;

alter table public.whatsapp_messages
  drop constraint if exists whatsapp_messages_conversation_id_fkey;

alter table public.whatsapp_automation_runs
  drop constraint if exists whatsapp_automation_runs_automation_id_fkey;

alter table public.whatsapp_automation_jobs
  drop constraint if exists whatsapp_automation_jobs_run_id_fkey;

alter table public.whatsapp_campaign_recipients
  drop constraint if exists whatsapp_campaign_recipients_campaign_id_fkey;

alter table public.whatsapp_campaign_events
  drop constraint if exists whatsapp_campaign_events_recipient_id_fkey;

alter table public.whatsapp_ai_actions
  drop constraint if exists whatsapp_ai_actions_run_id_fkey;

-- PostgREST normally reloads its schema cache automatically after DDL, but
-- notify explicitly so the repaired relationships are visible immediately.
notify pgrst, 'reload schema';
