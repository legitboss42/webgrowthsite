# WhatsApp BSP for WebGrowth — Project Handoff

Last updated: 2026-09-02

## Standing execution rules

1. Discuss each roadmap stage before implementation unless the user explicitly says proceed.
2. Stage rule: build → production test → fix failures → retest → mark 100% → unlock next stage.
3. Stages 6, 7, 8 and 9 have been implemented. Stage 6 is in its final delayed No Reply production check; Stages 7 and 8 still require their full Owner production gates; Stage 9 is implemented and branch-validated, with its Owner production gate next after promotion.
4. Current stage gates are OWNER ACCOUNT ONLY. Manager/Agent testing is deferred and does not block completion.
5. Codex is TEST-ONLY unless the user explicitly authorizes live-UI configuration. It never edits source code, commits, deploys or applies migrations.
6. Never deploy partially completed stage work to production. Finish code, tests, migrations, documentation and branch validation first, then promote the finished stage to `main` as one production deployment.
7. WhatsApp migrations are additive Supabase SQL. Use controlled Supabase migrations; never `supabase db push` and never apply them to Neon/DATABASE_URL.
8. Keep infrastructure zero-cost/free-tier until revenue.
9. Do not touch TikTok scheduler areas while working on the WhatsApp BSP.
10. Official Meta WhatsApp Cloud API only. Do not claim Meta BSP/Partner certification unless verified.
11. Existing working functionality must be regression-tested before stage completion.
12. Temporary implementation branches are allowed when necessary to satisfy the no-partial-production-deployment rule; delete/ignore them after the finished stage is promoted.

## Repository / production

- Repo: `legitboss42/webgrowthsite`
- Branch: `main`
- Production: `https://webgrowth.info`
- WhatsApp console: `/admin/whatsapp/`
- Conversations: `/admin/whatsapp/conversations/`
- Automations: `/admin/whatsapp/automations/`

## Roadmap

1. Stabilise existing — COMPLETE
2. Team & Agent Management — COMPLETE
3. Contact CRM — COMPLETE
4. Saved Replies & Agent Productivity — COMPLETE
5. WhatsApp Template Manager — 100% COMPLETE / Owner production verified 2026-09-02
6. Automation Engine — BUILT / FINAL OWNER TESTING
7. Campaigns & Broadcasts — BUILT / OWNER PRODUCTION TESTING PENDING
8. WhatsApp Flows — BUILT / OWNER PRODUCTION TESTING PENDING
9. Advanced Analytics — BUILT / BRANCH VALIDATED / PRODUCTION PROMOTION + OWNER GATE PENDING
10. AI Layer — NEXT UNBUILT STAGE; zero-cost until revenue
11. Multi-Business / SaaS — NOT BUILT
12. App Experience Redesign — NOT BUILT; final pre-launch frontend overhaul so the workspace feels like a native SaaS application rather than a website/admin portal
13. Client Onboarding & Commercial Launch — NOT BUILT

Implementation has therefore reached Stage 9. Do not describe Stages 7, 8 or 9 as unimplemented. The verification backlog remains: finish the Stage 6 No Reply gate, run the full Stage 7 production gate, run the full Stage 8 production gate, then complete the Stage 9 Owner production gate. New feature implementation after Stage 9 resumes at Stage 10.

The Flow-completion follow-up automation discussed after the first Web Growth project-enquiry Flow is explicitly DEFERRED for later. Do not treat it as blocking Stage 9 or Stage 10 unless the user brings it back into scope.

## Stage 5 checkpoint

Stage 5 Owner production gate passed: Meta template loading/search/status filtering, draft CRUD/persistence, variables/buttons, real Meta submission/status refresh, visible Meta Template ID, supported duplication, approved test-send, mobile/desktop and Stages 1–4 regression. Manager/Agent testing remains deferred.

## Stage 6 — Automation Engine

Current implementation includes:
- Respond.io-inspired dotted workflow canvas, connectors, zoom and 100-step ceiling
- Draft / Active / Paused lifecycle and persistent versioned workflows
- Active workflows read-only until paused; Active Delete absent from UI
- Yes/No branches; empty branch paths valid while building
- triggers: NEW_MESSAGE, KEYWORD, NEW_CONTACT, CONVERSATION_OPENED, TAG_ADDED, CRM_STAGE_CHANGED, CONVERSATION_ASSIGNED, MISSED_CALL, NO_CUSTOMER_REPLY, NO_AGENT_REPLY, BUSINESS_HOURS, WEBHOOK
- AND/OR entry conditions and branch conditions
- custom CRM paths (`contact.custom.<field>`) and webhook payload paths (`trigger.payload.<path>`)
- actions: SEND_TEXT, ASK_QUESTION, SEND_TEMPLATE, SEND_SAVED_REPLY, ASSIGN_CONVERSATION, ADD_TAG, REMOVE_TAG, UPDATE_CRM_STAGE, UPDATE_CONTACT_FIELD, ADD_INTERNAL_NOTE, DELAY, CALL_WEBHOOK, BRANCH, STOP
- Team Saved Reply media reuse
- durable runs/jobs/events, one-minute Supabase processor, dedupe, loop protection, retries/backoff
- service-window enforcement
- run history, per-step inspection, exact failures and waiting-run cancellation
- contact timeline automation activity

### Conversational workflow upgrade

Stage 6 includes:
- Ask Question node
- WhatsApp reply buttons for 2–3 choices
- WhatsApp list choice for 2–10 choices
- durable `WAITING_INPUT` jobs
- Meta inbound `button_reply` / `list_reply` parsing
- automatic run resume after selection
- `{{answer}}` and `{{answer_id}}`
- optional answer storage to supported built-in contact fields or `custom.<field>`
- Branch on the `answer` field
- sequential/chained questions
- question wait visibility/cancellation in Run History

### Bonus Stage 6 conversation-session lifecycle

This is a bonus enhancement inside Stage 6, not a new roadmap stage.

Conversation sessions now use `open` / `closed` lifecycle semantics:
- a brand-new customer conversation is considered opened by its first inbound message
- a customer message to a CLOSED conversation automatically reopens it
- `CONVERSATION_OPENED` fires once when the session changes from closed to open, or for the first-ever message of a new conversation
- subsequent messages while the conversation remains open do not create another Conversation Opened event
- Owner, Manager and a permitted Agent can manually Open chat / Close chat from the Conversations header
- manual Open chat fires the same `CONVERSATION_OPENED` trigger once
- inbound and outbound messages continue updating `last_message_at`, which resets inactivity
- the existing one-minute Stage 6 processor closes open conversations after 4 hours with no inbound or outbound activity
- closing a conversation cancels its QUEUED/RUNNING/WAITING automation runs and PENDING/PROCESSING/WAITING_INPUT jobs, preventing stale questions/delays from resuming after the session is closed
- generic NEW_MESSAGE remains available for specialized workflows/backward compatibility, but the Web Growth master intake should use CONVERSATION_OPENED so replies do not restart intake
- no database migration is required for this bonus because `whatsapp_conversations.status` already stores text and existing `last_message_at` provides the inactivity clock

Important operational rule: if an older test/master workflow is ACTIVE on NEW_MESSAGE while the new CONVERSATION_OPENED master is active, both may run. Pause/remove obsolete NEW_MESSAGE intake workflows before production activation.

### Stage 6 Owner verification already confirmed

Live Owner testing has confirmed the core builder/runtime, real customer Ask Question continuation, Master routing, Business Website, Website Redesign and Automation & CRM qualification journeys, CRM/custom-field persistence, internal notes, final quote routing, Open-session duplicate prevention, automatic reopen, manual-open execution, and close-during-wait cancellation of both the run and WAITING_INPUT job.

Stage 6 is at its final delayed production gate: `WG — NO REPLY FOLLOW-UP` is active and the two-hour no-reply behaviour is being checked separately. Do not mark Stage 6 100% complete until that result is verified.

## Stage 7 — Campaigns & Broadcasts

Stage 7 has already been implemented and is awaiting its full Owner production test. The implementation includes the campaign/segment persistence and runtime foundation represented by the production tables:
- `whatsapp_segments`
- `whatsapp_campaigns`
- `whatsapp_campaign_recipients`
- `whatsapp_campaign_events`
- `whatsapp_campaign_runtime_config`

Do not rebuild Stage 7 from scratch. Test the existing implementation, fix discovered failures, retest, then mark it complete.

## Stage 8 — WhatsApp Flows

Stage 8 has already been implemented and is awaiting its full Owner production test. Existing implementation includes:
- Flow model/runtime and Meta API integration
- Flow admin manager
- dynamic Data API
- Flow send backend and conversation launcher
- encryption configuration/admin support
- Stage 6 `WHATSAPP_FLOW_STARTED` / `WHATSAPP_FLOW_COMPLETED` triggers
- Stage 6 `SEND_WHATSAPP_FLOW` action
- Stage 8 persistence/RLS/runtime tables

Production tables include:
- `whatsapp_flows`
- `whatsapp_flow_versions`
- `whatsapp_flow_submissions`
- `whatsapp_flow_events`
- `whatsapp_flow_runtime_config`

Dynamic Flows require `WHATSAPP_FLOW_PRIVATE_KEY`; static Flows do not. Do not rebuild Stage 8 from scratch. Test the existing implementation, fix failures, retest, then mark it complete.

The first real Web Growth project-enquiry Flow has begun live setup/testing. Any post-submission `WHATSAPP_FLOW_COMPLETED` automation is deferred for later by user instruction and is not a Stage 9 blocker.

## Stage 9 — Advanced Analytics

Stage 9 is implemented on the validated `stage9-advanced-analytics` branch and is ready for production promotion.

It preserves the existing basic Messages and Calls analytics and adds a third `Advanced` view with:
- executive KPIs and previous-equivalent-period trend indicators
- conversation open/close/backlog/message/response-time analytics
- team workload based only on attributable stored activity
- CRM current-state pipeline, temperature, consent, source and tag/service distributions
- automation run states, success/failure rates, durations, per-workflow performance, trigger mix and exact stored failure details
- campaign recipient delivery/read/reply/failure funnels and truthful empty states
- WhatsApp Flow launch/completion/failure/incomplete metrics and per-Flow performance
- integrated high-level WhatsApp call answer/missed/duration metrics
- 7 / 30 / 90 day switching and links back to operational workspaces
- owner-only Advanced Analytics API
- 20,000-row safety caps for time-series reads
- no fake revenue/ROI/Meta billing metrics
- no analytics copy tables or duplicated PII

Implementation files include:
- `src/app/admin/whatsapp/advancedAnalyticsModel.ts`
- `src/app/admin/whatsapp/advancedAnalyticsModel.test.ts`
- `src/app/api/admin/whatsapp/advanced-analytics/route.ts`
- `src/app/admin/whatsapp/analytics/AdvancedAnalyticsPanel.tsx`
- updated `src/app/admin/whatsapp/analytics/layout.tsx`
- `docs/whatsapp-stage9-implementation-checkpoint.md`

Validation before production promotion:
- WhatsApp tests: 178 passed / 0 failed
- sitemap validation passed
- Next.js optimized production compile passed
- TypeScript validity check passed
- independent Supabase data sanity checks matched stored production counts
- Stage 9 performance-index migration applied successfully to production Supabase
- no new blocking Supabase security/performance advisory introduced

Stage 9 performance migration:
`supabase/migrations/20260902223000_whatsapp_stage9_analytics_indexes.sql`

It adds only time-range indexes for message timestamps, team activity, automation runs, campaign recipients, Flow submissions, calls and contact creation. It adds no tables and duplicates no customer data.

Do not mark Stage 9 100% complete until the production deployment loads Advanced Analytics successfully, existing Messages/Calls analytics regress successfully, no new blocking Vercel runtime error appears, and the Owner production gate passes.

## Stage 12 — App Experience Redesign

Stage 12 is a dedicated final frontend/product-experience overhaul before commercial onboarding and launch. Its goal is to make the WhatsApp workspace feel like a cohesive application, not a collection of website/admin pages.

Scope includes:
- app-shell architecture with persistent desktop sidebar and deliberate mobile navigation
- reduced website-like page headers, oversized whitespace and repeated marketing-style cards
- denser, task-oriented workspace layouts where appropriate
- consistent top bars, command/search surfaces, breadcrumbs/context controls and account/workspace controls
- split-pane and resizable workspace patterns for Conversations and other high-frequency tools where useful
- app-style loading, empty, error, success, modal, drawer, toast and confirmation states
- consistent design system for tables, filters, tabs, forms, side panels, menus, badges and action bars
- desktop, tablet and mobile behaviour designed as an application rather than merely responsive webpages
- preserve all functionality, permissions and API contracts while redesigning presentation
- final accessibility, keyboard navigation, focus states and interaction consistency pass
- visual regression and production smoke test across all WhatsApp modules before Stage 13

This stage should happen after feature-heavy Stages 9–11 so the final design is built around the completed product rather than repeatedly redesigned around moving functionality.

## Stage 6 migrations

Base runtime:
`supabase/migrations/202609020002_whatsapp_automation_foundation_stage6.sql`

Conversational questions:
`supabase/migrations/202609020003_whatsapp_automation_questions_stage6.sql`

The conversation-session bonus requires no additional migration.

## Applied migrations

- `202609010001_whatsapp_contact_crm_stage3.sql`
- `202609010002_whatsapp_saved_replies_stage4.sql`
- `202609010003_whatsapp_saved_reply_media_stage4.sql`
- `202609020001_whatsapp_template_manager_stage5.sql`
- Stage 6 automation foundation/questions migrations
- Stage 7 campaigns migrations
- Stage 8 Flows migrations
- `20260902223000_whatsapp_stage9_analytics_indexes.sql`

## Platform facts / safety

- Meta Graph API: v26.0
- Phone Number ID: `1192139290658384`
- WABA ID: `987693860957754`
- Main webhook: `https://webgrowth.info/api/whatsapp/webhook/`
- WhatsApp persistence: Supabase/PostgREST with service-role access server-side
- Meta secret values remain environment-only
- TikTok scheduler is a separate project boundary
- Current cost rule: free-tier/zero-cost infrastructure until revenue
