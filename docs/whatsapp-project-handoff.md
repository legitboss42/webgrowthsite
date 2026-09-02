# WhatsApp BSP for WebGrowth — Project Handoff

Last updated: 2026-09-02

## Standing execution rules

1. Discuss each roadmap stage before implementation unless the user explicitly says proceed.
2. Stage rule: build → production test → fix failures → retest → mark 100% → unlock next stage.
3. Stages 6, 7 and 8 have been implemented. Stage 6 is in its final delayed No Reply production check; Stages 7 and 8 still require their full Owner production gates before they can be marked 100% complete.
4. Current stage gates are OWNER ACCOUNT ONLY. Manager/Agent testing is deferred and does not block completion.
5. Codex is TEST-ONLY unless the user explicitly authorizes live-UI configuration. It never edits source code, commits, deploys or applies migrations.
6. Avoid duplicate deployments. Bundle code, tests, migrations, docs and checkpoint changes before moving `main`.
7. WhatsApp migrations are additive Supabase SQL, applied manually in Supabase SQL Editor. Never `supabase db push` and never apply them to Neon/DATABASE_URL.
8. Whenever a migration is required, paste the FULL SQL in chat.
9. Keep infrastructure zero-cost/free-tier until revenue.
10. Do not create routine feature branches/worktrees; do not touch TikTok scheduler areas.
11. Official Meta WhatsApp Cloud API only. Do not claim Meta BSP/Partner certification unless verified.
12. Existing working functionality must be regression-tested before stage completion.

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
9. Advanced Analytics — NEXT UNBUILT STAGE; extend existing basic message/call analytics
10. AI Layer — NOT BUILT; zero-cost until revenue
11. Multi-Business / SaaS — NOT BUILT
12. App Experience Redesign — NOT BUILT; final pre-launch frontend overhaul so the workspace feels like a native SaaS application rather than a website/admin portal
13. Client Onboarding & Commercial Launch — NOT BUILT

Implementation has therefore reached Stage 8. Do not describe Stages 7 or 8 as locked or unimplemented. The current verification backlog is: finish the Stage 6 No Reply gate, then run the full Stage 7 production gate, then the full Stage 8 production gate. New feature implementation resumes at Stage 9 after those gates are resolved.

The Flow-completion follow-up automation discussed after the first Web Growth project-enquiry Flow is explicitly DEFERRED for later. Do not treat it as blocking Stage 9 unless the user brings it back into scope.

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

Stage 9 must build on the existing basic Analytics implementation rather than replace it. The repository already contains message/call analytics, message volume, delivery status/rates, response-time measurement, activity series, contact temperature counts and date-range switching.

Stage 9 should turn that foundation into a provider-grade operations and business dashboard covering, where supported by stored production data:
- executive overview KPIs with range comparison and trends
- first-response and resolution/service performance
- conversation volumes, open/closed/reopened behaviour and backlog
- agent/team workload, assignments and response performance
- CRM funnel, lead stages, temperatures, service interest and conversion movement
- automation runs, success/failure/waiting/cancellation rates and top failing workflows/actions
- campaign audience, send/delivery/read/reply/failure performance and campaign comparisons
- Flow launches, completions, abandonment/completion rates and per-Flow performance
- template usage/performance where reliable stored data exists
- call volume/answer/missed/duration metrics integrated into the wider dashboard
- filters by date range, agent, service/tag, campaign, automation and Flow where practical
- drill-down links back to the underlying conversation/contact/run/campaign/Flow
- no invented revenue or Meta metrics; unavailable metrics render as unavailable rather than fake zeroes
- bounded queries/aggregation suitable for the free-tier production database

Prefer deriving metrics from existing tables first. Add additive analytics summary/snapshot tables only when raw-query cost or accuracy genuinely requires them.

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
- TikTok scheduler is a separate project boundary
- Current cost rule: free-tier/zero-cost infrastructure until revenue
