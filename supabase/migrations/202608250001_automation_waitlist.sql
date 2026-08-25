-- Automation waitlist for the /automation early-access landing page.
--
-- Security model matches public.whatsapp_* : row level security is enabled and
-- NO policies are defined, so the anon/public key cannot select, insert, update
-- or delete. All access goes through the server using the service role key,
-- which bypasses RLS. Never expose the service role key to the browser.

create extension if not exists pgcrypto;

create table if not exists public.automation_waitlist (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  business_name text,
  interest text not null default 'both'
    check (interest in ('whatsapp', 'tiktok', 'both')),
  use_case text,
  business_size text
    check (business_size is null or business_size in ('solo', '2-5', '6-20', '21-50', '50+')),
  source text not null default 'automation_waitlist_landing_page',
  status text not null default 'waitlisted'
    check (status in ('waitlisted', 'invited', 'activated', 'declined')),
  consent_at timestamptz not null default now(),
  consent_source text not null default 'automation_waitlist_landing_page',
  confirmation_email_status text not null default 'pending'
    check (confirmation_email_status in ('pending', 'sent', 'failed', 'skipped')),
  confirmation_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per person. Lets a resubmission update the existing record instead of
-- creating endless duplicates, and is the conflict target for the upsert.
-- A plain column index (not lower(email)) is required so PostgREST can use it
-- as an on_conflict target; the server lowercases every address before writing,
-- in validateWaitlistSubmission().
create unique index if not exists automation_waitlist_email_key
  on public.automation_waitlist (email);

-- Admin dashboard reads newest first and filters by interest.
create index if not exists automation_waitlist_created_idx
  on public.automation_waitlist (created_at desc);
create index if not exists automation_waitlist_interest_idx
  on public.automation_waitlist (interest, created_at desc);

alter table public.automation_waitlist enable row level security;

-- Defensive: revoke any inherited table privileges from the public-facing roles.
-- With RLS on and no policies these roles are already blocked, but an explicit
-- revoke means a future permissive policy cannot silently open the table up.
revoke all on public.automation_waitlist from anon;
revoke all on public.automation_waitlist from authenticated;

comment on table public.automation_waitlist is
  'Early-access waitlist signups from the /automation landing page. Server-only access via service role; RLS enabled with no policies.';
