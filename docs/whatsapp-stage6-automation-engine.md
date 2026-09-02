# WhatsApp Stage 6 — Automation Engine

Status: **OPEN — conversational workflows + conversation-session bonus implemented; Owner production retest pending**

Stage 5 is complete and production verified. Stage 6 remains the current roadmap stage and Stage 7 stays locked until the complete Owner production gate passes.

## Implemented workflow platform

### Visual builder
- `/admin/whatsapp/automations/`
- Respond.io-inspired dotted workflow canvas
- Trigger → Conditions → Actions flow
- Yes/No branches, including valid empty paths while building
- zoom controls and 100-step ceiling
- right-side properties inspector
- Draft / Active / Paused lifecycle
- Active workflows read-only until paused and do not expose Delete
- create, edit, duplicate, activate, pause and delete
- persisted workflow versions

### Conversational questions
- `Ask a question` is a first-class workflow step
- WhatsApp reply buttons for 2–3 choices
- WhatsApp choice lists for 2–10 choices
- question step pauses the run in `WAITING` / `WAITING_INPUT`
- inbound Meta `button_reply` and `list_reply` messages resume the exact waiting run
- selected title becomes `{{answer}}`
- selected option ID becomes `{{answer_id}}`
- optional automatic answer storage to a built-in contact field or `custom.<field>`
- Branch conditions can use the `answer` field immediately after a question
- questions can be chained
- Run History describes input waits as `Waiting for customer choice`
- cancelling a WAITING run cancels its `WAITING_INPUT` job
- interactive questions obey Meta's 24-hour customer-service window

### Bonus: conversation-session lifecycle

This is part of Stage 6 but is explicitly a bonus enhancement, not a new stage.

- new automation trigger: `CONVERSATION_OPENED`
- first-ever customer message opens the initial conversation session and emits Conversation Opened once
- customer message to a CLOSED conversation automatically changes it to OPEN and emits Conversation Opened once
- additional messages while already OPEN do not emit Conversation Opened again
- Conversations header exposes `Open chat` / `Close chat`
- Owner/Manager can operate any accessible conversation; Agents can operate conversations they are allowed to access
- manual CLOSED → OPEN emits Conversation Opened once with `origin=MANUAL`
- every inbound/outbound message updates existing `last_message_at`, resetting inactivity
- existing one-minute Stage 6 processor closes OPEN conversations after 4 hours without either-side message activity
- closing a conversation cancels its QUEUED/RUNNING/WAITING workflow runs and PENDING/PROCESSING/WAITING_INPUT jobs
- this prevents old interactive buttons or delayed actions from resurrecting a closed session
- generic NEW_MESSAGE remains supported for specialized automations, but the production Web Growth master intake should use CONVERSATION_OPENED
- no new database migration is required for this bonus

### Triggers
- Conversation opened
- New incoming message
- Keyword / phrase
- New contact
- Tag added
- CRM stage changed
- Conversation assigned
- Missed inbound WhatsApp call
- No customer reply
- No agent reply
- Business-hours opened / closed
- inbound automation webhook

### Conditions
- AND / OR entry conditions
- answer from latest workflow question
- message text/type
- contact tags, CRM stage, phone, email, company, consent
- conversation assignment/status
- business-hours state
- `contact.custom.<field>`
- `trigger.payload.<path>`
- EQUALS / NOT_EQUALS / CONTAINS / NOT_CONTAINS / STARTS_WITH / GREATER_THAN / LESS_THAN / EXISTS / NOT_EXISTS

### Actions
- Send text
- Ask a question
- Send approved Meta template
- Send Team Saved Reply, including saved media
- Assign conversation
- Add/remove tags
- Change CRM stage
- Update built-in/custom contact field
- Add internal note
- durable delay
- HTTPS webhook
- Branch
- Stop workflow

### Runtime / safety
- persistent runs/jobs/events
- source-event dedupe
- direct/self and ancestry/depth loop protection
- service-window enforcement
- delayed-job retries/backoff
- one-minute Supabase `pg_cron` + `pg_net` processor for timed work and conversation inactivity closing
- run history, step events, exact errors and cancellation
- automation activity written to existing contact timeline

## Migrations

Base Stage 6 runtime migration:
`supabase/migrations/202609020002_whatsapp_automation_foundation_stage6.sql`

Conversational-question migration:
`supabase/migrations/202609020003_whatsapp_automation_questions_stage6.sql`

The conversation-session bonus uses the existing `whatsapp_conversations.status` and `last_message_at` columns and needs **no additional SQL migration**.

## Latest Owner verification retained as passing

Previous Owner runs confirmed workflow persistence/search/filtering, CRUD, duplicate-name rejection, versioning, Draft → Active → Paused, active read-only/no Delete, visual canvas/zoom/step counts, real New Message execution, Send Text inside the service window, base Run History rendering, mobile/desktop list/history layout, and Stages 1–5 smoke regression.

Stage 6 remains OPEN because the conversational runtime, remaining trigger/action cases and the new conversation-session bonus still require Owner production verification.

## Final Owner production gate additions for conversation sessions

In addition to the existing Stage 6 test list, verify:
1. `Conversation opened` appears in the workflow trigger selector and persists after save/refresh.
2. Close an existing conversation manually; status changes to CLOSED and any waiting run for that conversation is cancelled.
3. Manually Open chat; status changes to OPEN and exactly one CONVERSATION_OPENED workflow run is created.
4. Sending additional customer messages while OPEN does not create additional Conversation Opened runs.
5. Close the chat, then send a real customer message; it automatically reopens and creates exactly one Conversation Opened run.
6. A brand-new contact's first inbound message creates the initial open conversation and fires Conversation Opened once.
7. Inbound and outbound messages update activity so an actively used conversation is not auto-closed.
8. An OPEN conversation with no inbound/outbound message for 4 hours is automatically changed to CLOSED by the one-minute processor.
9. A cancelled WAITING_INPUT question cannot resume after its conversation has been closed.
10. A manually reopened conversation outside Meta's 24-hour window still respects Meta service-window rules; free-form/Ask Question must fail safely or use an approved template.
11. Old ACTIVE master/test workflows using NEW_MESSAGE are paused before the production CONVERSATION_OPENED master is activated, preventing double intake.

Manager and Agent permission-role verification remains deferred by the Owner-only testing rule; their eventual ability to use Open/Close is implemented but does not block Stage 6 now.
