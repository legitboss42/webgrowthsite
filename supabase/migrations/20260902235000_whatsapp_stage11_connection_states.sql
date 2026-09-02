-- Stage 11: a workspace may save Meta connection metadata before its encrypted token
-- is supplied. Only a CONNECTED encrypted-DB connection must have ciphertext.
do $$
declare
  constraint_name text;
begin
  select c.conname into constraint_name
  from pg_constraint c
  where c.conrelid = 'public.whatsapp_workspace_connections'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%credential_source%'
    and pg_get_constraintdef(c.oid) ilike '%encrypted_access_token%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.whatsapp_workspace_connections drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.whatsapp_workspace_connections
  add constraint whatsapp_workspace_connections_credentials_check
  check (
    credential_source = 'ENV'
    or encrypted_access_token is not null
    or status = 'NOT_CONFIGURED'
  );
