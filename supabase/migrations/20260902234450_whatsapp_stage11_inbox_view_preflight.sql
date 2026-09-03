-- Stage 11 preflight for fresh databases.
-- Before workspace_id exists, whatsapp_conversation_inbox_state is a view created by Stage 1.
-- Drop only that legacy view so the generic tenant-table backfill migration can safely skip it.
-- On an already-migrated production database this is a no-op.
do $$
begin
  if to_regclass('public.whatsapp_workspaces') is null
     and exists (
       select 1
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public'
         and c.relname = 'whatsapp_conversation_inbox_state'
         and c.relkind = 'v'
     ) then
    execute 'drop view public.whatsapp_conversation_inbox_state';
  end if;
end $$;
