# WhatsApp Platform — Stage 4 Saved Replies & Agent Productivity

Stage 4 follows the same gate used by the rest of the current roadmap:

> Build → production test → fix every discovered issue → retest → mark complete → unlock next sub-stage.

## Stage 4A — Saved reply foundation

**Status: CODE READY; PRODUCTION GATE REQUIRES THE ADDITIVE SUPABASE MIGRATION.**

Scope:

- existing quick replies preserved as Team replies
- Team and Personal saved-reply scopes
- Personal reply ownership by WhatsApp team member
- Owner/Manager can create, edit and delete Team replies
- every workspace member can create, edit and delete their own Personal replies
- Personal replies are not loaded for other members
- categories stored per saved reply
- search by shortcut, title, message and category
- Team Replies / My Replies tabs
- category filtering
- migration-safe legacy read fallback
- API authorization enforced server-side

Required migration:

`supabase/migrations/202609010002_whatsapp_saved_replies_stage4.sql`

Apply manually in the Supabase SQL editor. Do not run `supabase db push`.

### 4A production gate

1. Existing quick replies still appear as Team replies after migration.
2. Owner can create/edit/delete a Team reply.
3. Manager can create/edit/delete a Team reply.
4. Agent can view Team replies but cannot edit/delete/create Team replies.
5. Agent can create/edit/delete their own Personal reply.
6. A second agent cannot see the first agent's Personal reply.
7. Two different agents can both create the same Personal shortcut.
8. Duplicate Team shortcut is rejected.
9. Duplicate Personal shortcut for the same owner is rejected.
10. Category persists after reload and category filtering works.
11. Search matches shortcut, title, body and category.
12. Saved Replies page works on mobile and desktop.
13. Existing quick replies still work in the inbox composer; 4A must not regress the existing shortcut insertion flow.

Only after all 4A checks pass may Stage 4B begin.

## Stage 4B — Variables + preview

**Status: LOCKED UNTIL 4A PASSES PRODUCTION.**

Planned:

- `{{first_name}}`
- `{{full_name}}`
- `{{company}}`
- `{{phone}}`
- `{{email}}`
- `{{agent_name}}`
- `{{custom.FieldName}}`
- resolved preview before insertion
- visible missing-variable warnings

## Stage 4C — Composer productivity

**Status: LOCKED.**

Planned:

- Team + Personal saved replies in composer
- slash search
- keyboard navigation
- category/search browser
- Saved Replies composer button
- insert without auto-send

## Stage 4D — Media + final production gate

**Status: LOCKED.**

Planned:

- one optional image/video/audio/document attachment per saved reply
- media preview
- production permission checks
- mobile/desktop checks
- Stage 1/2/3 regression checks

Stage 4 is complete only when an agent can answer common enquiries in seconds without manually copying text.
