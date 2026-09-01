-- Stage 4A Saved Replies: team/personal scope, ownership, and categories.
-- Additive to the existing whatsapp_quick_replies table.
-- Apply manually in the Supabase SQL editor. Do NOT run supabase db push.

alter table public.whatsapp_quick_replies
  add column if not exists scope text not null default 'TEAM',
  add column if not exists category text not null default 'General',
  add column if not exists owner_member_id uuid references public.whatsapp_team_members(id) on delete cascade,
  add column if not exists created_by_member_id uuid references public.whatsapp_team_members(id) on delete set null;

-- Every pre-Stage-4 quick reply remains a Team reply.
update public.whatsapp_quick_replies
set scope = 'TEAM',
    category = case when nullif(trim(category), '') is null then 'General' else trim(category) end,
    owner_member_id = null
where scope is null
   or scope not in ('TEAM', 'PERSONAL')
   or (scope = 'TEAM' and owner_member_id is not null)
   or nullif(trim(category), '') is null;

-- The original schema made shortcut globally unique. Stage 4 needs the same
-- personal shortcut to be reusable by different team members.
alter table public.whatsapp_quick_replies
  drop constraint if exists whatsapp_quick_replies_shortcut_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_quick_replies_scope_check'
      and conrelid = 'public.whatsapp_quick_replies'::regclass
  ) then
    alter table public.whatsapp_quick_replies
      add constraint whatsapp_quick_replies_scope_check
      check (scope in ('TEAM', 'PERSONAL'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_quick_replies_category_length_check'
      and conrelid = 'public.whatsapp_quick_replies'::regclass
  ) then
    alter table public.whatsapp_quick_replies
      add constraint whatsapp_quick_replies_category_length_check
      check (char_length(trim(category)) between 1 and 50);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_quick_replies_scope_owner_check'
      and conrelid = 'public.whatsapp_quick_replies'::regclass
  ) then
    alter table public.whatsapp_quick_replies
      add constraint whatsapp_quick_replies_scope_owner_check
      check (
        (scope = 'TEAM' and owner_member_id is null)
        or
        (scope = 'PERSONAL' and owner_member_id is not null)
      );
  end if;
end
$$;

create unique index if not exists whatsapp_quick_replies_team_shortcut_unique_idx
  on public.whatsapp_quick_replies (shortcut)
  where scope = 'TEAM';

create unique index if not exists whatsapp_quick_replies_personal_owner_shortcut_unique_idx
  on public.whatsapp_quick_replies (owner_member_id, shortcut)
  where scope = 'PERSONAL';

create index if not exists whatsapp_quick_replies_scope_category_idx
  on public.whatsapp_quick_replies (scope, category, shortcut);

create index if not exists whatsapp_quick_replies_owner_idx
  on public.whatsapp_quick_replies (owner_member_id, shortcut)
  where owner_member_id is not null;
