create table if not exists public.whatsapp_team_members (
  id uuid primary key default gen_random_uuid(),
  google_email text not null unique,
  display_name text not null,
  role text not null default 'agent' check (role in ('owner', 'manager', 'agent')),
  availability text not null default 'available' check (availability in ('available', 'busy', 'offline')),
  active boolean not null default true,
  google_user_id text,
  last_seen_at timestamptz,
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_team_members_email_lowercase check (google_email = lower(google_email))
);

create index if not exists whatsapp_team_members_active_idx
  on public.whatsapp_team_members (active, role, display_name);

alter table public.whatsapp_conversations
  add column if not exists assigned_member_id uuid references public.whatsapp_team_members(id) on delete set null;

create index if not exists whatsapp_conversations_assigned_member_idx
  on public.whatsapp_conversations (assigned_member_id, last_message_at desc);

update public.whatsapp_conversations c
set assigned_member_id = t.id
from public.whatsapp_team_members t
where c.assigned_member_id is null
  and c.assigned_to is not null
  and lower(trim(c.assigned_to)) = t.google_email;

create table if not exists public.whatsapp_team_activity (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.whatsapp_conversations(id) on delete cascade,
  actor_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  actor_email text,
  target_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_team_activity_conversation_idx
  on public.whatsapp_team_activity (conversation_id, created_at desc);
create index if not exists whatsapp_team_activity_actor_idx
  on public.whatsapp_team_activity (actor_member_id, created_at desc);

create table if not exists public.whatsapp_internal_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  author_member_id uuid references public.whatsapp_team_members(id) on delete set null,
  author_email text,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_internal_notes_conversation_idx
  on public.whatsapp_internal_notes (conversation_id, created_at asc);

create table if not exists public.whatsapp_note_mentions (
  note_id uuid not null references public.whatsapp_internal_notes(id) on delete cascade,
  member_id uuid not null references public.whatsapp_team_members(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (note_id, member_id)
);

create index if not exists whatsapp_note_mentions_member_idx
  on public.whatsapp_note_mentions (member_id, read_at, created_at desc);

create table if not exists public.whatsapp_conversation_presence (
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  member_id uuid not null references public.whatsapp_team_members(id) on delete cascade,
  is_typing boolean not null default false,
  last_seen_at timestamptz not null default now(),
  primary key (conversation_id, member_id)
);

create index if not exists whatsapp_conversation_presence_recent_idx
  on public.whatsapp_conversation_presence (conversation_id, last_seen_at desc);

alter table public.whatsapp_team_members enable row level security;
alter table public.whatsapp_team_activity enable row level security;
alter table public.whatsapp_internal_notes enable row level security;
alter table public.whatsapp_note_mentions enable row level security;
alter table public.whatsapp_conversation_presence enable row level security;

revoke all on public.whatsapp_team_members from anon, authenticated;
revoke all on public.whatsapp_team_activity from anon, authenticated;
revoke all on public.whatsapp_internal_notes from anon, authenticated;
revoke all on public.whatsapp_note_mentions from anon, authenticated;
revoke all on public.whatsapp_conversation_presence from anon, authenticated;

grant all on public.whatsapp_team_members to service_role;
grant all on public.whatsapp_team_activity to service_role;
grant all on public.whatsapp_internal_notes to service_role;
grant all on public.whatsapp_note_mentions to service_role;
grant all on public.whatsapp_conversation_presence to service_role;
