# WhatsApp Platform — Stage 3 Contact CRM

This document is the authoritative checkpoint for Stage 3 of the current Web Growth WhatsApp Platform roadmap.

A sub-stage is not complete because code exists. It is complete only after the relevant production test gate passes and known blockers are closed.

## Stage 3 completion standard

Stage 3 is complete only when we physically verify:

- contact creation
- contact editing
- duplicate prevention
- tags
- custom fields
- consent tracking
- Agent / Manager / Owner permissions
- contact timeline
- CSV import and export
- conversation linking
- mobile behaviour
- desktop behaviour
- no Stage 1 regression
- no Stage 2 regression

## 3A — CRM foundation + editable profiles + manual contacts

**Status: COMPLETE.**

Implemented before 3B:

- automatic contact creation from inbound WhatsApp messages
- manual contact creation
- duplicate WhatsApp-number prevention
- editable contact profiles
- name, phone, email, company/business, website and source
- lead temperature
- contact search
- conversation link from the contact directory
- assignment-aware Agent visibility
- Manager/Owner manual-contact creation permission
- contact create/update activity records

Do not reopen 3A unless production testing exposes a regression.

## 3B — tags + custom fields + consent + CRM pipeline

**Status: CODE READY; PRODUCTION GATE BLOCKED ON THE SUPABASE MIGRATION.**

Implemented:

- pipeline stages: `NEW`, `QUALIFIED`, `FOLLOW_UP`, `CUSTOMER`, `REPEAT_CUSTOMER`, `LOST`
- tags, capped and case-insensitively de-duplicated
- flat string custom fields, capped and validated
- consent state: `UNKNOWN`, `OPTED_IN`, `OPTED_OUT`
- last opt-in and last opt-out timestamps retained as history
- pipeline filtering in Contacts
- Stage 3 fields visible on mobile cards and desktop table
- Stage 3 fields editable inside the contact profile
- legacy fallback keeps the original Contacts page usable before migration
- server-side validation for all new CRM fields
- consent timestamp tests included in `npm run test:whatsapp`

### Required migration

Apply this file manually in the Supabase SQL editor:

`supabase/migrations/202609010001_whatsapp_contact_crm_stage3.sql`

**Do not run `supabase db push`.** The repository contains unrelated TikTok/scheduler migrations and the remote migration history is not safe for a blanket push.

### 3B production test gate

After the migration is applied, verify against production:

1. Open `/admin/whatsapp/contacts/` and confirm the Stage 3 migration warning is gone.
2. Open an automatically created WhatsApp contact and confirm the default pipeline stage is **New**.
3. Change the contact through every pipeline stage and confirm each value persists after a full reload.
4. Add several tags, including a duplicate with different casing, save, reload, and confirm duplicates are not retained.
5. Remove tags, save, reload, and confirm the removal persists.
6. Add custom fields such as `Budget=500000`, `Location=Lagos`, save, reload, and confirm exact round-trip persistence.
7. Remove a custom field, save, reload, and confirm it is removed.
8. Change consent from Unknown → Opted in; confirm current state and opt-in timestamp persist.
9. Change consent Opted in → Opted out; confirm current state changes and the old opt-in timestamp is still retained alongside the new opt-out timestamp.
10. Change consent Opted out → Opted in; confirm the previous opt-out timestamp remains retained.
11. Confirm invalid tags/custom-fields/consent/pipeline payloads are rejected rather than partially stored.
12. Confirm pipeline filters return the correct contacts.
13. Confirm the profile remains usable on phone and desktop widths.
14. Confirm an Agent can edit only a contact belonging to their assigned or unassigned accessible conversation.
15. Confirm a Manager and Owner can edit accessible CRM fields and can manually create contacts.
16. Confirm duplicate manual creation of the same WhatsApp number is still rejected.
17. Confirm opening the linked conversation still reaches the correct customer thread.

Only after all 3B checks pass may 3C start.

## 3C — timeline + import/export + final permissions/regression gate

**Status: LOCKED UNTIL 3B PASSES PRODUCTION.**

Planned scope:

- unified contact timeline
- message history in contact context
- call history in contact context
- contact/profile activity history
- CSV import
- CSV export
- final Agent / Manager / Owner permission matrix
- final conversation-link validation
- final mobile and desktop checks
- Stage 1 regression matrix
- Stage 2 regression matrix

Stage 3 is marked 100% only after the complete Stage 3 completion standard at the top of this document passes in production.
