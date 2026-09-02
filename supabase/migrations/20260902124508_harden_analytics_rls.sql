-- Harden legacy analytics tables without breaking the existing analytics-dashboard app.
-- Applied in Supabase as migration 20260902124508_harden_analytics_rls.
--
-- The separate analytics-dashboard app currently uses the anon key to:
--   * INSERT pageviews and vitals
--   * SELECT pageviews and vitals for its dashboard
-- It does not require anonymous UPDATE/DELETE access, and sites/seo_audits are not
-- exposed to anonymous or authenticated clients.

alter table public.pageviews enable row level security;
alter table public.vitals enable row level security;
alter table public.sites enable row level security;
alter table public.seo_audits enable row level security;

-- Remove the broad default Supabase grants first, then restore only the operations
-- the current analytics app actually needs.
revoke all on table public.pageviews from anon, authenticated;
revoke all on table public.vitals from anon, authenticated;
revoke all on table public.sites from anon, authenticated;
revoke all on table public.seo_audits from anon, authenticated;

grant select, insert on table public.pageviews to anon;
grant select, insert on table public.vitals to anon;

grant all on table public.pageviews to service_role;
grant all on table public.vitals to service_role;
grant all on table public.sites to service_role;
grant all on table public.seo_audits to service_role;

-- Recreate the intended anon policies idempotently.
drop policy if exists pageviews_anon_select on public.pageviews;
drop policy if exists pageviews_anon_insert on public.pageviews;
drop policy if exists vitals_anon_select on public.vitals;
drop policy if exists vitals_anon_insert on public.vitals;

create policy pageviews_anon_select
on public.pageviews
for select
to anon
using (true);

create policy pageviews_anon_insert
on public.pageviews
for insert
to anon
with check (
  page_url is not null
  and char_length(page_url) between 1 and 4096
  and (referrer is null or char_length(referrer) <= 4096)
);

create policy vitals_anon_select
on public.vitals
for select
to anon
using (true);

create policy vitals_anon_insert
on public.vitals
for insert
to anon
with check (
  metric_name is not null
  and char_length(metric_name) between 1 and 32
  and metric_value is not null
  and metric_value >= 0
  and (rating is null or char_length(rating) <= 32)
);
