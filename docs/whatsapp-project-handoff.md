# WhatsApp BSP for WebGrowth — Project Handoff

Last updated: 2026-09-02

## Standing execution rules

1. Discuss each roadmap stage before implementation unless the user explicitly says proceed.
2. Stage rule: build → production test → fix failures → retest → mark 100% → unlock next stage.
3. Stage 6 was implemented across 6A–6E before its first combined Owner test; subsequent failures/scope gaps are fixed by ChatGPT and retested without advancing Stage 7.
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
6. Automation Engine — CURRENT / OPEN
7. Campaigns & Broadcasts — LOCKED
8. WhatsApp Flows — LOCKED
9. Advanced Analytics — LOCKED
10. AI Layer — LOCKED; zero-cost until revenue
11. Multi-Business / SaaS — LOCKED
12. Client Onboarding & Commercial Launch — LOCKED

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

Previous live Owner tests confirmed:
- workflow persistence, search/status filtering
- create/edit/duplicate/delete Draft/Paused workflows
- duplicate-name rejection
- refresh persistence + versioning
- Draft → Active → Paused
- active workflow read-only/no Delete
- visual canvas/zoom/step counts
- real NEW_MESSAGE execution exactly once
- real Send Text inside service window
- Run History base rendering
- mobile/desktop list/history usability
- Stages 1–5 regression smoke

Stage 6 remains OPEN because conversational runtime cases, remaining trigger/action cases and this bonus conversation-session lifecycle still require Owner production verification.

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
