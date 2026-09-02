# WhatsApp BSP for WebGrowth — Project Handoff

Last updated: 2026-09-02

## Standing execution rules

1. Discuss and agree each stage before implementation unless the user explicitly says to proceed.
2. Stage rule: Build → production test → fix every discovered issue → retest → mark 100% complete → only then unlock the next stage.
3. After implementing or fixing a stage, always give the user a SHORT Codex instruction telling Codex to use a LIVE PRODUCTION BROWSER. The instruction MUST contain the complete current Owner test list for that stage.
4. CURRENT STAGE GATES ARE TESTED WITH THE OWNER ACCOUNT ONLY. Manager and Agent role testing is deliberately deferred to a later dedicated permission-testing pass and must not block current stage completion unless the user changes this rule.
5. Codex is TESTING-ONLY. Codex must not edit code, commit, deploy, apply migrations, or fix failures. It only runs live-browser tests and returns PASS/FAIL/N/A plus exact observations/errors. ChatGPT handles fixes.
6. Avoid duplicate deployments. Bundle implementation/fix code, tests, docs, and checkpoint/handoff updates into the SAME commit before moving `main`. Do not make a separate docs-only/status commit after a code deployment. One implementation/fix commit should produce one intended deployment.
7. Database migrations are additive Supabase SQL and are applied manually in Supabase SQL Editor. Never run `supabase db push` for the WhatsApp platform.
8. Whenever a migration is required, always paste the FULL SQL migration in chat, not just the filename/path.
9. Keep infrastructure zero-cost/free-tier until paying clients justify upgrades.
10. WhatsApp work goes directly to `main` unless the user changes this rule.
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
- Stage 5 — IMPLEMENTED; Owner production gate has one remaining retest after status-filter fix
- Stage 6 — LOCKED until Stage 5 Owner production gate passes

## Stage 3

Contact CRM is complete, including automatic/manual contacts, editable profiles, pipeline, tags, custom fields, consent history, timeline, call/message history, CSV import/export, permissions, mobile/desktop, and Stage 1/2 regression.

## Stage 4

Saved Replies & Agent Productivity is complete. Includes Team + Personal replies, ownership, categories, variables, CRM custom-field variables, resolved preview, missing-variable warnings, slash search, keyboard navigation, full composer browser, one optional image/video/document/audio attachment, private Supabase storage, media send behavior, permissions, and Stage 1/2/3 regression.

Main Stage 4 implementation commit: `fcbb6f083b8d50f4c2dbc0620f82f662a984a9e0`
Stage 4 completion checkpoint: `37106e8396faaec837e2fbb201f3c9a5152aa1ba`

## Stage 5 — Current stage

Main implementation commit: `b07384ea16138fc82db11c61a9778bcb8488ee2b`
Meta-ID visibility fix: `36e9ecd9c60a4d998c1a8baa8c198a953155df14`

Implemented:
- live Meta template sync
- search and status filters
- Approved / Pending / Rejected / Paused / Disabled states
- rejection reason and quality metadata when Meta provides them
- persistent local drafts in Supabase
- Owner/Manager draft-management code and Agent read-only code exist; non-Owner role testing is deferred
- Utility + Marketing template drafts
- text header / body / footer
- positional variables with separate HEADER and BODY sample-value scopes
- phone-style preview
- Quick Reply buttons
- Website buttons
- Phone buttons
- submit directly to Meta WABA `message_templates`
- store Meta Template ID after submission
- visibly display Meta Template IDs for submitted drafts
- prevent accidental double submission
- duplicate supported live templates
- approved-template test send through the phone-number `messages` endpoint
- specialized Authentication/media-header templates remain visible but their unsupported creation workflows are not faked

Stage 5 migration:
`supabase/migrations/202609020001_whatsapp_template_manager_stage5.sql`

### Latest Owner live-browser results

Codex tested production with the Owner account only and made no project changes.

Passed:
- Owner create/edit/delete drafts
- saved/submitted draft survives refresh
- duplicate name + language rejected
- Utility and Marketing previews
- separate HEADER/BODY sample variables and real delivered variable positions
- named/non-sequential variables rejected
- Quick Reply, Website and Phone persistence with Meta-compatible grouping rules
- real draft submission to Meta
- submitted draft locks and visibly shows Meta Template ID (`1087050393758212` in the QA run)
- Meta refresh shows real statuses; `codex_stage5_qa_1788316315750` reached APPROVED
- supported live-template duplication
- approved variable-template test send
- mobile/desktop layout
- Stages 1–4 smoke regression for Overview, Conversations, Calls, Contacts and Quick Replies

N/A during testing:
- rejection-reason rendering because the WABA currently has no REJECTED template. N/A is acceptable and does not block Stage 5 while no rejected template exists.

Only confirmed failure from the latest Owner retest:
- selecting the Approved status filter returned no results even though approved templates were present on clean load

Current fix being deployed/retested:
- normalize status-filter values before comparison
- selecting a status clears any previous search text so a stale search cannot make the status filter appear broken

### Current Stage 5 Owner production gate

1. Meta templates load; search and status filters work.
2. Rejected template shows rejection reason if one exists; otherwise N/A is acceptable.
3. Owner can create, edit and delete editable drafts.
4. Draft survives refresh.
5. Duplicate template name + language is rejected.
6. Utility and Marketing previews work.
7. Header/body variables use separate sample values and resolve correctly.
8. Invalid, named or non-sequential variables are rejected.
9. Quick Reply, Website and Phone buttons persist correctly.
10. Draft submits successfully to Meta.
11. Submitted draft locks and visibly shows its Meta Template ID.
12. Meta refresh shows real Pending/Approved/Rejected status.
13. Supported live template duplicates correctly.
14. Approved template test-send works with variables in the correct positions.
15. Mobile/desktop work and Stages 1–4 smoke regression passes.

Manager and Agent tests are deferred to a later dedicated permissions pass and are not part of this Stage 5 completion gate.

Stage 5 can be marked complete once the Approved status-filter fix is verified in production, since all other directly-testable Owner-gate items have passed and rejection rendering is currently N/A.

## Relevant migrations already applied before Stage 5

- `202609010001_whatsapp_contact_crm_stage3.sql`
- `202609010002_whatsapp_saved_replies_stage4.sql`
- `202609010003_whatsapp_saved_reply_media_stage4.sql`
- `202609020001_whatsapp_template_manager_stage5.sql`

## Platform/DB safety

WhatsApp data uses Supabase/PostgREST with service-role access server-side. The repository also uses Neon elsewhere. Never run WhatsApp migrations against the generic Neon/DATABASE_URL database. TikTok migrations are separate and must not be touched.

## Codex testing instruction rule

After every future stage implementation/fix, ChatGPT must output a concise instruction similar to:

> Use the live production browser on webgrowth.info to test Stage X using the OWNER account only. TEST ONLY. Do not edit code, commit, deploy, apply migrations, or fix anything. Run every test below, record PASS/FAIL/N/A for each, and report exact observations/errors back to ChatGPT. Test list: [COMPLETE OWNER STAGE TEST LIST].

Do not include Manager/Agent testing in current stage gates unless the user explicitly starts the later permissions-testing pass. Do not omit any Owner-gate test from the Codex instruction.
