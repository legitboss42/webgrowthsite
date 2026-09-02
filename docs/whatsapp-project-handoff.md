# WhatsApp BSP for WebGrowth — Project Handoff

Last updated: 2026-09-02

## Standing execution rules

1. Discuss and agree each stage before implementation unless the user explicitly says to proceed.
2. Stage rule: Build → production test → fix every discovered issue → retest → mark 100% complete → only then unlock the next stage.
3. After implementing any stage, always give the user a SHORT Codex instruction telling Codex to use a LIVE BROWSER for production testing. The instruction MUST include the COMPLETE test list for that stage.
4. Codex is TESTING-ONLY for these stage gates. Codex must not edit code, commit, deploy, apply migrations, or fix failures. It must only run the live-browser tests and report PASS/FAIL plus exact observations/errors. ChatGPT handles all fixes in this project.
5. Database migrations are additive Supabase SQL and are applied manually in Supabase SQL Editor. Never run `supabase db push` for the WhatsApp platform.
6. Whenever a migration is required, always paste the FULL SQL migration in chat, not just the filename/path.
7. Keep infrastructure zero-cost/free-tier until paying clients justify upgrades.
8. WhatsApp work goes directly to `main` unless the user changes this rule.
9. Do not touch the separate TikTok scheduler areas while working on WhatsApp.
10. Official Meta WhatsApp Cloud API only. Never claim Meta BSP/Partner certification unless actually verified.
11. Existing working features must be regression-tested before a stage is marked complete.

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
- Stage 5 — IMPLEMENTED; production gate pending
- Stage 6 — LOCKED until Stage 5 passes production testing

## Stage 3

Contact CRM is complete, including automatic/manual contacts, editable profiles, pipeline, tags, custom fields, consent history, timeline, call/message history, CSV import/export, permissions, mobile/desktop, and Stage 1/2 regression.

## Stage 4

Saved Replies & Agent Productivity is complete. Includes Team + Personal replies, ownership, categories, variables, CRM custom-field variables, resolved preview, missing-variable warnings, slash search, keyboard navigation, full composer browser, one optional image/video/document/audio attachment, private Supabase storage, media send behavior, permissions, and Stage 1/2/3 regression.

Main Stage 4 implementation commit: `fcbb6f083b8d50f4c2dbc0620f82f662a984a9e0`
Stage 4 completion checkpoint: `37106e8396faaec837e2fbb201f3c9a5152aa1ba`

## Stage 5 — Current stage

Implementation commit: `b07384ea16138fc82db11c61a9778bcb8488ee2b`

Implemented:
- live Meta template sync
- search and status filters
- Approved / Pending / Rejected / Paused / Disabled states
- rejection reason and quality metadata when Meta provides them
- persistent local drafts in Supabase
- Owner/Manager draft management
- Agent read-only access
- Utility + Marketing template drafts
- text header / body / footer
- positional variables with separate HEADER and BODY sample-value scopes
- phone-style preview
- Quick Reply buttons
- Website buttons
- Phone buttons
- submit directly to Meta WABA `message_templates`
- store Meta Template ID after submission
- prevent accidental double submission
- duplicate normal supported templates
- approved-template test send through the phone-number `messages` endpoint
- specialized Authentication/media-header templates remain visible but their unsupported creation workflows are not faked

Stage 5 migration:
`supabase/migrations/202609020001_whatsapp_template_manager_stage5.sql`

Current Stage 5 gate:
1. Existing Meta templates load and search/filter correctly.
2. Rejected templates show rejection reason where Meta provides one.
3. Owner + Manager can create/edit/delete drafts.
4. Agent sees live templates but cannot manage drafts or test-send.
5. Draft survives refresh.
6. Duplicate name + language is rejected.
7. Utility and Marketing drafts preview correctly.
8. Header `{{1}}` and Body `{{1}}`, `{{2}}` use separate sample-value scopes and resolve correctly.
9. Missing/non-sequential/named variables are rejected.
10. Quick Reply, Website and Phone buttons persist correctly.
11. Save a real draft and Submit to Meta.
12. Successful submission receives a Meta Template ID and becomes locally locked.
13. Refresh Meta and verify actual Pending / Approved / Rejected status.
14. Duplicate a normal live template into a fresh draft.
15. Once an approved template is available, Send test to a real WhatsApp number and verify header/body variable positions.
16. Check mobile + desktop and regression-test Stages 1–4.

Stage 5 must not be marked complete until all 16 production tests pass.

## Relevant migrations already applied before Stage 5

- `202609010001_whatsapp_contact_crm_stage3.sql`
- `202609010002_whatsapp_saved_replies_stage4.sql`
- `202609010003_whatsapp_saved_reply_media_stage4.sql`

## Platform/DB safety

WhatsApp data uses Supabase/PostgREST with service-role access server-side. The repository also uses Neon elsewhere. Never run WhatsApp migrations against the generic Neon/DATABASE_URL database. TikTok migrations are separate and must not be touched.

## Codex testing instruction rule

After every future stage implementation, ChatGPT must output a concise instruction similar to:

> Use the live production browser on webgrowth.info to test Stage X end-to-end. TEST ONLY. Do not edit code, commit, deploy, apply migrations, or fix anything. Run every test below, record PASS/FAIL for each, and report exact observations/errors back to ChatGPT. Test list: [COMPLETE STAGE TEST LIST].

Do not omit any stage test from the Codex instruction.
