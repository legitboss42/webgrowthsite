-- Stage 11: enforce commercial workspace limits at the database boundary.
-- Application UIs may show friendlier warnings, but these triggers prevent any API,
-- worker, or future route from bypassing the active plan.

create or replace function public.whatsapp_workspace_limit(
  p_workspace_id uuid,
  p_limit_column text
) returns integer
language plpgsql
stable
set search_path = public
as $$
declare
  result integer;
begin
  if p_workspace_id is null then return 0; end if;
  if p_limit_column = 'max_team_members' then
    select max_team_members into result from public.whatsapp_workspace_entitlements where workspace_id = p_workspace_id;
  elsif p_limit_column = 'max_automations' then
    select max_automations into result from public.whatsapp_workspace_entitlements where workspace_id = p_workspace_id;
  elsif p_limit_column = 'max_campaign_recipients_monthly' then
    select max_campaign_recipients_monthly into result from public.whatsapp_workspace_entitlements where workspace_id = p_workspace_id;
  elsif p_limit_column = 'max_ai_requests_daily' then
    select max_ai_requests_daily into result from public.whatsapp_workspace_entitlements where workspace_id = p_workspace_id;
  else
    raise exception 'Unsupported workspace entitlement column';
  end if;
  return coalesce(result, 0);
end;
$$;

create or replace function public.whatsapp_enforce_team_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  allowed integer;
  used integer;
begin
  if not coalesce(new.active, false) then return new; end if;
  allowed := public.whatsapp_workspace_limit(new.workspace_id, 'max_team_members');
  select count(*) into used
  from public.whatsapp_team_members
  where workspace_id = new.workspace_id
    and active = true
    and id <> new.id;
  if used >= allowed then
    raise exception using errcode = 'P0001', message = 'WORKSPACE_TEAM_LIMIT_REACHED';
  end if;
  return new;
end;
$$;

drop trigger if exists whatsapp_team_members_plan_limit on public.whatsapp_team_members;
create trigger whatsapp_team_members_plan_limit
before insert or update of active, workspace_id on public.whatsapp_team_members
for each row execute function public.whatsapp_enforce_team_limit();

create or replace function public.whatsapp_enforce_automation_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  allowed integer;
  used integer;
begin
  allowed := public.whatsapp_workspace_limit(new.workspace_id, 'max_automations');
  select count(*) into used
  from public.whatsapp_automations
  where workspace_id = new.workspace_id
    and id <> new.id;
  if used >= allowed then
    raise exception using errcode = 'P0001', message = 'WORKSPACE_AUTOMATION_LIMIT_REACHED';
  end if;
  return new;
end;
$$;

drop trigger if exists whatsapp_automations_plan_limit on public.whatsapp_automations;
create trigger whatsapp_automations_plan_limit
before insert or update of workspace_id on public.whatsapp_automations
for each row execute function public.whatsapp_enforce_automation_limit();

create or replace function public.whatsapp_enforce_campaign_recipient_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  allowed integer;
  used integer;
  month_start timestamptz := date_trunc('month', now());
  month_end timestamptz := date_trunc('month', now()) + interval '1 month';
begin
  allowed := public.whatsapp_workspace_limit(new.workspace_id, 'max_campaign_recipients_monthly');
  select count(*) into used
  from public.whatsapp_campaign_recipients
  where workspace_id = new.workspace_id
    and created_at >= month_start
    and created_at < month_end
    and id <> new.id;
  if used >= allowed then
    raise exception using errcode = 'P0001', message = 'WORKSPACE_CAMPAIGN_RECIPIENT_LIMIT_REACHED';
  end if;
  return new;
end;
$$;

drop trigger if exists whatsapp_campaign_recipients_plan_limit on public.whatsapp_campaign_recipients;
create trigger whatsapp_campaign_recipients_plan_limit
before insert or update of workspace_id on public.whatsapp_campaign_recipients
for each row execute function public.whatsapp_enforce_campaign_recipient_limit();

create or replace function public.whatsapp_enforce_ai_daily_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  allowed integer;
  used integer;
  day_start timestamptz := date_trunc('day', now());
  day_end timestamptz := date_trunc('day', now()) + interval '1 day';
begin
  allowed := public.whatsapp_workspace_limit(new.workspace_id, 'max_ai_requests_daily');
  select count(*) into used
  from public.whatsapp_ai_usage
  where workspace_id = new.workspace_id
    and created_at >= day_start
    and created_at < day_end
    and id <> new.id;
  if used >= allowed then
    raise exception using errcode = 'P0001', message = 'WORKSPACE_AI_DAILY_LIMIT_REACHED';
  end if;
  return new;
end;
$$;

drop trigger if exists whatsapp_ai_usage_plan_limit on public.whatsapp_ai_usage;
create trigger whatsapp_ai_usage_plan_limit
before insert or update of workspace_id on public.whatsapp_ai_usage
for each row execute function public.whatsapp_enforce_ai_daily_limit();

create index if not exists whatsapp_campaign_recipients_workspace_created_idx
  on public.whatsapp_campaign_recipients (workspace_id, created_at desc);
create index if not exists whatsapp_ai_usage_workspace_created_idx
  on public.whatsapp_ai_usage (workspace_id, created_at desc);
