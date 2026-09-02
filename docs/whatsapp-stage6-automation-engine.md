# WhatsApp Stage 6 — Automation Engine

Status: **OPEN — conversational workflow upgrade implemented; migration + Owner production retest pending**

Stage 5 is complete and production verified. Stage 6 remains the current roadmap stage and Stage 7 stays locked until the complete Owner production gate passes.

## Implemented workflow platform

### Visual builder
- `/admin/whatsapp/automations/`
- Respond.io-inspired dotted workflow canvas
- Trigger → Conditions → Actions flow
- Yes/No branches, including valid empty paths while a workflow is still being built
- zoom controls and 100-step ceiling
- right-side properties inspector
- Draft / Active / Paused lifecycle
- Active workflows are read-only until paused and do not expose Delete
- create, edit, duplicate, activate, pause and delete
- persisted workflow versions

### Conversational questions
- `Ask a question` is a first-class workflow step
- WhatsApp reply buttons for 2–3 choices
- WhatsApp choice lists for 2–10 choices
- question step pauses the run in `WAITING` / `WAITING_INPUT`
- inbound Meta `button_reply` and `list_reply` messages are parsed and used to resume the waiting run
- selected title becomes `{{answer}}`
- selected option ID becomes `{{answer_id}}`
- optional automatic answer storage to a built-in contact field or `custom.<field>`
- Branch conditions can use the `answer` field immediately after a question
- questions can be chained because resumption continues the remaining workflow plan
- Run History describes input waits as `Waiting for customer choice`
- cancelling a WAITING run also cancels its `WAITING_INPUT` job
- interactive questions obey Meta's 24-hour customer-service window

### Triggers
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
- answer from the latest workflow question
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
- one-minute Supabase `pg_cron` + `pg_net` processor for timed work
- run history, step events, exact errors and cancellation
- automation activity written to the existing contact timeline

## Migrations

Base Stage 6 runtime migration:
`supabase/migrations/202609020002_whatsapp_automation_foundation_stage6.sql`

Conversational-question migration:
`supabase/migrations/202609020003_whatsapp_automation_questions_stage6.sql`

Apply migrations manually in **Supabase SQL Editor only**. Never use `supabase db push`, never apply WhatsApp migrations to Neon/DATABASE_URL, and never touch TikTok migrations.

## Latest Owner verification retained as passing

The previous Owner run confirmed workflow persistence/search/filtering, CRUD, duplicate-name rejection, versioning, Draft → Active → Paused, visual canvas/zoom/step counts, real New Message execution, Send Text inside the service window, base Run History rendering, mobile/desktop list/history layout, and Stages 1–5 smoke regression.

Those passes remain useful evidence; Stage 6 is nevertheless OPEN because the conversational upgrade and remaining unverified trigger/action/runtime cases still require production verification.

## Final Owner production gate

1. Workflow search/status filtering works against persisted workflows.
2. Owner can create/edit/duplicate/delete Draft/Paused workflows.
3. Duplicate names are rejected.
4. Refresh persistence and version increments work.
5. Draft → Active → Paused persists.
6. Active workflow is read-only and Delete is absent until paused.
7. Canvas/connectors/zoom/100-step counter work.
8. Yes/No branch can be saved with empty paths, then populated and persisted.
9. Ask Question with 2–3 reply buttons persists and sends real WhatsApp buttons.
10. Selecting a reply button resumes the exact waiting workflow and records the answer.
11. `{{answer}}` and `{{answer_id}}` resolve after selection.
12. Optional question answer storage persists to `custom.<field>` or a supported built-in field.
13. Branch on `answer` executes the correct Yes/No path.
14. Ask Question List mode persists and sends 2–10 selectable list rows.
15. Selecting a list row resumes the workflow.
16. Two question steps can run sequentially in one workflow.
17. Question waits appear in Run History as waiting for customer choice and Inspect records question sent/answered events.
18. Cancelling a question WAITING run prevents later resumption.
19. New-message trigger runs once for a real inbound message.
20. Keyword trigger runs only on matching text.
21. New-contact trigger works.
22. Tag-added trigger works.
23. CRM-stage-changed trigger works.
24. Conversation-assigned trigger works.
25. Missed-call trigger works when an unanswered inbound WhatsApp call is available; N/A is acceptable when no such live call can be produced.
26. No-customer-reply trigger works.
27. No-agent-reply trigger works.
28. Business-hours Opened/Closed follows Settings.
29. Inbound webhook correct key runs; unknown key does not.
30. AND/OR conditions work.
31. Custom CRM-field and webhook-payload conditions work.
32. Send Text works inside the service window.
33. Send Text is blocked outside the service window.
34. Approved-template action sends.
35. Team Saved Reply text/media actions send.
36. Assignment action assigns to an Online member.
37. Add/remove tag actions persist.
38. CRM-stage action persists.
39. Built-in/custom contact-field updates persist.
40. Internal-note action appears in timeline.
41. Delay produces WAITING and resumes after due time across refresh.
42. HTTPS webhook success/error results are visible in history.
43. Stop prevents later actions.
44. Replayed source event does not duplicate runs/messages.
45. Automation-created tag/stage/assignment changes do not loop.
46. Run History/Inspect show statuses, waits, steps and exact failures; waiting runs can be cancelled.
47. Automation start/completion/failure appears in contact timeline.
48. Builder/list/history remain usable on mobile and desktop without page-level horizontal overflow.
49. Stages 1–5 regression smoke check passes.

Manager and Agent role testing remains deliberately deferred by the Owner-only testing rule and does not block Stage 6 completion.
