-- Stage 10: provider-neutral WhatsApp AI layer.
-- All AI persistence is server-only. RLS is enabled with no browser policies.

create table if not exists public.whatsapp_ai_settings (
  id text primary key default 'default' check (id = 'default'),
  enabled boolean not null default false,
  provider text not null default 'VERCEL_AI_GATEWAY' check (provider in ('VERCEL_AI_GATEWAY')),
  model text not null default 'google/gemini-3.5-flash-lite',
  assist_enabled boolean not null default true,
  agents_enabled boolean not null default false,
  default_knowledge_mode text not null default 'KNOWLEDGE_ONLY' check (default_knowledge_mode in ('KNOWLEDGE_ONLY','KNOWLEDGE_PLUS_GENERAL')),
  daily_request_limit integer not null default 50 check (daily_request_limit between 1 and 10000),
  monthly_budget_usd numeric(12,6) not null default 0 check (monthly_budget_usd >= 0),
  max_output_tokens integer not null default 350 check (max_output_tokens between 50 and 4000),
  max_agent_turns integer not null default 10 check (max_agent_turns between 1 and 50),
  updated_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.whatsapp_ai_settings (id) values ('default') on conflict (id) do nothing;

create table if not exists public.whatsapp_ai_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_scope text not null default 'default',
  title text not null,
  source_type text not null default 'MANUAL' check (source_type in ('MANUAL','URL','DOCUMENT')),
  source_uri text,
  content text not null default '',
  status text not null default 'READY' check (status in ('PROCESSING','READY','ERROR')),
  created_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  updated_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_ai_knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.whatsapp_ai_knowledge_sources(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null,
  search_vector tsvector generated always as (to_tsvector('simple', coalesce(content, ''))) stored,
  created_at timestamptz not null default now(),
  unique (source_id, chunk_index)
);

create index if not exists whatsapp_ai_knowledge_chunks_search_idx on public.whatsapp_ai_knowledge_chunks using gin(search_vector);
create index if not exists whatsapp_ai_knowledge_chunks_source_idx on public.whatsapp_ai_knowledge_chunks(source_id, chunk_index);

create table if not exists public.whatsapp_ai_agents (
  id uuid primary key default gen_random_uuid(),
  workspace_scope text not null default 'default',
  name text not null,
  description text not null default '',
  role text not null,
  instructions text not null,
  tone text not null default 'Professional, concise and helpful',
  knowledge_mode text not null default 'KNOWLEDGE_ONLY' check (knowledge_mode in ('KNOWLEDGE_ONLY','KNOWLEDGE_PLUS_GENERAL')),
  knowledge_source_ids uuid[] not null default '{}',
  allowed_actions text[] not null default '{}',
  handoff_rules jsonb not null default '{}'::jsonb,
  working_hours jsonb not null default '{}'::jsonb,
  max_turns integer not null default 10 check (max_turns between 1 and 50),
  fallback_message text not null default 'I’ll connect you with someone who can help.',
  model_override text,
  status text not null default 'DRAFT' check (status in ('DRAFT','ACTIVE','PAUSED')),
  created_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  updated_by_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_ai_agents_status_idx on public.whatsapp_ai_agents(status, updated_at desc);

alter table public.whatsapp_conversations add column if not exists ai_handling_mode text not null default 'HUMAN';
alter table public.whatsapp_conversations add column if not exists ai_agent_id uuid references public.whatsapp_ai_agents(id) on delete set null;
alter table public.whatsapp_conversations add column if not exists ai_turn_count integer not null default 0;
alter table public.whatsapp_conversations add column if not exists ai_last_handoff_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'whatsapp_conversations_ai_handling_mode_check') then
    alter table public.whatsapp_conversations add constraint whatsapp_conversations_ai_handling_mode_check check (ai_handling_mode in ('HUMAN','AI'));
  end if;
end $$;

create index if not exists whatsapp_conversations_ai_handler_idx on public.whatsapp_conversations(ai_handling_mode, ai_agent_id) where ai_handling_mode = 'AI';

create table if not exists public.whatsapp_ai_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_scope text not null default 'default',
  conversation_id uuid references public.whatsapp_conversations(id) on delete set null,
  agent_id uuid references public.whatsapp_ai_agents(id) on delete set null,
  feature text not null check (feature in ('ASSIST','SUMMARY','SANDBOX','AGENT','AUTOMATION')),
  status text not null default 'RUNNING' check (status in ('RUNNING','SUCCEEDED','FAILED','CANCELLED')),
  input_message_id text,
  output_text text,
  provider text,
  model text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(12,8),
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists whatsapp_ai_runs_agent_message_unique_idx on public.whatsapp_ai_runs(input_message_id, feature) where input_message_id is not null and feature = 'AGENT' and status in ('RUNNING','SUCCEEDED');
create index if not exists whatsapp_ai_runs_created_idx on public.whatsapp_ai_runs(created_at desc);
create index if not exists whatsapp_ai_runs_conversation_idx on public.whatsapp_ai_runs(conversation_id, created_at desc);
create index if not exists whatsapp_ai_runs_agent_idx on public.whatsapp_ai_runs(agent_id, created_at desc);

create table if not exists public.whatsapp_ai_actions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.whatsapp_ai_runs(id) on delete cascade,
  action_type text not null,
  status text not null check (status in ('PROPOSED','EXECUTED','REJECTED','FAILED')),
  proposed_payload jsonb not null default '{}'::jsonb,
  executed_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists whatsapp_ai_actions_run_idx on public.whatsapp_ai_actions(run_id, created_at);

create table if not exists public.whatsapp_ai_usage (
  id uuid primary key default gen_random_uuid(),
  workspace_scope text not null default 'default',
  run_id uuid references public.whatsapp_ai_runs(id) on delete set null,
  agent_id uuid references public.whatsapp_ai_agents(id) on delete set null,
  conversation_id uuid references public.whatsapp_conversations(id) on delete set null,
  feature text not null,
  provider text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(12,8),
  created_at timestamptz not null default now()
);
create index if not exists whatsapp_ai_usage_created_idx on public.whatsapp_ai_usage(created_at desc);
create index if not exists whatsapp_ai_usage_agent_idx on public.whatsapp_ai_usage(agent_id, created_at desc);

alter table public.whatsapp_ai_settings enable row level security;
alter table public.whatsapp_ai_knowledge_sources enable row level security;
alter table public.whatsapp_ai_knowledge_chunks enable row level security;
alter table public.whatsapp_ai_agents enable row level security;
alter table public.whatsapp_ai_runs enable row level security;
alter table public.whatsapp_ai_actions enable row level security;
alter table public.whatsapp_ai_usage enable row level security;

create or replace function public.search_whatsapp_ai_knowledge(query_text text, source_ids uuid[] default null, match_limit integer default 8)
returns table(source_id uuid, source_title text, chunk_id uuid, content text, rank real)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (select websearch_to_tsquery('simple', coalesce(nullif(trim(query_text), ''), 'information')) as query)
  select s.id, s.title, c.id, c.content, ts_rank_cd(c.search_vector, q.query)::real
  from public.whatsapp_ai_knowledge_chunks c
  join public.whatsapp_ai_knowledge_sources s on s.id = c.source_id
  cross join q
  where s.status = 'READY'
    and (source_ids is null or c.source_id = any(source_ids))
    and c.search_vector @@ q.query
  order by ts_rank_cd(c.search_vector, q.query) desc, c.chunk_index asc
  limit least(greatest(coalesce(match_limit, 8), 1), 20);
$$;

revoke all on function public.search_whatsapp_ai_knowledge(text, uuid[], integer) from public, anon, authenticated;
grant execute on function public.search_whatsapp_ai_knowledge(text, uuid[], integer) to service_role;

comment on table public.whatsapp_ai_settings is 'Stage 10 WhatsApp AI safety, provider and cost controls. Provider secrets remain environment-only.';
comment on table public.whatsapp_ai_agents is 'Stage 10 AI Agent definitions. Models propose only allow-listed actions executed by trusted server code.';
comment on table public.whatsapp_ai_knowledge_sources is 'Stage 10 business knowledge sources; server-only via RLS with no browser policies.';
comment on table public.whatsapp_ai_runs is 'Stage 10 auditable AI generation and autonomous-agent runs.';
