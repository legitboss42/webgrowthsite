# WhatsApp Stage 6 — Automation Engine

Status: **6A CODE READY; MIGRATION + OWNER PRODUCTION GATE PENDING**

Stage 5 is complete and production verified. Stage 6 is now the current roadmap stage.

## Stage 6 slices

- **6A — Builder + durable foundation**: workflow definitions, Draft/Active/Paused state, validation, CRUD, duplicate/edit/delete, run/job/event persistence schema.
- **6B — Triggers + conditions**: wire incoming message, keyword, contact, tag, stage, assignment, missed-call, no-reply, business-hours and inbound-webhook trigger evaluation.
- **6C — Actions**: text/template/Saved Reply sends, assignment, tags, CRM stage/field, internal note and external webhook actions.
- **6D — Delay/execution engine**: persisted delayed jobs, retries, service-window behavior, dedupe and loop protection at runtime.
- **6E — History + safety**: run history, waiting jobs, cancellation, contact timeline records, failure visibility and final Stage 6 gate.

## 6A implemented

- `/admin/whatsapp/automations/` page and Growth navigation item
- Owner/Manager server authorization; current live testing remains Owner-only by project rule
- persistent `whatsapp_automations` definitions
- workflow name/description/status/version
- trigger type + trigger configuration
- optional conditions with AND/OR logic
- ordered action definitions
- Draft / Active / Paused persistence
- create / edit / duplicate / pause / activate / delete controls
- active workflow must be paused before deletion
- validation for required trigger/action configuration
- direct configuration-loop checks for tag and CRM-stage self-loops
- STOP action must be last
- delay validation
- webhook URL validation
- durable foundation tables for runs, delayed jobs and events
- duplicate trigger-event unique index prepared for runtime idempotency
- build test coverage added through `automationModel.test.ts`

## Deliberate 6A boundary

An automation marked `ACTIVE` is stored as Active, but **does not execute yet**. Runtime trigger wiring starts in 6B. The UI states this explicitly so Stage 6A does not pretend configuration is already execution.

## Migration

`supabase/migrations/202609020002_whatsapp_automation_foundation_stage6.sql`

Apply manually in Supabase SQL Editor. Never use `supabase db push` and never run this against Neon/DATABASE_URL.

## 6A Owner production gate

1. Automations appears as a live Growth navigation item and the page loads for Owner.
2. Without the migration, the page shows a clear storage/migration warning instead of crashing.
3. After migration, Owner can create a Draft automation and it appears in the list.
4. Saved automation survives page refresh.
5. Owner can edit it and the persisted version number increases.
6. Duplicate opens a separate Draft copy and it can be saved under a unique name.
7. A duplicate automation name is rejected safely.
8. Trigger-specific validation works, including required Keyword configuration.
9. Conditions persist, including AND/OR join choice and EXISTS/NOT_EXISTS behavior.
10. Multiple ordered actions persist and reload correctly.
11. Delay action persists its amount/unit and invalid delays are rejected.
12. Direct tag/CRM-stage self-loop definitions are rejected and STOP must remain the last action.
13. Draft → Active → Paused state persists; Active cannot be deleted until paused.
14. Mobile/desktop remain usable and Stages 1–5 smoke regression shows no blocker.

6A is complete only after all directly-testable Owner items above pass. Trigger execution is not part of this gate because it belongs to 6B–6D.

## Full Stage 6 final gate

The final Stage 6 gate remains broader: trigger execution, conditions, actions, delays, business hours, no-reply logic, webhook actions, duplicate-delivery protection, loop prevention, run history, cancellation, contact timeline activity, mobile/desktop and Stages 1–5 regression. Stage 6 is not marked 100% complete until 6A–6E are implemented and the combined Owner production gate passes.
