# WhatsApp BSP for WebGrowth — Project Handoff

Last updated: 2026-09-02

## Standing execution rules

1. Discuss and agree each stage before implementation unless the user explicitly says to proceed.
2. Stage rule: Build → production test → fix every discovered issue → retest → mark 100% complete → only then unlock the next stage.
3. After implementing or fixing a stage/slice, always give the user a SHORT Codex instruction telling Codex to use a LIVE PRODUCTION BROWSER. The instruction MUST contain the complete current Owner test list for that stage/slice.
4. CURRENT STAGE GATES ARE TESTED WITH THE OWNER ACCOUNT ONLY. Manager and Agent role testing is deliberately deferred to a later dedicated permission-testing pass and must not block current stage completion unless the user changes this rule.
5. Codex is TESTING-ONLY. Codex must not edit code, commit, deploy, apply migrations, or fix failures. It only runs live-browser tests and returns PASS/FAIL/N/A plus exact observations/errors. ChatGPT handles fixes.
6. Avoid duplicate deployments. Bundle implementation/fix code, tests, docs, and checkpoint/handoff updates into the SAME commit before moving `main`. Do not make a separate docs-only/status commit after a code deployment.
7. Database migrations are additive Supabase SQL and are applied manually in Supabase SQL Editor. Never run `supabase db push` for the WhatsApp platform.
8. Whenever a migration is required, always paste the FULL SQL migration in chat, not just the filename/path.
9. Keep infrastructure zero-cost/free-tier until paying clients justify upgrades.
10. WhatsApp work goes directly to `main` unless a temporary Git object is genuinely required; do not create routine feature branches.
11. Do not touch the separate TikTok scheduler areas while working on WhatsApp.
12. Official Meta WhatsApp Cloud API only. Never claim Meta BSP/Partner certification unless actually verified.
13. Existing working features must be regression-tested before a stage is marked complete.

## Repository

- Repo: `legitboss42/webgrowthsite`
- Branch: `main`
- Production site: `https://webgrowth.info`
- WhatsApp admin: `/admin/whatsapp/`

## Authoritative 12-stage roadmap

1. Stabilise existing WhatsApp functionality
2. Team & Agent Management
3. Contact CRM
4. Saved Replies & Agent Productivity
5. WhatsApp Template Manager
6. Automation Engine
7. Campaigns & Broadcasts
8. WhatsApp Flows
9. Advanced Analytics
10. AI Layer (zero-cost until revenue)
11. Multi-Business / SaaS
12. Client Onboarding & Commercial Launch

## Completion status

- Stage 1 — COMPLETE / production verified
- Stage 2 — COMPLETE / production verified
- Stage 3 — COMPLETE / production verified
- Stage 4 — COMPLETE / production verified
- Stage 5 — **100% COMPLETE / Owner production verified 2026-09-02**
- Stage 6 — **CURRENT STAGE; 6A implementation in progress/code-ready pending migration + Owner gate**
- Stage 7 onward — LOCKED until Stage 6 passes its final production gate

## Stage 3

Contact CRM is complete, including automatic/manual contacts, editable profiles, pipeline, tags, custom fields, consent history, timeline, call/message history, CSV import/export, permissions, mobile/desktop, and Stage 1/2 regression.

## Stage 4

Saved Replies & Agent Productivity is complete. Includes Team + Personal replies, ownership, categories, variables, CRM custom-field variables, resolved preview, missing-variable warnings, slash search, keyboard navigation, full composer browser, one optional image/video/document/audio attachment, private Supabase storage, media send behavior, permissions, and Stage 1/2/3 regression.

Main Stage 4 implementation commit: `fcbb6f083b8d50f4c2dbc0620f82f662a984a9e0`
Stage 4 completion checkpoint: `37106e8396faaec837e2fbb201f3c9a5152aa1ba`

## Stage 5 — COMPLETE

Main implementation commit: `b07384ea16138fc82db11c61a9778bcb8488ee2b`
Meta-ID visibility fix: `36e9ecd9c60a4d998c1a8baa8c198a953155df14`
Approved-filter fix: `eb5497270564f000c3a9cf384eaf032dcedc729c`

Owner production verification passed:
- Meta template load/search/status filters
- draft create/edit/delete and refresh persistence
- duplicate-name protection
- Utility/Marketing previews
- separate HEADER/BODY variables and real delivered positions
- invalid variable rejection
- Quick Reply/Website/Phone persistence
- real Meta submission
- visible Meta Template ID + local lock
- live Pending/Approved status refresh
- supported live-template duplication
- approved test-send
- mobile/desktop
- Stages 1–4 regression

Rejected-template reason remained N/A because the WABA had no rejected template; N/A does not block Stage 5. Manager/Agent testing remains deferred by project rule.

Stage 5 migration applied:
`supabase/migrations/202609020001_whatsapp_template_manager_stage5.sql`

## Stage 6 — Automation Engine

Stage 6 is split into:
- 6A Builder + durable foundation
- 6B Triggers + conditions
- 6C Actions
- 6D Delay/execution engine
- 6E History + runtime safety

### Stage 6A code scope

Implemented/staged:
- `/admin/whatsapp/automations/`
- live Automations navigation item
- persistent workflow definitions
- name/description/status/version
- trigger type + trigger config
- AND/OR conditions
- ordered actions
- Draft/Active/Paused persistence
- create/edit/duplicate/activate/pause/delete
- duplicate-name rejection
- direct config-loop rejection for tag and CRM-stage self loops
- STOP-last validation
- delay and webhook validation
- durable tables for runs, delayed jobs and run events
- trigger-event dedupe unique index foundation
- model tests added to `test:whatsapp`

Important boundary: Active workflows are only persisted as Active in 6A. Runtime trigger execution starts in 6B; the UI says this explicitly.

Stage 6A migration:
`supabase/migrations/202609020002_whatsapp_automation_foundation_stage6.sql`

Stage 6A Owner gate:
1. Automations navigation/page loads.
2. Missing migration shows warning, not crash.
3. Owner creates Draft automation.
4. Automation survives refresh.
5. Edit persists and version increments.
6. Duplicate copy saves under unique name.
7. Duplicate name rejected.
8. Trigger-specific validation works.
9. Conditions + AND/OR persist.
10. Ordered actions persist.
11. Delay amount/unit persists and validates.
12. Self-loop + STOP-last validation works.
13. Draft → Active → Paused persists; Active cannot delete until paused.
14. Mobile/desktop + Stages 1–5 regression passes.

Do not test actual trigger execution in 6A; that is 6B–6D work.

## Applied migrations before Stage 6

- `202609010001_whatsapp_contact_crm_stage3.sql`
- `202609010002_whatsapp_saved_replies_stage4.sql`
- `202609010003_whatsapp_saved_reply_media_stage4.sql`
- `202609020001_whatsapp_template_manager_stage5.sql`

## Platform/DB safety

WhatsApp data uses Supabase/PostgREST with service-role access server-side. The repository also uses Neon elsewhere. Never run WhatsApp migrations against the generic Neon/DATABASE_URL database. TikTok migrations are separate and must not be touched.

## Codex testing instruction rule

After each implementation/fix, ChatGPT outputs a concise instruction equivalent to:

> Use the live production browser on webgrowth.info to test the current WhatsApp stage/slice using the OWNER account only. TEST ONLY. Do not edit code, commit, deploy, apply migrations, or fix anything. Run every listed test and return PASS/FAIL/N/A plus exact observations.

Manager/Agent testing stays out of current gates until the later permissions-testing pass.
