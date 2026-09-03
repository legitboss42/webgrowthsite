# WhatsApp Settings Architecture

Last updated: 2026-09-03

## Rule

Every code change to the WhatsApp BSP must include a corresponding documentation update in the same task/change set. Each task gets one production deployment only.

## Settings split

Settings are now deliberately separated into two scopes.

### Workspace settings

Owner-only routes under `/admin/whatsapp/settings/`:
- General
- WhatsApp
- Inbox
- CRM
- Team
- Notifications
- Automations
- AI
- Campaigns
- Integrations
- Security
- Data & Privacy

These routes preserve Stage 11 workspace isolation and use the authenticated active workspace. Existing functional controls remain backed by their current runtime/storage systems rather than being duplicated.

### Platform settings

Platform-admin-only routes under `/admin/whatsapp/platform/settings/`:
- General
- Workspaces
- Plans & Entitlements
- Meta
- Email
- AI
- Security
- System Health
- Audit Logs
- Feature Flags
- Commercial

Platform routes require `platformAdmin === true` and are separate from ordinary workspace ownership.

## Global platform persistence

Migration: `supabase/migrations/20260903070000_whatsapp_platform_settings.sql`

Table: `public.whatsapp_platform_settings`

Purpose: server-only global platform configuration that does not belong to any tenant workspace. RLS is enabled and no browser policies are created. Application access remains server-side and platform-admin gated.

Seeded defaults keep spending/billing disabled:
- maintenance mode off
- global AI off
- AI emergency kill switch available
- AI default request limit 0
- AI default monthly budget $0
- billing disabled
- trial 14 days
- grace period 7 days
- platform support email `admin@webgrowth.info`
- default timezone `Africa/Lagos`

## Route governance

All new private settings pages are explicitly registered in `scripts/validate-sitemap.mjs` as private application routes. They must never appear in public sitemap governance or become indexable merely because they use App Router pages.

The shared route shells resolve workspace auth from the WhatsApp app root (`../auth` for workspace settings and `../../auth` for platform settings). Preview validation caught and corrected those relative imports before production merge.

## Stage boundaries

This settings architecture does not rebuild Stage 11 and does not weaken tenant boundaries. Commercial payment processing remains deferred to Stage 13. Stage 12 may refine the visual/application experience of these routes while preserving behavior and routing.
