# WhatsApp Platform — Stage 4 Saved Replies & Agent Productivity

Stage 4 follows the production gate used by the current roadmap:

> Build → production test → fix every discovered issue → retest → mark complete → unlock Stage 5.

The user chose to deploy Stage 4A/4B/4C/4D together and run one combined production test after both required migrations are applied.

## Current status

**CODE READY AS ONE COMBINED STAGE 4 RELEASE; PRODUCTION GATE PENDING.**

Stage 4 is not complete until the combined production test passes.

## 4A — Saved reply foundation

Implemented:

- existing quick replies preserved as Team replies
- Team and Personal scopes
- Personal ownership by WhatsApp team member
- Owner/Manager Team management permissions
- every member can manage their own Personal replies
- Personal replies are not loaded for other members
- categories
- Team Replies / My Replies tabs
- search by shortcut, title, message and category
- category filtering
- server-side authorization
- legacy fallback while the migration is absent

Required migration:

`supabase/migrations/202609010002_whatsapp_saved_replies_stage4.sql`

## 4B — Variables + preview

Implemented variables:

- `{{first_name}}`
- `{{full_name}}`
- `{{company}}`
- `{{phone}}`
- `{{email}}`
- `{{agent_name}}`
- `{{custom.FieldName}}`

Behavior:

- variables resolve from the selected CRM contact and signed-in team member
- custom fields resolve case-insensitively
- missing values remain visible as their `{{variable}}` token rather than becoming a silent blank
- Saved Replies browser shows resolved text before insertion
- missing-variable warnings appear before the agent inserts/sends the reply

## 4C — Composer productivity

Implemented:

- Team plus only the signed-in member's Personal replies in the inbox
- `/shortcut` search
- shortcut-prefix ranking
- fallback search across shortcut, title, message and category
- Arrow Up / Arrow Down navigation in slash mode
- Enter/Tab inserts a saved reply
- Escape closes the list
- direct Saved Replies composer button
- Team/My scope filtering
- category filtering
- browse search
- resolved preview before insertion
- saved replies fill the composer and never auto-send
- existing text, normal attachment, voice-note, reply-to and typing flows preserved

## 4D — Saved reply media

Implemented:

- one optional image, video, document or audio attachment per saved reply
- private Supabase Storage bucket: `whatsapp-saved-replies`
- only metadata/path stored on the saved reply row
- authenticated media preview/download
- Owner/Manager Team media permissions
- owner-only Personal media permissions
- replace/remove attachment support
- existing WhatsApp media validation and size limits reused
- image/video/document send resolved saved-reply text as the WhatsApp caption
- audio sends resolved text first and then the audio because WhatsApp audio does not support captions
- partial audio failure is explicit: if text was sent but media failed, retry sends only the attachment
- existing Meta media sender reused; no parallel send stack and no paid media service

Required migration:

`supabase/migrations/202609010003_whatsapp_saved_reply_media_stage4.sql`

Apply migration `202609010002` first, then `202609010003`, manually in the Supabase SQL editor. Do not run `supabase db push`.

## Combined Stage 4 production gate

Stage 4 is complete only when all of these pass in production:

1. Existing pre-Stage-4 replies remain Team replies.
2. Owner can create/edit/delete Team replies.
3. Manager can create/edit/delete Team replies.
4. Agent can use but cannot modify Team replies.
5. Agent can create/edit/delete their own Personal reply.
6. One member cannot see another member's Personal replies in Saved Replies or the inbox browser.
7. Different members may use the same Personal shortcut; duplicate Team and same-owner Personal shortcuts are rejected.
8. Categories persist and search/category filtering work.
9. Every supported built-in variable resolves correctly against a real contact.
10. `{{custom.FieldName}}` resolves a real CRM custom field.
11. Missing variables remain visible and produce a warning.
12. Saved Replies browser shows the resolved preview before insertion.
13. Slash search, Arrow keys, Enter/Tab and Escape behave correctly.
14. Direct Saved Replies composer button opens the full Team/My/category/search browser.
15. Selecting a saved reply inserts it without sending automatically and remains editable.
16. Image saved reply stores, previews, inserts and sends correctly.
17. Video saved reply stores, previews, inserts and sends correctly.
18. Document saved reply stores, previews, inserts and sends correctly.
19. Audio saved reply sends text then audio without duplicating text on a retry after partial failure.
20. Attachment replace/remove works and permissions are enforced server-side.
21. Saved Replies manager and composer work on mobile and desktop.
22. Stage 1 messaging/media/voice/status/typing/call functionality has no regression.
23. Stage 2 assignment/transfer/notes/@mentions/collision functionality has no regression.
24. Stage 3 CRM/timeline/import-export/conversation-link functionality has no regression.
25. No known Stage 4 blocker remains.

Only after all combined Stage 4 checks pass may Stage 5 — WhatsApp Template Manager — unlock.
