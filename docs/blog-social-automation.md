# Blog-to-Social Automation

## Current status

The blog-to-social automation feature is being developed on `feature/blog-social-automation`.

### Production database

The Supabase migration for the social automation schema was explicitly approved and applied to the Web Growth production Supabase project on 2026-09-06.

Production migration history records:

- Version: `20260906105535`
- Name: `blog_social_automation`

The feature-branch migration file has been aligned to that recorded production version:

- `supabase/migrations/20260906105535_blog_social_automation.sql`

The following tables now exist in production with RLS enabled:

- `social_automation_jobs`
- `social_media_assets`
- `social_publications`
- `social_connections`
- `social_automation_settings`
- `social_automation_audit_log`

The private `social-automation` Storage bucket also exists in production.

Default settings are present with automation enabled, Instagram enabled, Facebook enabled, TikTok generation enabled, 7-day asset retention, and timezone `Africa/Lagos`.

### Security model

The new social tables revoke browser access from `anon` and `authenticated` and grant CRUD access to `service_role`. Supabase security advisors therefore report the expected informational `RLS Enabled No Policy` notices for these service-role-only tables. This is intentional and does not expose the tables to browser clients.

Supabase Auth separately reports leaked-password protection as disabled. That is an existing project-level Auth warning and is not created by the social automation migration.

### Performance advisor follow-up

The production advisor reports informational missing covering indexes for three new foreign keys:

- `social_media_assets.job_id`
- `social_publications.media_id`
- `social_automation_audit_log.publication_id`

These should be handled as a reviewed follow-up migration during the remaining feature work rather than silently changing production outside the approved migration scope.

### Deployment boundary

The production database migration is live, but application deployment remains blocked by project policy:

- Do not merge `feature/blog-social-automation` to `main` yet.
- Do not trigger a production Vercel deployment yet.
- Vercel preview deployment remains disabled for this feature branch.
- Complete code, tests, docs, cleanup behavior, workflow automation, and final verification before requesting approval for the single application deployment.
