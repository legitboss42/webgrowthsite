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

**Status: COMPLETE — PRODUCTION VERIFIED ON 2026-09-01.**

Implemented and production-tested:

- pipeline stages: `NEW`, `QUALIFIED`, `FOLLOW_UP`, `CUSTOMER`, `REPEAT_CUSTOMER`, `LOST`
- tags, capped and case-insensitively de-duplicated
- flat string custom fields, capped and validated
- consent state: `UNKNOWN`, `OPTED_IN`, `OPTED_OUT`
- last opt-in and last opt-out timestamps retained as history
- pipeline filtering in Contacts
- Stage 3 fields visible on mobile cards and desktop table
- Stage 3 fields editable inside the contact profile
- server-side validation for all new CRM fields
- additive Supabase migration applied successfully
- duplicate manual-contact prevention retained
- conversation linking retained
- Agent / Manager / Owner access behaviour verified
- mobile and desktop behaviour verified

### Migration applied

`supabase/migrations/202609010001_whatsapp_contact_crm_stage3.sql`

The migration was applied manually in the Supabase SQL editor. Do not run `supabase db push` for WhatsApp migrations.

### 3B production gate result

All required 3B production checks passed on 2026-09-01:

1. Stage 3 migration warning removed after migration.
2. Automatically created WhatsApp contacts default to **New**.
3. Pipeline changes persist after full reload.
4. Tags persist and case-insensitive duplicates are removed.
5. Tag removal persists.
6. Custom fields round-trip correctly.
7. Custom-field removal persists.
8. Unknown → Opted in persists with opt-in timestamp.
9. Opted in → Opted out preserves old opt-in timestamp and records opt-out timestamp.
10. Opted out → Opted in preserves prior opt-out timestamp and records the latest opt-in timestamp.
11. CRM field validation behaved correctly.
12. Pipeline filtering returned the expected contacts.
13. Contact profile remained usable on mobile and desktop.
14. Agent contact access rules passed.
15. Manager / Owner create and edit permissions passed.
16. Duplicate manual contact creation remained blocked.
17. Contact-to-conversation linking opened the correct customer thread.

## 3C — timeline + import/export + final permissions/regression gate

**Status: UNLOCKED — CURRENT SUB-STAGE.**

Scope:

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

### 3C gate

3C is complete only when:

1. A contact profile exposes one ordered timeline containing CRM activity, message history, and call history where data exists.
2. Timeline records resolve to the correct contact and cannot expose another contact's data.
3. CSV export produces correct CRM data with stable headers and safe escaping.
4. CSV import validates rows, rejects malformed/duplicate records safely, and reports per-row outcomes without corrupting existing contacts.
5. Agent / Manager / Owner permissions are physically verified across the full Stage 3 surface.
6. Contact-to-conversation links are physically reverified.
7. Mobile and desktop behavior is physically reverified.
8. Stage 1 production regression matrix passes.
9. Stage 2 production regression matrix passes.
10. No known Stage 3 blocker remains.

Stage 3 is marked 100% only after the complete Stage 3 completion standard at the top of this document passes in production.
