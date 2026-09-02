# WhatsApp BSP for WebGrowth — Project Handoff

Last updated: 2026-09-02

## Standing execution rules

1. Discuss each roadmap stage before implementation unless the user explicitly says proceed.
2. Stage rule: build → production test → fix failures → retest → mark 100% → unlock next stage.
3. Stage 6 exception explicitly requested by user: implement all of 6A–6E first, then run ONE combined test. Do not interrupt Stage 6 with slice-by-slice testing.
4. Current stage gates are OWNER ACCOUNT ONLY. Manager/Agent testing is deferred to a later dedicated permissions pass and does not block completion.
5. Codex is TEST-ONLY. Codex uses the live production browser, reports PASS/FAIL/N/A + exact observations, and NEVER edits code, commits, deploys, applies migrations, or fixes failures. ChatGPT handles fixes.
6. Avoid duplicate deployments. Bundle code, tests, migration, docs and checkpoint changes into the same commit before moving `main`. Do not make separate docs/status deployments.
7. WhatsApp migrations are additive Supabase SQL, applied manually in Supabase SQL Editor. Never `supabase db push` and never apply them to Neon/DATABASE_URL.
8. Whenever migration is required, paste the FULL SQL in chat.
9. Keep infrastructure zero-cost/free-tier until paying clients justify upgrades.
10. WhatsApp work goes directly to `main`; do not create routine feature branches/worktrees.
11. Do not touch the separate TikTok scheduler areas while working on WhatsApp.
12. Official Meta WhatsApp Cloud API only. Do not claim Meta BSP/Partner certification unless verified.
13. Existing working functionality must be regression-tested before a stage is marked complete.

## Repository / production

- Repo: `legitboss42/webgrowthsite`
- Branch: `main`
- Production: `https://webgrowth.info`
- WhatsApp console: `/admin/whatsapp/`
- Automations: `/admin/whatsapp/automations/`

## Authoritative roadmap

1. Stabilise existing — COMPLETE
2. Team & Agent Management — COMPLETE
3. Contact CRM — COMPLETE
4. Saved Replies & Agent Productivity — COMPLETE
5. WhatsApp Template Manager — 100% COMPLETE / Owner production verified 2026-09-02
6. Automation Engine — CURRENT / FULL IMPLEMENTATION READY; migration + combined Owner gate pending
7. Campaigns & Broadcasts — LOCKED
8. WhatsApp Flows — LOCKED
9. Advanced Analytics — LOCKED
10. AI Layer — LOCKED; zero-cost until revenue
11. Multi-Business / SaaS — LOCKED
12. Client Onboarding & Commercial Launch — LOCKED

## Stage 5 checkpoint

Stage 5 Owner production gate passed: Meta template loading/search/status filtering, draft CRUD/persistence, variables/buttons, real Meta submission/status refresh, visible Meta Template ID, supported duplication, approved test-send, mobile/desktop and Stages 1–4 regression. Rejected-template reason remained N/A because no rejected template existed. Manager/Agent testing remains deferred.

## Stage 6 — Automation Engine

The user supplied Respond.io workflow references and wants a real visual workflow product rather than a form-only automation page.

Implemented scope:
- Respond.io-inspired dotted workflow canvas with connected nodes, Yes/No branches, zoom and right-side inspector
- up to 100 workflow steps
- Draft / Active / Paused lifecycle; Active workflows read-only until paused
- persistent definitions + versioning
- triggers: NEW_MESSAGE, KEYWORD, NEW_CONTACT, TAG_ADDED, CRM_STAGE_CHANGED, CONVERSATION_ASSIGNED, MISSED_CALL, NO_CUSTOMER_REPLY, NO_AGENT_REPLY, BUSINESS_HOURS, WEBHOOK
- AND/OR entry conditions and branch conditions
- custom CRM condition paths (`contact.custom.<field>`) and webhook payload paths (`trigger.payload.<path>`)
- actions: SEND_TEXT, SEND_TEMPLATE, SEND_SAVED_REPLY, ASSIGN_CONVERSATION, ADD_TAG, REMOVE_TAG, UPDATE_CRM_STAGE, UPDATE_CONTACT_FIELD, ADD_INTERNAL_NOTE, DELAY, CALL_WEBHOOK, BRANCH, STOP
- Team Saved Reply media reuse
- real Meta webhook execution for message/keyword/contact/call events
- manual CRM route execution for new contact/tag/stage changes
- assignment-route execution for conversation assignment
- durable runs/jobs/events
- one-minute Supabase pg_cron + pg_net processor for delay/no-reply/business-hours work
- source-event dedupe and ancestry/depth loop protection
- free-form/Saved Reply service-window enforcement
- retries/backoff for delayed jobs
- run history, per-step inspection, exact failures and waiting-run cancellation
- automation activity written to existing contact timeline

Stage 6 migration:
`supabase/migrations/202609020002_whatsapp_automation_foundation_stage6.sql`

The same filename now contains the complete idempotent Stage 6 schema/runtime schedule. If the earlier 6A foundation was already applied, running the full final SQL safely extends it.

Stage 6 testing rule:
- Apply full migration manually in Supabase SQL Editor.
- Wait for the single Stage 6 deployment to be green.
- Give Codex ONE Owner-only live-browser instruction containing the complete Stage 6 test list in `docs/whatsapp-stage6-automation-engine.md`.
- Codex tests only and reports. ChatGPT fixes failures.
- Stage 7 stays locked until the combined Stage 6 Owner gate passes.

## Applied migrations before Stage 6

- `202609010001_whatsapp_contact_crm_stage3.sql`
- `202609010002_whatsapp_saved_replies_stage4.sql`
- `202609010003_whatsapp_saved_reply_media_stage4.sql`
- `202609020001_whatsapp_template_manager_stage5.sql`

## Platform facts / safety

- Meta Graph API: v26.0
- Phone Number ID: `1192139290658384`
- WABA ID: `987693860957754`
- Main webhook: `https://webgrowth.info/api/whatsapp/webhook/`
- WhatsApp persistence: Supabase/PostgREST with service-role access server-side
- Meta secret values remain environment-only
- TikTok scheduler remains a separate project boundary
- Current cost rule: free-tier/zero-cost infrastructure until revenue
