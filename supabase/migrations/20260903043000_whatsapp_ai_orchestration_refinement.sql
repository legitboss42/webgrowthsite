begin;

alter table public.whatsapp_ai_settings
  add column if not exists billing_mode text not null default 'FREE_ONLY',
  add column if not exists free_credit_floor_usd numeric(12,6) not null default 0.10,
  add column if not exists business_instructions text not null default '',
  add column if not exists orchestration_mode text not null default 'AUTO';

alter table public.whatsapp_ai_settings
  drop constraint if exists whatsapp_ai_settings_billing_mode_check,
  add constraint whatsapp_ai_settings_billing_mode_check
    check (billing_mode in ('DISABLED','FREE_ONLY','BUDGET_CAPPED')),
  drop constraint if exists whatsapp_ai_settings_free_credit_floor_usd_check,
  add constraint whatsapp_ai_settings_free_credit_floor_usd_check
    check (free_credit_floor_usd >= 0 and free_credit_floor_usd <= 1000),
  drop constraint if exists whatsapp_ai_settings_orchestration_mode_check,
  add constraint whatsapp_ai_settings_orchestration_mode_check
    check (orchestration_mode in ('AUTO'));

update public.whatsapp_ai_settings
set billing_mode = case when monthly_budget_usd > 0 then 'BUDGET_CAPPED' else 'FREE_ONLY' end,
    model = 'AUTO',
    orchestration_mode = 'AUTO'
where id = 'default';

alter table public.whatsapp_ai_agents
  add column if not exists objective text not null default '',
  add column if not exists required_fields text[] not null default '{}'::text[],
  add column if not exists objective_completion text not null default 'HANDOFF',
  add column if not exists uncertainty_mode text not null default 'STRICT',
  add column if not exists action_policies jsonb not null default '{}'::jsonb;

alter table public.whatsapp_ai_agents
  drop constraint if exists whatsapp_ai_agents_objective_completion_check,
  add constraint whatsapp_ai_agents_objective_completion_check
    check (objective_completion in ('CONTINUE','HANDOFF')),
  drop constraint if exists whatsapp_ai_agents_uncertainty_mode_check,
  add constraint whatsapp_ai_agents_uncertainty_mode_check
    check (uncertainty_mode in ('STRICT','BALANCED','FLEXIBLE')),
  drop constraint if exists whatsapp_ai_agents_action_policies_object_check,
  add constraint whatsapp_ai_agents_action_policies_object_check
    check (jsonb_typeof(action_policies) = 'object');

update public.whatsapp_ai_agents a
set action_policies = coalesce(
  (
    select jsonb_object_agg(action_name, 'AUTO')
    from unnest(a.allowed_actions) action_name
  ),
  '{}'::jsonb
)
where action_policies = '{}'::jsonb;

alter table public.whatsapp_ai_knowledge_sources
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.whatsapp_ai_knowledge_sources
  drop constraint if exists whatsapp_ai_knowledge_sources_metadata_object_check,
  add constraint whatsapp_ai_knowledge_sources_metadata_object_check
    check (jsonb_typeof(metadata) = 'object');

create index if not exists whatsapp_ai_actions_workspace_status_created_idx
  on public.whatsapp_ai_actions (workspace_id, status, created_at desc);
create index if not exists whatsapp_ai_agents_workspace_status_updated_idx
  on public.whatsapp_ai_agents (workspace_id, status, updated_at desc);
create index if not exists whatsapp_ai_knowledge_sources_workspace_status_updated_idx
  on public.whatsapp_ai_knowledge_sources (workspace_id, status, updated_at desc);

-- Stage 10's original search RPC predates multi-workspace tenancy. Keep it for the
-- currently deployed, disabled AI code, but give the refined runtime a mandatory
-- workspace-scoped entry point so an empty source list can never search another tenant.
create or replace function public.search_whatsapp_ai_knowledge_scoped(
  query_text text,
  workspace_id_arg uuid,
  source_ids uuid[] default null,
  match_limit integer default 8
)
returns table(source_id uuid, source_title text, chunk_id uuid, content text, rank real)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (
    select websearch_to_tsquery('simple', coalesce(nullif(trim(query_text), ''), 'information')) as query
  )
  select s.id, s.title, c.id, c.content, ts_rank_cd(c.search_vector, q.query)::real
  from public.whatsapp_ai_knowledge_chunks c
  join public.whatsapp_ai_knowledge_sources s
    on s.id = c.source_id
   and s.workspace_id = c.workspace_id
  cross join q
  where workspace_id_arg is not null
    and s.workspace_id = workspace_id_arg
    and c.workspace_id = workspace_id_arg
    and s.status = 'READY'
    and (source_ids is null or c.source_id = any(source_ids))
    and c.search_vector @@ q.query
  order by ts_rank_cd(c.search_vector, q.query) desc, c.chunk_index asc
  limit least(greatest(coalesce(match_limit, 8), 1), 20);
$$;

revoke all on function public.search_whatsapp_ai_knowledge_scoped(text, uuid, uuid[], integer) from public, anon, authenticated;
grant execute on function public.search_whatsapp_ai_knowledge_scoped(text, uuid, uuid[], integer) to service_role;

comment on function public.search_whatsapp_ai_knowledge_scoped(text, uuid, uuid[], integer)
is 'Workspace-scoped Stage 10 AI knowledge retrieval used by the refined multi-tenant runtime.';

commit;
