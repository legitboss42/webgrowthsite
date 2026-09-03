# WhatsApp BSP for WebGrowth — Project Handoff

Last updated: 2026-09-03

## Standing execution rules

1. Discuss each roadmap stage before implementation unless the user explicitly says proceed.
2. Stage rule: build → production test → fix failures → retest → mark 100% → unlock next stage.
3. Current stage gates are OWNER ACCOUNT ONLY. Manager/Agent testing is deferred and does not block completion.
4. Never deploy partially completed stage work to production. Finish code, tests, migrations, documentation and branch validation first, then promote the finished stage to `main` once.
5. Temporary implementation branches are allowed when needed to keep partial stage work off `main`.
6. Avoid duplicate deployments.
7. WhatsApp migrations are additive Supabase SQL. Use controlled Supabase migrations; never apply them to Neon/DATABASE_URL.
8. Keep infrastructure zero-cost/free-tier until revenue.
9. Do not touch TikTok scheduler areas while working on the WhatsApp BSP.
10. Official Meta WhatsApp Cloud API only. Do not claim Meta BSP/Partner certification unless verified.
11. Existing working functionality must be regression-tested before stage completion.
12. Codex is TEST-ONLY unless the user explicitly authorizes live-UI configuration. It never edits source code, commits, deploys or applies migrations.

## Repository / production

- Repo: `legitboss42/webgrowthsite`
- Production branch: `main`
- Production: `https://webgrowth.info`
- WhatsApp console: `/admin/whatsapp/`
- Conversations: `/admin/whatsapp/conversations/`
- Automations: `/admin/whatsapp/automations/`
- Analytics: `/admin/whatsapp/analytics/`
- Supabase project: `ockqdqlmzilrnilclwwa`
- Vercel project: `prj_PyxH4g2ZdRjPZWVw9NI47UDn8vh2`

## Roadmap

1. Stabilise existing — COMPLETE
2. Team & Agent Management — COMPLETE
3. Contact CRM — COMPLETE
4. Saved Replies & Agent Productivity — COMPLETE
5. WhatsApp Template Manager — 100% COMPLETE / Owner production verified 2026-09-02
6. Automation Engine — BUILT / FINAL OWNER NO-REPLY TEST PENDING
7. Campaigns & Broadcasts — BUILT / OWNER PRODUCTION TESTING PENDING
8. WhatsApp Flows — BUILT / OWNER PRODUCTION TESTING PENDING
9. Advanced Analytics — BUILT + DEPLOYED / OWNER UI VERIFICATION PENDING
10. AI Layer — IMPLEMENTATION ASSEMBLED ON `stage10-ai-layer`; VALIDATION / MIGRATION / PRODUCTION GATE PENDING
11. Multi-Business / SaaS — 100% COMPLETE / PRODUCTION VERIFIED 2026-09-03
12. App Experience Redesign — NOT BUILT; final pre-launch frontend overhaul so the workspace feels like a cohesive application rather than a website/admin portal
13. Client Onboarding & Commercial Launch — NOT BUILT

Implementation has reached Stage 11. Stage 11 is production-complete. The earlier verification backlog remains separate from feature construction: finish Stage 6 No Reply, Stage 7 Owner production gate, Stage 8 Owner production gate, Stage 9 Owner UI gate, and Stage 10 Owner gate when AI spending is explicitly authorized.

The Flow-completion follow-up automation discussed after the first Web Growth project-enquiry Flow is explicitly DEFERRED for later. Do not silently fold it into another stage.

## Stage 5 checkpoint

Stage 5 Owner production gate passed: Meta template loading/search/status filtering, draft CRUD/persistence, variables/buttons, real Meta submission/status refresh, visible Meta Template ID, supported duplication, approved test-send, mobile/desktop and Stages 1–4 regression. Manager/Agent testing remains deferred.

## Stage 6 — Automation Engine

Implemented:
- visual workflow canvas, connectors, zoom and 100-step ceiling
- Draft / Active / Paused lifecycle and persistent versions
- Active workflows read-only until paused
- triggers: NEW_MESSAGE, KEYWORD, NEW_CONTACT, CONVERSATION_OPENED, TAG_ADDED, CRM_STAGE_CHANGED, CONVERSATION_ASSIGNED, MISSED_CALL, NO_CUSTOMER_REPLY, NO_AGENT_REPLY, BUSINESS_HOURS, WEBHOOK, WHATSAPP_FLOW_STARTED, WHATSAPP_FLOW_COMPLETED
- AND/OR conditions and custom CRM/webhook/Flow paths
- actions: SEND_TEXT, ASK_QUESTION, SEND_TEMPLATE, SEND_SAVED_REPLY, SEND_WHATSAPP_FLOW, ASSIGN_CONVERSATION, ADD_TAG, REMOVE_TAG, UPDATE_CRM_STAGE, UPDATE_CONTACT_FIELD, ADD_INTERNAL_NOTE, DELAY, CALL_WEBHOOK, BRANCH, STOP
- durable runs/jobs/events, one-minute processor, retries/backoff, dedupe and loop protection
- business/service-window enforcement
- run history and exact failures
- interactive questions with buttons/lists, WAITING_INPUT continuation, `{{answer}}` and `{{answer_id}}`
- conversation session lifecycle: open/closed, reopen, CONVERSATION_OPENED once/session, 4h inactivity close, close cancels stale automation jobs/runs

Owner testing already confirmed the core builder/runtime, live customer question continuation, Master routing and multiple service journeys, CRM persistence, internal notes, lifecycle and cancellation behavior. Final Stage 6 gate remains the delayed `WG — NO REPLY FOLLOW-UP` test.

Current production Web Growth workflows include the Master Intake Router and downstream service workflows for Website, Redesign, Landing Page, Ecommerce, SEO, Maintenance, Automation/CRM, Pricing, Existing Client, General Enquiry and No Reply.

## Stage 7 — Campaigns & Broadcasts

Already built. Production tables:
- `whatsapp_segments`
- `whatsapp_campaigns`
- `whatsapp_campaign_recipients`
- `whatsapp_campaign_events`
- `whatsapp_campaign_runtime_config`

Do not rebuild. Run the dedicated Owner production test, fix only discovered failures, retest, then mark complete.

## Stage 8 — WhatsApp Flows

Already built:
- Flow model/runtime and Meta API integration
- Flow admin manager
- Dynamic Data API
- Flow send backend and conversation launcher
- encryption configuration/admin support
- Stage 6 Flow started/completed triggers and Send Flow action
- production persistence/RLS/runtime tables

Production tables:
- `whatsapp_flows`
- `whatsapp_flow_versions`
- `whatsapp_flow_submissions`
- `whatsapp_flow_events`
- `whatsapp_flow_runtime_config`

Dynamic Flow encryption is configured and the public key registration endpoint has returned successful production requests. The first real Flow `WG — PROJECT ENQUIRY` has been created/tested enough to produce one tracked launch/completion. Full Stage 8 Owner gate remains pending.

Any post-submission `WHATSAPP_FLOW_COMPLETED` business automation is deferred by user instruction.

## Stage 9 — Advanced Analytics

Stage 9 is implemented and deployed to production.

Production commit:
`d35c5c495faafaa33cf2fa758c59e92390e9dac8`

Production deployment:
`dpl_69NiHHxk8wGwFqLScpnR9TV5GFKx`

Validation before/within production deployment:
- WhatsApp tests: 178 passed / 0 failed
- sitemap validation passed
- optimized Next.js compile passed
- TypeScript validity passed
- Stage 9 performance-index migration applied
- production deployment READY
- no new Stage 9 runtime error group observed

Analytics preserves Messages and Calls and adds an Advanced workspace with executive KPIs, conversation/backlog/response metrics, team attribution, CRM current-state distributions, automation performance/failures, campaign funnel analytics, Flow analytics, high-level call analytics, 7/30/90-day periods and operational drill-down links.

Stage 9 is complete aside from the Owner UI verification gate.

Stage 9 migration:
`supabase/migrations/20260902223000_whatsapp_stage9_analytics_indexes.sql`

## Stage 10 — AI Layer

Implementation branch:
`stage10-ai-layer`

Detailed specification:
`docs/whatsapp-stage10-ai-layer.md`

Checkpoint:
`docs/whatsapp-stage10-implementation-checkpoint.md`

### Product split

**AI Assist** helps human agents draft/rewrite replies and summarize conversations. Assist never sends automatically.

**AI Agents** can autonomously handle a conversation only when workspace AI Agents are enabled and an Active Agent is explicitly assigned.

### Provider / zero-cost rule

Initial transport uses Vercel AI Gateway's OpenAI-compatible REST interface, behind Web Growth's own provider service. Authentication stays server-only and may use `AI_GATEWAY_API_KEY` or Vercel OIDC.

Stage 10 fails closed:
- migration defaults AI disabled
- migration defaults autonomous Agents disabled
- local monthly AI budget defaults to `$0`
- real model calls require an explicit non-zero budget plus provider authentication
- daily request and monthly tracked-spend gates are enforced

Deploying Stage 10 therefore must not start model spending by itself.

### Knowledge

Business knowledge uses Postgres full-text retrieval first, not paid embeddings. Manual sources are chunked, indexed with tsvector/GIN and searched server-side.

Knowledge modes:
- KNOWLEDGE_ONLY (default)
- KNOWLEDGE_PLUS_GENERAL

Customer/CRM/knowledge text is treated as untrusted prompt data.

### AI Agent controls

Agent definitions include name, role, instructions, tone, knowledge mode/sources, allow-listed actions, max turns, fallback, model override and Draft/Active/Paused status.

Sandbox tests an Agent without touching a real customer/CRM record.

Conversation state adds explicit HUMAN/AI handling, assigned AI Agent, turn counter and last handoff time. Human takeover immediately restores HUMAN handling.

### AI actions

The model never executes SQL or arbitrary endpoints. It returns a strict JSON proposal; trusted server code filters it through the global action allowlist and the Agent-specific allowlist before execution.

Supported Agent actions:
- add/remove tag
- change CRM stage
- update supported contact/custom field
- add internal note
- assign conversation
- send a published WhatsApp Flow
- close conversation
- request human takeover

Every AI action is audited.

### Stage 6 interoperability

Stage 10 reuses existing Stage 6 Add Tag actions as one-shot AI control signals instead of destabilizing the proven automation action language:

- `AI_AGENT:<agent-slug>` assigns the matching Active AI Agent for subsequent customer turns.
- `AI_SUMMARY` requests a private AI handoff summary.

Control tags are consumed after routing/attempt. A Stage 6 workflow owns the inbound turn that created the routing tag; AI begins on the next customer turn, preventing duplicate replies.

### AI analytics

The Stage 10 Usage view tracks requests, successful/failed runs, handoffs, input/output tokens, estimated cost and run mix by AI feature.

### Stage 10 persistence

Migration:
`supabase/migrations/20260902233000_whatsapp_stage10_ai_layer.sql`

Tables:
- `whatsapp_ai_settings`
- `whatsapp_ai_knowledge_sources`
- `whatsapp_ai_knowledge_chunks`
- `whatsapp_ai_agents`
- `whatsapp_ai_runs`
- `whatsapp_ai_actions`
- `whatsapp_ai_usage`

Additive conversation columns:
- `ai_handling_mode`
- `ai_agent_id`
- `ai_turn_count`
- `ai_last_handoff_at`

AI tables use RLS with no browser policies. Provider secrets remain environment-only.

### Stage 10 remaining gate

Before production promotion:
1. create the complete branch commit
2. full WhatsApp tests
3. production compile/type validation
4. fix/revalidate any branch failure
5. apply the additive migration to Supabase
6. run Supabase advisors/schema checks
7. update checkpoint with validation evidence
8. promote the finished branch to `main` once
9. verify production deployment/runtime

Real paid/credit-backed model output testing is deliberately separate and must not be silently enabled during deployment.

## Stage 11 — Multi-Business / SaaS

**Status: 100% COMPLETE / PRODUCTION VERIFIED 2026-09-03.**

Stage 11 converts the WhatsApp console from a single-business deployment into a tenant-safe SaaS foundation while preserving the existing Web Growth workspace and official Meta Cloud API connection.

Production merge:
- PR #2: `Stage 11: multi-business SaaS tenancy`
- production commit: `eaf6714d65a99394cee6e0e212f5923565ec8a12`
- source branch final validated commit: `60093a4917c0cdff0930213187d7af768cc5b033`

Production deployment:
- Vercel deployment: `dpl_44NVeXHKnGnKeF8YTsntE6s3CWcU`
- state: READY
- aliases: `webgrowth.info`, `www.webgrowth.info`
- alias error: none

Implemented:
- real `whatsapp_workspaces` tenant registry
- platform identities separated from per-workspace team memberships
- active-workspace cookie/context and workspace switcher
- platform-admin workspace management at `/admin/whatsapp/workspaces/`
- central workspace scoping for ordinary server-side WhatsApp reads and writes
- webhook/background routing by workspace/Meta connection instead of a single global sender
- per-workspace Meta connection metadata with Web Growth's existing ENV credentials preserved
- workspace-scoped settings, push state, calls, CRM, conversations/messages, templates, automations, campaigns, Flows and AI persistence
- workspace-specific uniqueness for contacts/team/settings/calls/push state
- composite tenant foreign keys preventing cross-workspace parent/child links
- database-enforced team, automation, campaign-recipient and AI daily limits
- INTERNAL Web Growth entitlements seeded without enabling paid infrastructure
- tenant-aware inbox-state view and covering indexes for Stage 11 composite foreign keys
- SECURITY DEFINER trigger function locked away from anonymous/authenticated RPC execution

Production data/backfill proof:
- 156 messages preserved
- 7 contacts preserved
- 6 conversations preserved
- 3 team memberships preserved and linked to platform identities
- 14 automations and 12 automation runs preserved
- 1 Flow and 1 Flow submission preserved
- 3 calls preserved
- zero checked tenant rows with `workspace_id IS NULL`
- zero checked pre-existing rows assigned outside the Web Growth workspace
- inbox-state view: 6 rows, zero null workspace, zero non-Web-Growth rows

Web Growth workspace after migration:
- slug: `web-growth`
- status: ACTIVE
- plan: INTERNAL
- platform-owned: true
- Meta connection: CONNECTED
- credential source: ENV
- WABA ID: `987693860957754`
- Phone Number ID: `1192139290658384`
- Graph API: v26.0

Validation/gates passed:
- final GitHub Stage 11 CI: 195 passed / 0 failed
- final preview Vercel build: READY
- production Vercel build: 195 passed / 0 failed
- sitemap validation passed
- optimized Next.js production compile passed
- TypeScript/lint validity passed; only pre-existing nonblocking warnings remain
- all six primary Stage 11 production migrations applied in order
- post-migration backfill/isolation checks passed
- Supabase security advisor rerun: no Stage 11 WARN findings after privilege hardening
- Supabase performance advisor rerun: Stage 11 composite-FK missing-index findings fixed; remaining notices are INFO-only legacy/unused-index advisories
- unauthenticated `/api/admin/whatsapp/workspaces/` returns HTTP 401 `Authentication required.`
- unauthenticated `/admin/whatsapp/workspaces/` resolves to the protected workspace login flow
- `/admin/whatsapp/` returns HTTP 200 with the private workspace login UI
- production runtime error scan after deployment: no runtime error clusters
- production deployment 5xx scan: none

Stage 11 is therefore closed at 100%. Do not rebuild it during Stage 12; Stage 12 should preserve these tenant boundaries and focus on application experience/UI architecture.

## Stage 12 — App Experience Redesign

Dedicated final product-experience overhaul before commercial onboarding and launch. Goal: make the workspace feel like a cohesive SaaS application rather than a collection of website/admin pages.

Scope includes:
- persistent desktop app sidebar and deliberate mobile navigation
- reduced website-like headings/whitespace/cards
- denser task-oriented layouts
- consistent top bars, contextual controls, tables, filters, tabs, drawers, modals, toasts and confirmation states
- split-pane/resizable workspaces where useful
- desktop/tablet/mobile application behavior
- keyboard/focus/accessibility pass
- preserve all APIs, permissions and feature behavior
- final visual/regression smoke test across all modules

## Applied / planned WhatsApp migrations

Applied before Stage 10:
- `202609010001_whatsapp_contact_crm_stage3.sql`
- `202609010002_whatsapp_saved_replies_stage4.sql`
- `202609010003_whatsapp_saved_reply_media_stage4.sql`
- `202609020001_whatsapp_template_manager_stage5.sql`
- Stage 6 automation foundation/questions migrations
- Stage 7 campaigns migrations
- Stage 8 Flows migrations
- `20260902223000_whatsapp_stage9_analytics_indexes.sql`

Stage 10 pending validation/application:
- `20260902233000_whatsapp_stage10_ai_layer.sql`

Stage 11 source migration package on `main`:
- `20260902234450_whatsapp_stage11_inbox_view_preflight.sql` — fresh-install safeguard; production itself had already crossed this point
- `20260902234500_whatsapp_stage11_multi_workspace.sql`
- `20260902234600_whatsapp_stage11_settings_multirow.sql`
- `20260902234700_whatsapp_stage11_tenant_hardening.sql`
- `20260902234800_whatsapp_stage11_push_isolation.sql`
- `20260902234900_whatsapp_stage11_entitlement_enforcement.sql`
- `20260902235000_whatsapp_stage11_connection_states.sql`
- `20260903030633_whatsapp_stage11_inbox_view_workspace.sql`
- `20260903030722_whatsapp_stage11_trigger_function_privileges.sql`
- `20260903030758_whatsapp_stage11_composite_fk_indexes.sql`

Stage 11 production migration registry contains the six primary migrations plus the three validation-driven hardening migrations. The preflight source migration exists so a fresh database can reproduce the same final schema safely.

## Platform facts / safety

- Meta Graph API: v26.0
- Phone Number ID: `1192139290658384`
- WABA ID: `987693860957754`
- Main webhook: `https://webgrowth.info/api/whatsapp/webhook/`
- WhatsApp persistence: Supabase/PostgREST with service-role access server-side
- Meta and AI provider secrets remain environment-only
- TikTok scheduler is a separate project boundary
- Current cost rule: free-tier/zero-cost infrastructure until revenue
