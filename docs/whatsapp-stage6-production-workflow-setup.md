# WhatsApp Stage 6 — Web Growth production workflow setup

Last updated: 2026-09-02

Status: **OPEN — production workflows are substantially configured and core journeys are passing, but handoff logic and remaining lifecycle/no-reply tests still block Stage 6 completion.**

## Current production workflow state

Supabase production verification confirms the 12 Web Growth workflows exist.

ACTIVE v3:

1. `WG — MASTER INTAKE ROUTER`
2. `WG — BUSINESS WEBSITE`
3. `WG — WEBSITE REDESIGN`
4. `WG — LANDING PAGE`
5. `WG — ECOMMERCE`
6. `WG — SEO & GROWTH`
7. `WG — MAINTENANCE & SUPPORT`
8. `WG — AUTOMATION & CRM`
9. `WG — PRICING & PACKAGES`
10. `WG — EXISTING CLIENT`
11. `WG — GENERAL ENQUIRY`

DRAFT v2:

12. `WG — NO REPLY FOLLOW-UP`

The Master uses `CONVERSATION_OPENED` (`Update lifecycle · Open chat`), not generic `NEW_MESSAGE`. Service workflows use `TAG_ADDED`; no-reply follow-up uses `NO_CUSTOMER_REPLY`.

## Master router

Production `WG — MASTER INTAKE ROUTER` is ACTIVE v3 and routes all ten saved list choices using stable `trigger.payload.answerId` values:

- `website` → `WG_ROUTE_WEBSITE`
- `redesign` → `WG_ROUTE_REDESIGN`
- `landing` → `WG_ROUTE_LANDING`
- `ecommerce` → `WG_ROUTE_ECOMMERCE`
- `seo` → `WG_ROUTE_SEO`
- `maintenance` → `WG_ROUTE_MAINTENANCE`
- `automation` → `WG_ROUTE_AUTOMATION`
- `pricing` → `WG_ROUTE_PRICING`
- `support` → `WG_ROUTE_SUPPORT`
- `other` → `WG_ROUTE_OTHER`

The deep nested branch structure is valid beyond the original depth-5 failure point.

## Production journey verification completed

Verified from production automation runs and persisted CRM data:

- Business Website journey: PASS.
- Website Redesign journey: PASS.
- Ask Question continuation: PASS across chained Website and Redesign questions.
- Messages while an existing conversation is OPEN do not restart Master: PASS.
- CLOSED conversation receiving a real inbound customer message automatically reopens and starts Master exactly once: PASS.
- CRM persistence: PASS for tested Website/Redesign flows.
- Internal notes persisted for Website and Redesign.

Test contact `Victorious` is persisted as `QUALIFIED` with `Interest: Website Design`, `Interest: Website Redesign`, and `WG_LEAD`, plus the tested website/redesign custom fields.

## Current live Automation test

Production run `de81d345-0f04-4883-a3d5-dabb65979414` is currently `WAITING` on `WG — MASTER INTAKE ROUTER` v3 after a CLOSED conversation auto-reopened from inbound text `I need automation 1788377572724`.

The run is waiting at the Master Ask Question action and the production payload contains the correct 10-choice LIST. Browser automation was unable to reliably select the latest WhatsApp Web `Choose` control. This is a test-interaction limitation, not a runtime/database failure.

## Configuration gaps found during independent Supabase verification

The workflows are not yet functionally complete even though their basic qualification questions are saved.

### 1. Final quote / portfolio / human choices are not routed

Every downstream service workflow asks:

- `Request quotation`
- `See portfolio`
- `Talk to a person`

but then continues to the same generic `SEND_TEXT`. There are no downstream Branch actions implementing the selected next step.

Required correction:

- `request_quote` → preserve/confirm `QUALIFIED`, add a meaningful quote-request internal note, acknowledge the quote request, then stop unnecessary questioning.
- `portfolio` → send the approved Web Growth portfolio URL and finish cleanly.
- `human` → add `HUMAN_REQUESTED`, add a useful handoff internal note, acknowledge human handoff, then stop unnecessary questioning.

Do not treat the generic final acknowledgement as proof these handoff paths work.

### 2. CRM-stage inconsistencies

- `WG — ECOMMERCE` has no `UPDATE_CRM_STAGE` action despite completing a full qualification sequence.
- `WG — BUSINESS WEBSITE` changes CRM stage to `QUALIFIED` immediately after only the first website-type answer. Move qualification until enough project information has been collected.
- `WG — EXISTING CLIENT` adds `WG_LEAD` and changes the contact to `QUALIFIED`. Existing-client support should not be forced through a new-sales qualification stage.

Supported stages remain: `NEW`, `QUALIFIED`, `FOLLOW_UP`, `CUSTOMER`, `REPEAT_CUSTOMER`, `LOST`.

### 3. Missing internal summaries

- `WG — AUTOMATION & CRM` has no `ADD_INTERNAL_NOTE` summary after qualification.
- `WG — GENERAL ENQUIRY` has no internal note capturing the enquiry/handoff context.

### 4. Urgent-support handling is not implemented

`WG — MAINTENANCE & SUPPORT` and `WG — EXISTING CLIENT` collect urgency, but no Branch uses the urgent answer to add `HUMAN_REQUESTED`, create an urgent internal note, or acknowledge escalation.

### 5. Pricing workflow does not route into selected service qualification

`WG — PRICING & PACKAGES` collects `custom.pricing_service`, asks whether the user wants to continue, then later asks another `custom.next_step` question. It does not route to the selected `WG_ROUTE_*` service workflow and currently duplicates next-step collection.

Correct it so pricing can route safely to the selected service qualification without duplicating the service questions.

## Remaining production tests

Still required before Stage 6 can be marked complete:

1. Finish the Automation / CRM customer journey from the currently waiting Master question.
2. Verify Automation custom fields, `WG_LEAD`, `QUALIFIED`, internal note, and final quote/portfolio/human branches after the missing config is corrected.
3. Manual Open from CLOSED creates exactly one `CONVERSATION_OPENED` run.
4. Close during WAITING cancels the run and `WAITING_INPUT` job; old interactive controls cannot resurrect it.
5. Complete No Reply follow-up test, verify only one follow-up and `WG_FOLLOWUP_SENT` repeat protection, then activate it only if the production test passes.
6. Verify the 4-hour inactivity close through the scheduled processor when practical; do not manipulate production timestamps solely to force the test.

## Builder/model fixes retained on main

- `c26355fd5903916d0dbd4512239fad079b9ec5e8` — nested branch additions immediately select the exact child and expose the selected path.
- `b252cd162df855a8949226f2fcd81c8dfcc56d02` — supported branch depth raised to 12 and `trigger.payload.answerId` added to condition suggestions.
- `802460d00ab23225ccb1864969e42efc9fe3f058` — regression test for a 10-choice Master router using stable option IDs.
- `36d7f083afd5e41c878f0ff98def56ca70a8a817` — deep routing regression included in the WhatsApp test command.

## Documentation note

Both Stage 6 checkpoint documents exist on GitHub `main`:

- `docs/whatsapp-stage6-production-workflow-setup.md`
- `docs/whatsapp-stage6-automation-engine.md`

A local Codex checkout that reports these paths missing is stale or not reading the current `main`; do not recreate duplicate documentation elsewhere.

## Completion rule

Do not mark Stage 6 complete until the missing handoff/CRM/urgent/pricing configuration above is corrected and the remaining production tests pass.
