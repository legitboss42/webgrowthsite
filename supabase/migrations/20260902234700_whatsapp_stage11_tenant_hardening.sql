-- Stage 11 hardening after the broad workspace backfill.

-- The simple nullable foreign keys already own SET NULL behavior. Composite tenant-match
-- FKs on those same nullable columns would also try to null workspace_id, which must
-- never happen. Keep tenant matching enforced in the server data layer for these four.
alter table public.whatsapp_conversations drop constraint if exists whatsapp_conversations_assignee_workspace_fkey;
alter table public.whatsapp_flow_submissions drop constraint if exists whatsapp_flow_submissions_flow_workspace_fkey;
alter table public.whatsapp_flow_events drop constraint if exists whatsapp_flow_events_submission_workspace_fkey;
alter table public.whatsapp_ai_runs drop constraint if exists whatsapp_ai_runs_agent_workspace_fkey;

-- A Meta call id is only operationally meaningful inside its recipient business number.
alter table public.whatsapp_calls drop constraint if exists whatsapp_calls_pkey;
alter table public.whatsapp_calls add constraint whatsapp_calls_pkey primary key (workspace_id, call_id);

-- Preserve compatibility with any server path that still creates a team membership
-- directly. Every membership is anchored to one platform identity before it is stored.
create or replace function public.whatsapp_stage11_bind_platform_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bound_user_id uuid;
begin
  if new.user_id is not null then return new; end if;

  insert into public.whatsapp_platform_users (email, display_name, google_user_id, platform_role, active)
  values (
    lower(new.google_email),
    coalesce(nullif(trim(new.display_name), ''), lower(new.google_email)),
    new.google_user_id,
    'USER',
    true
  )
  on conflict (email) do update set
    display_name = coalesce(nullif(trim(excluded.display_name), ''), public.whatsapp_platform_users.display_name),
    google_user_id = coalesce(excluded.google_user_id, public.whatsapp_platform_users.google_user_id),
    active = true,
    updated_at = now()
  returning id into bound_user_id;

  new.user_id := bound_user_id;
  return new;
end;
$$;

revoke all on function public.whatsapp_stage11_bind_platform_user() from public;

drop trigger if exists whatsapp_team_members_bind_platform_user on public.whatsapp_team_members;
create trigger whatsapp_team_members_bind_platform_user
before insert or update of google_email, user_id on public.whatsapp_team_members
for each row execute function public.whatsapp_stage11_bind_platform_user();

create index if not exists whatsapp_calls_workspace_last_event_idx
  on public.whatsapp_calls (workspace_id, last_event_at desc);
