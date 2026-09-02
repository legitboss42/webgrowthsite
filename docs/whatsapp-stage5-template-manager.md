# WhatsApp Platform — Stage 5 Template Manager

Stage 5 gate:

> Build → apply additive migration → production test → fix every discovered issue → retest → mark complete → unlock Stage 6.

## Current status

**CODE READY; PRODUCTION GATE PENDING.**

## Implemented

- live template list read from the connected Meta WABA
- search and status filtering
- APPROVED / PENDING / REJECTED / PAUSED / DISABLED status display
- rejection reason and quality metadata where Meta returns them
- persistent Web Growth template drafts
- Owner/Manager draft create/edit/delete
- Agents can view live Meta templates but cannot mutate drafts or submit/test
- Utility and Marketing template builder
- text header, body and footer
- Meta positional variables such as `{{1}}` and `{{2}}`
- required sample values for variables
- Quick Reply buttons
- static Website and Phone buttons
- phone-style preview
- submit a saved draft to Meta for review
- successful submission stores the returned Meta template id locally
- submitted local drafts are locked to prevent accidental resubmission
- duplicate live or local templates into a fresh editable draft
- refresh/sync live status from Meta
- approved-template test send to a chosen recipient
- test send validates header/body variable counts before contacting Meta
- Meta access token remains server-side

## Deliberate first-release boundaries

- Authentication template creation remains read-only because Meta authentication templates use a specialized OTP component workflow.
- Media-header template creation is not included in this Stage 5 release because Meta requires a separate uploaded header asset workflow.
- Existing Meta Authentication or media-header templates still appear in the live list and their status remains visible.

## Required migration

`supabase/migrations/202609020001_whatsapp_template_manager_stage5.sql`

Apply manually in the Supabase SQL editor. Do not run `supabase db push`.

## Production gate

1. Existing live Meta templates still load.
2. Search and Approved/Pending/Rejected filters work.
3. Rejected templates show the Meta rejection reason when returned.
4. Owner can create, edit and delete an unsent draft.
5. Manager can create, edit and delete an unsent draft.
6. Agent can view live templates but cannot create/edit/delete/submit/test-send templates.
7. Draft persists after refresh.
8. Duplicate draft name+language is rejected safely.
9. Utility draft with header/body/footer saves and previews correctly.
10. Marketing draft saves and previews correctly.
11. `{{1}}`, `{{2}}` variables require sample values and resolve in preview.
12. Invalid/non-sequential/named draft variables are rejected by this production builder.
13. Quick Reply buttons save and preview.
14. Website button validates URL and persists.
15. Phone button validates number and persists.
16. Quick Reply buttons cannot be mixed with CTA buttons in this release.
17. Submit a valid draft to Meta and receive a Meta template id.
18. Submitted draft becomes locked locally and cannot be submitted twice.
19. Refresh Meta and confirm submitted template appears with PENDING/APPROVED/REJECTED status as returned by Meta.
20. Duplicate a live Meta template and save the copy under a new name.
21. Approved template test send works to a real WhatsApp recipient.
22. Template test variables are sent in the correct header/body positions.
23. Non-approved templates cannot be test-sent.
24. Mobile and desktop manager layouts remain usable.
25. Stage 1–4 production regression checks pass with no known blocker.

Only after the full production gate passes may Stage 6 — Automation Engine — unlock.
