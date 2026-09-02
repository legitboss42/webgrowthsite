# WhatsApp Stage 6 — Automation Engine

Status: **FULL CODE READY; FINAL MIGRATION + COMBINED OWNER PRODUCTION GATE PENDING**

Stage 5 is complete and production verified. Per project rule, Stage 6A–6E are implemented as one stage and are tested together once.

## Implemented

### Visual workflow builder
- `/admin/whatsapp/automations/`
- Respond.io-inspired dotted workflow canvas
- connected Trigger → Conditions → Actions view
- Yes/No branch paths
- zoom controls and 100 total workflow-step ceiling
- right-side properties inspector
- Draft / Active / Paused states
- active workflows are read-only until paused
- create, edit, duplicate, activate, pause and delete
- persisted workflow versions
- Team Saved Reply, approved template and team-member selectors

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
- Public inbound automation webhook using an unguessable workflow key

### Conditions / branches
- AND / OR entry conditions
- message text/type
- contact tags, CRM stage, phone, email, company, consent
- conversation assignment/status
- business-hours state
- `contact.custom.<field>` values
- `trigger.payload.<path>` values
- EQUALS / NOT_EQUALS / CONTAINS / NOT_CONTAINS / STARTS_WITH / GREATER_THAN / LESS_THAN / EXISTS / NOT_EXISTS
- nested Yes/No branch actions

### Actions
- Send free-form WhatsApp text inside the 24-hour service window
- Send an approved Meta template by name/language
- Send a Team Saved Reply, including its saved image/video/document/audio attachment
- Assign conversation to an Online team member
- Add/remove tags
- Change CRM stage
- Update built-in or `custom.<field>` contact values
- Add internal note
- Persisted delay in minutes/hours/days
- POST workflow context to an external HTTPS webhook
- Branch
- Stop workflow

### Runtime / safety
- Meta webhook dispatch for New Message / Keyword / New Contact
- missed-call dispatch from the Calling webhook
- CRM contact route dispatch for manual New Contact / Tag Added / CRM Stage Changed
- assignment route dispatch for Conversation Assigned
- one-minute Supabase `pg_cron` + `pg_net` processor for delayed jobs, no-reply triggers and business-hours transitions
- persistent run/job/event records
- unique automation + source-event dedupe
- direct tag/stage self-loop validation
- cross-workflow ancestry/depth protection
- free-form and Saved Reply sends obey Meta's 24-hour service window
- failed actions persist exact operator-facing errors
- delayed jobs retry up to five times with backoff

### History / observability
- Queued / Running / Waiting / Succeeded / Failed / Skipped / Cancelled runs
- step events and branch results
- waiting-job due time and errors
- run inspection endpoint
- waiting-run cancellation
- automation start/completion/failure entries in the existing contact timeline

## Migration

`supabase/migrations/202609020002_whatsapp_automation_foundation_stage6.sql`

The filename is retained from the original Stage 6A foundation, but it now contains the complete idempotent Stage 6 schema and one-minute processor schedule. Re-running it is safe if the earlier 6A portion was already applied.

Apply manually in **Supabase SQL Editor only**. Never use `supabase db push`, never apply it to Neon/DATABASE_URL, and never touch TikTok migrations.

## Combined Owner production gate

1. Automations page loads and workflow search/status filtering works.
2. Owner creates, edits, duplicates and deletes Draft/Paused workflows.
3. Duplicate workflow names are rejected.
4. Workflow survives refresh and version increments after edits.
5. Draft → Active → Paused persists.
6. Active workflow is view-only and cannot be edited/deleted until paused.
7. Dotted canvas, connectors, zoom and 100-step counter work.
8. Yes/No branch can be built and both paths persist.
9. New-message trigger runs once for a real inbound message.
10. Keyword trigger runs only on matching text.
11. New-contact trigger runs for a newly created contact.
12. Tag-added trigger runs after a new tag is added.
13. CRM-stage-changed trigger runs after a real pipeline change.
14. Conversation-assigned trigger runs after assignment.
15. Missed-call trigger runs for an unanswered inbound WhatsApp call.
16. No-customer-reply trigger runs after its configured period.
17. No-agent-reply trigger runs after its configured period.
18. Business-hours Opened/Closed follows WhatsApp Settings.
19. Inbound workflow webhook runs for the correct key and an unknown key does not trigger a workflow.
20. AND entry conditions require every rule; OR allows any matching rule.
21. Custom CRM-field and webhook-payload conditions work.
22. Yes branch executes when its condition passes.
23. No branch executes when its condition fails.
24. Send Text works inside the service window.
25. Send Text is blocked outside the service window rather than violating Meta policy.
26. Approved template action sends successfully.
27. Team Saved Reply action sends; a Saved Reply with media sends its attachment.
28. Assignment action assigns to an Online member.
29. Add/remove tag actions persist correctly.
30. CRM-stage action moves the contact correctly.
31. Built-in/custom contact-field action persists.
32. Internal-note action appears in the conversation/contact timeline.
33. Delay creates a Waiting run and resumes after its due time after page refresh.
34. External HTTPS webhook action works and HTTP/error failures are visible in history.
35. Stop prevents later actions from running.
36. Replayed Meta/source event does not create duplicate runs/messages.
37. Automation-created tag/stage/assignment changes do not loop infinitely.
38. Run History shows status, trigger, waiting time and exact failure text; Inspect shows step events.
39. Waiting run can be cancelled and does not resume.
40. Automation start/completion/failure appears in the contact timeline.
41. Builder/list/history are usable on mobile and desktop without page-level horizontal overflow.
42. Stages 1–5 regression smoke check passes.

Manager and Agent role testing remains deliberately deferred by the Owner-only testing rule and does not block Stage 6 completion.
