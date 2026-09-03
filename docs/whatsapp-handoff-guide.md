# WhatsApp Console — Handoff Guide

> Written 2026-08-28 for continuing this project by hand, with or without help from another
> assistant. Self-contained on purpose: someone (or something) with **zero prior context**
> should be able to read this and give useful advice.
>
> Repo: `c:\Users\HomePC\Documents\Web Growth\webgrowth-info` · Branch: `main` · HEAD `82aa9fb`
>
> Companion docs: `docs/whatsapp-platform-progress.md` (the long living record — 1,268 lines,
> the authoritative history) and `docs/WHATSAPP-INTEGRATION.md` (integration/ops notes).
> This file is the short version you can hand to someone cold.

---

## 1. What this is

A WhatsApp Business communication console living at `/admin/whatsapp` inside the Web Growth
marketing site. It is an internal admin tool — password-gated, `NOINDEX`, never public.

It does three things:

1. **Receives** WhatsApp messages from customers via Meta's webhook, classifies them into lead
   intents, and stores them in Supabase.
2. **Displays** them in an eight-page console: Overview, Conversations, Contacts, Quick Replies,
   Templates, Phone Numbers, Analytics, Settings.
3. **Sends** replies back — text, attachments, and voice notes — through the Meta WhatsApp
   Cloud API, respecting the 24-hour customer service window.

The backend integration existed and worked *before* this project started. The bulk of the work
has been a **reskin plus an app shell plus a composer rebuild** on top of a working integration —
not new backend plumbing. That distinction matters: when in doubt, preserve, don't rewrite.

---

## 2. Stack, and the four architectural truths that surprise people

**Stack:** Next.js 15.5.14 (App Router, `src/` layout), React 18.3.1, TypeScript 5,
Tailwind **v4**, Node 24. Deployed on Vercel. Windows 11 dev machine (PowerShell + Git Bash).

Four things are non-obvious and will cause wrong advice if you don't know them:

**(a) Tailwind v4 has no config file.** Design tokens live in an `@theme` block in
`src/app/globals.css`. There is **no `tailwind.config.js`**. Do not add one, and do not suggest
editing one.

**(b) There is no Supabase client library in use.** Database access is **raw `fetch` against
PostgREST** with the service-role key, server-side only (`src/app/admin/whatsapp/data.ts` and
`src/lib/whatsapp/store.ts`). `@supabase/supabase-js` `createClient` is **not** used. RLS is
enabled on the tables with **zero policies**, which means the anon key can read nothing — this is
deliberate, and it is why there is no browser database client.

**(c) There is no realtime. "Realtime" is a poll.** Because of (b), Supabase Realtime is not
available. What exists instead: `AutoRefresh.tsx` polls `/api/admin/whatsapp/notifications/` for
a cheap digest, and calls `router.refresh()` when the fingerprint changes. It also listens on
`focus`, `online`, and `visibilitychange`, and does a 60-second reconcile so a missed poll cannot
strand the view. Outgoing messages get an **optimistic bubble** (`OutboundQueue.tsx`) that is
reconciled against the stored row by `whatsapp_message_id`. If someone suggests Supabase
channels or websockets, they have missed this.

**(d) The webhook is the only source of truth for delivery status.** Sent / Delivered / Read /
Failed all arrive from Meta's status webhook and are written to the database. Nothing is
manufactured client-side. A monotonic rank is applied in the PATCH itself
(`null` 0 → accepted/queued/sending 1 → sent 2 → delivered 3 → read 4 → failed 5) so a late or
out-of-order webhook can never walk a status backwards.

---

## 3. Meta WhatsApp Cloud API — the specifics already encoded

Graph version resolves `WHATSAPP_API_VERSION` → `WHATSAPP_GRAPH_API_VERSION` → `v26.0`.

**Text send** is one call: `POST /{phone-number-id}/messages`.

**Media send is two calls** — this trips people up:
1. `POST /{phone-number-id}/media` (multipart) → returns `{id}`
2. `POST /{phone-number-id}/messages` with `type: <kind>` and `<kind>: {id: mediaId}`

**Quoting a message** (Reply Mode) adds `context: {message_id: <wamid>}`.

**Media limits and types** (encoded in `src/lib/whatsapp/media.ts`, with tests):

| Kind | Accepted types | Max size | Caption? | `filename`? |
| --- | --- | --- | --- | --- |
| image | jpeg, png | 5 MB | yes | no |
| video | mp4, 3gp | 16 MB | yes | no |
| document | pdf, txt, doc(x), xls(x), ppt(x) | 16 MB | yes | **yes** |
| audio | ogg, mp4, mpeg, aac, amr | 16 MB | **no** | no |

Captions on audio are silently dropped by Meta — the code refuses to attach one rather than
pretending. Only `document` carries a `filename`.

**Typing indicator** is a slightly odd payload — it rides on the read receipt:
```json
{ "messaging_product": "whatsapp", "status": "read",
  "message_id": "<a REAL inbound wamid>", "typing_indicator": { "type": "text" } }
```
It requires a genuine inbound message id, and it is throttled to one signal every 8 s
(`shouldSendWhatsAppTypingSignal`, `WHATSAPP_TYPING_REFRESH_MS = 8000`). A typing failure must
never block a send — that is wired as a fire-and-forget.

**24-hour service window.** Outside it, Meta refuses free-form messages and only an approved
template will go through. The code detects this and surfaces
`SERVICE_WINDOW_CLOSED` → "The 24-hour customer service window is closed. An approved template
is required." Do not try to work around this; it is a Meta policy, and abusing it can get the
business account restricted.

---

## 4. What is built — page by page

All eight pages are live and registered. Nav status lives in `src/components/whatsapp/nav.ts`
(`live` renders a link; `soon` renders disabled with a "Soon" chip, so the shell never links to
a 404).

| Route | What it does |
| --- | --- |
| `/admin/whatsapp` | Overview dashboard — counts, lead temperature, hand-rolled inline SVG activity chart over a configurable window |
| `/admin/whatsapp/conversations` | The inbox. 3-column on desktop, card list on mobile. 7 filters (ALL/HOT/WARM/REVIEW/PRICING/MEETING/PROPOSAL) with counts, full message thread, and the composer |
| `/admin/whatsapp/contacts` | Contact directory with injection-safe search |
| `/admin/whatsapp/quick-replies` | Create/edit/delete saved replies (Supabase-backed) |
| `/admin/whatsapp/templates` | Approved Meta templates, read live from the Graph API |
| `/admin/whatsapp/phone-numbers` | Sender numbers and their verification/quality state, from Meta |
| `/admin/whatsapp/analytics` | Delivery breakdown, response times, totals, range whitelist |
| `/admin/whatsapp/settings` | **Editable** operator settings + a connection-readiness report |

Settings is genuinely editable and writes to a single-row `whatsapp_settings` table: lead
keywords (additive scoring override), business hours (timezone-aware), response-time target,
inbox refresh interval (clamped 5–300 s), and the activity window in days. The webhook reads
these through a 60-second cache and applies keyword overrides *after* the built-in classifier,
so absent settings change nothing.

### The composer (most recent work, finished 2026-08-27)

Rebuilt to an approved mockup. It lives in `ReplyComposer.tsx` plus four collaborators:

- **Editor pill** — rounded, auto-resizes from one line to four then scrolls internally.
  `Enter` sends, `Shift + Enter` breaks the line, and it will not steal an IME composition
  commit. Emoji / paperclip / microphone sit **inside** the pill; the green send button and the
  `+` sit **outside** it.
- **`+` → `AttachmentMenu.tsx`** — a four-across tile grid (Document, Image, Video, Audio) as a
  floating panel on desktop, a bottom sheet on mobile. Quick Replies and Templates keep a row
  below the divider. *The mockup also showed Contact, Location and Camera tiles; those were
  deliberately not built, because the send path cannot produce those message types.*
- **`EmojiPicker.tsx`** — tab strip led by a recents tab, green underline on the active tab
  (emoji glyphs ignore `color`, so the rule has to carry the state), insertion at the caret,
  closes on outside click and on Escape. Recents persist per operator. No new dependency.
- **Voice notes** — permission → record → timer → live waveform → cancel/delete/send. The blob
  goes to `/api/admin/whatsapp/reply/audio/`, is uploaded server-side, and arrives as a real
  playable WhatsApp audio message.
- **Reply Mode** — `ReplyTarget.tsx`. A quoted panel above the editor (green left rule, author
  name, truncated excerpt, `X`), `Escape` to leave. A per-bubble reply button reaches the
  composer through a React context nested inside the existing outbound-queue provider.

**One security decision worth understanding**, because it is the pattern to copy: the quoted
`wamid` originates in a browser, so it is untrusted. Sending it straight into Meta's `context`
would let an authenticated admin quote *another conversation's* message and leak its content into
this customer's chat. `resolveSupabaseWhatsAppQuotedMessageId` (in `src/lib/whatsapp/store.ts`)
re-checks server-side that the id belongs to this conversation; anything unrecognised silently
falls back to the conversation's own latest inbound message. Both reply routes go through it.

### Also live: the six "live messaging" features

Dashboard logo, WhatsApp business profile picture, customer fallback avatars, agent→customer
typing indicator, near-real-time message updates, and message delivery statuses.

---

## 5. The 15-stage plan and where it actually stands

| Stage | Requirement | State |
| --- | --- | --- |
| 1 | Audit repo & existing architecture | Done |
| 2 | WhatsApp application shell | Done |
| 3 | Responsive overview dashboard | Done |
| 4 | Conversation list | Done |
| 5 | Active chat interface | Done |
| 6 | Contact details panel | Done |
| 7 | Connect UI to live WhatsApp data | Done |
| 8 | Reliable message statuses | Done |
| **9** | **Notes, labels, assignment** | **Partial — BLOCKED.** `assigned_to` exists and shows read-only. `notes` and `labels` have **no columns** on `whatsapp_conversations`. The panel says so rather than rendering inputs that cannot save. Needs an additive migration first. |
| 10 | Contacts page | Done |
| 11 | Quick Replies | Done |
| 12 | Templates | Done |
| 13 | Analytics | Done |
| **14** | **Campaign foundation** | **Not started.** No files, no routes. |
| **15** | **Automation architecture** | **Not started.** No files, no routes. |

Plus a Settings page (not one of the 15 stages — built because it makes the migration blockers
visible in the UI rather than only in a document) and the composer redesign.

---

## 6. File map

```
src/app/admin/whatsapp/
  layout.tsx              auth-aware console layout; mounts the shell
  page.tsx                Overview dashboard
  conversations/page.tsx  the inbox (thread + composer)
  contacts/ quick-replies/ templates/ phone-numbers/ analytics/ settings/   page.tsx each
  auth.ts                 hasWhatsAppAdminAccess
  data.ts                 service-role PostgREST reads + exact-count + probeWhatsAppTable

  ── client components ──
  ReplyComposer.tsx       the composer
  AttachmentMenu.tsx      the + grid / bottom sheet
  EmojiPicker.tsx         emoji panel
  ReplyTarget.tsx         Reply Mode context + per-bubble button
  MessageMedia.tsx        renders received/sent media in a bubble
  OutboundQueue.tsx       optimistic outgoing bubbles + reconciliation
  AutoRefresh.tsx         the polling "realtime"
  QuickReplyManager.tsx   quick-reply CRUD UI
  SettingsEditor.tsx      the settings form

  ── pure models, each with a .test.ts beside it ──
  composerModel.ts  emojiModel.ts  outboundQueueModel.ts  dashboard.ts
  overview.ts  contactsModel.ts  quickRepliesModel.ts  analyticsModel.ts
  integrationModel.ts

src/app/api/admin/whatsapp/        (all admin-gated)
  reply/route.ts           text reply
  reply/media/route.ts     attachment reply
  reply/audio/route.ts     voice note
  typing/route.ts          typing indicator
  notifications/route.ts   the polling digest
  media/[mediaId]/route.ts media proxy (never exposes the token)
  profile-photo/route.ts   business profile picture
  quick-replies/route.ts   POST/PATCH/DELETE
  settings/route.ts        PUT
src/app/api/whatsapp/webhook/route.ts   Meta's inbound webhook (signature-verified)

src/lib/whatsapp/          (server-only; no "use client" anywhere in here)
  store.ts        Supabase reads/writes, dedup on wamid, status rank
  send.ts         Meta send calls, error mapping
  inboxReply.ts   orchestrates a reply (window check → send → store)
  media.ts        kinds, limits, validation
  audio.ts        voice-note handling
  typing.ts       typing payload + throttle
  webhook.ts      payload normalization + processing
  classify.ts     lead intent classification + keyword overrides
  messageStatus.ts  status rank and sanitized failure reasons
  settings.ts settingsStore.ts   operator settings model + cached store
  templates.ts phoneNumbers.ts businessProfile.ts avatar.ts notifications.ts types.ts

src/components/whatsapp/
  WhatsAppShell.tsx    responsive shell: deep-green sidebar, sticky top bar, mobile drawer
  nav.ts               nav model, live/soon status  (nav.test.ts asserts the EXACT ordered list)
  icons.tsx            local inline SVG icon set (~25 glyphs)
  MessageStatus.tsx ContactAvatar.tsx shellBranding.test.ts
```

**A real trap in `icons.tsx`:** it evaluates JSX at module level. Any `*.test.ts` that
transitively imports it **crashes the test runner**. This is why every piece of pure logic lives
in a separate `.ts` model module, and why `buildWhatsAppReplyQuote` takes a structural type
instead of importing the page's row type. Keep that separation.

---

## 7. Database

Supabase project, reached over PostgREST. Tables: `whatsapp_events`, `whatsapp_contacts`,
`whatsapp_conversations`, `whatsapp_messages`, `whatsapp_quick_replies`, `whatsapp_settings`.

Migrations (WhatsApp ones only — the rest belong to the TikTok scheduler):

| File | State |
| --- | --- |
| `202608130001_whatsapp_crm.sql` | applied |
| `202608240001_whatsapp_audio_messages.sql` | applied |
| `202608250001_whatsapp_quick_replies.sql` | applied |
| `202608260001_whatsapp_settings.sql` | applied |
| `202608260002_whatsapp_delivery_error.sql` | applied |

### Three migration rules that matter

1. **There is no migration runner.** Writing the `.sql` file does nothing. It must be pasted
   into the **Supabase SQL editor** and run by hand. Always make the code degrade to a
   documented default until the column exists.
2. **Never run `supabase db push`.** `supabase/migrations/` also holds five TikTok scheduler
   migrations, one of which creates cron jobs. The remote has no CLI migration history, so a
   push would try to apply those too and cross the do-not-touch boundary.
3. **`DATABASE_URL` / `POSTGRES_URL` / `PGHOST` point at `neon.tech`, NOT Supabase.** There are
   two databases in this project. Running a WhatsApp migration against `DATABASE_URL` creates
   the table in the *wrong database*. The WhatsApp tables are in Supabase.

There is also a defensive pattern worth knowing: PostgREST **rejects an entire select** that
names a column the table lacks, and `readWhatsAppRows` collapses that to `null` — which once
would have blanked every thread. `readConversationMessageRows` now retries without the optional
column, so an unapplied migration costs a *sentence*, never the messages.

---

## 8. Environment variables (names only — never print values)

Server-side, required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — **marked Sensitive in Vercel, so `vercel env pull` returns the
  literal string `[SENSITIVE]`.** It cannot be recovered from Vercel by any CLI call. Get it from
  the Supabase dashboard → Project Settings → API.
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_API_VERSION` (optional; falls back to `v26.0`)
- `META_APP_SECRET` — webhook signature verification
- `WHATSAPP_VERIFY_TOKEN` — webhook handshake
- `INTERNAL_TOOL_SESSION_SECRET` — the admin gate (also Sensitive in Vercel)

**Two are missing on this machine entirely: `SUPABASE_SERVICE_ROLE_KEY` and `META_APP_SECRET`.**
Consequences, which explain a lot of "it looks broken locally":

- Every Supabase read returns null, so every data page renders its empty state ("—") locally.
  Meta-backed pages (Templates, Phone Numbers) *do* show real data, because the access token is
  present.
- The webhook would reject Meta's signature, and a localhost webhook is unreachable from the
  internet anyway.
- **No send, delivery status, or realtime behaviour can be exercised end-to-end from this
  machine.** Those paths are covered by unit tests and were verified against a production build,
  but not observed on a handset. Test them in production, one of each, after any change.

`.env.example` carries names only. Never commit a real value.

---

## 9. Commands, and the traps in them

```bash
# Tests — there is NO `npm test` script
npx tsx --test $(find src -name '*.test.ts' -o -name '*.test.tsx')     # 621 pass, 0 fail

# Typecheck — there is NO `typecheck` script
npx tsc --noEmit

# Lint — scope it. Bare `npm run lint` walks .codex-temp/ and reports ~814 pre-existing findings
npx next lint --dir src/app/admin/whatsapp --dir src/components/whatsapp \
              --dir src/lib/whatsapp --dir src/app/api/admin/whatsapp

# Build
npm run build      # = prepare-build.mjs && validate-sitemap.mjs && next build

# Dev
npm run dev
```

**Trap 1 — never run `npm run build` while `npm run dev` is running.** Both write `.next/`. The
production build clobbers the dev server's chunks and every dev request then 500s with
`Cannot find module './383.js'`. It is not a code bug. Fix: stop dev, `rm -rf .next`, restart.
Working order: tests → tsc → lint → **stop dev** → build → restart dev.

**Trap 2 — every new page must be registered.** `scripts/validate-sitemap.mjs` runs inside
`npm run build` and fails on any `src/app/**/page.tsx` missing from
`src/lib/route-governance.json`. Console pages use:
```json
{ "path": "/admin/whatsapp/<name>/", "status": "NOINDEX", "sitemap": false, "reason": "..." }
```
API routes and plain components are exempt. Adding WhatsApp entries is safe —
`publicPages.test.ts` only asserts the scheduler entries, which must not be touched.

**Trap 3 — `nav.test.ts` asserts the exact ordered list of live routes.** Promoting a route from
`soon` to `live` means updating that assertion in the same commit. Nav order is
Workspace → Growth → Configuration.

**Trap 4 — trailing slashes on API fetches.** The project's routing expects them; fetch
`/api/admin/whatsapp/reply/`, not `/api/admin/whatsapp/reply`.

**Trap 5, and the most important lesson of the whole project — a green build says nothing about
whether a dynamic page renders.** The shell rendered the wordmark with `quality={80}`, but
`next.config.mjs` allows only `[60, 65, 68, 75]`. An unlisted quality makes `next/image` **throw
during render**. Console pages are server-rendered on demand, so `next build` never executed
that path, and React swallowed the throw into the Suspense fallback. Result: **all eight console
pages served nothing but the loading screen** while build, typecheck, and 572 tests stayed green.
It is now pinned by `src/components/whatsapp/shellBranding.test.ts`. Moral: after any change to
these pages, actually load them and read the HTML.

---

## 10. Conventions to follow

**Design system — Growth Ledger.** Reuse tokens; do not invent new ones.

| Purpose | Tokens |
| --- | --- |
| Dark surfaces / sidebar | `ledger-deep #0c3327`, `ledger #124a38`, `ink-ground #0e1a14` |
| Canvas | `paper #eff1ec`, `paper-raised #f7f8f4`, `paper-sunk #e4e7de` |
| Text | `ink #14140f`, `ink-soft #454a3f`, `ink-faint #737868` |
| On dark | `on-dark #eaebe4`, `on-dark-soft #9aa292` |
| Accents | `ledger-bright #1c7a54` (green), `brass #b4802f` (gold), `ledger-tint`, `brass-tint` |
| Rules | `rule #d2d6cb`, `rule-strong #b7bbae` |
| Fonts | `font-sans` Inter, `font-display` Fraunces, `font-mono` IBM Plex Mono |
| Utilities | `.wg-card`, `.wg-btn` / `-primary` / `-secondary` / `-ghost`, `.wg-eyebrow`, `.wg-rule` |

Stock Tailwind slate/blue/indigo/violet/purple/sky/cyan are **remapped** onto ledger green, and
amber onto brass. **`rose-*` is NOT remapped** — it is therefore the honest colour for alerts,
failures, and HOT states. Arbitrary values (`text-[#6f4f16]`, `h-[1.05rem]`) are idiomatic here.

**Icons are local inline SVG** in `src/components/whatsapp/icons.tsx` — not `lucide-react`. Zero
dependency, one stroke weight, one 24×24 box. Add a glyph by adding it to **both** the
`WhatsAppIconName` union **and** the `ICON_PATHS` record (forgetting the union is a real
typecheck error I hit).

**Every mutation follows one shape:**
```
client → fetch("/api/admin/whatsapp/<x>/", …)
       → route: hasWhatsAppAdminAccess(cookieStore)   → 401
                isSameOriginMutation(origin, url)     → 403
       → store
       → router.refresh()
```
Both guards run **before** the body is parsed. Copy this for any new write.

**Server components fetch; client components poll.** Secrets never cross the boundary — the
layout passes a `senderConnected` **boolean** to the client shell, never a credential.

**Errors are sanitized before they reach an operator.** Meta error codes map to fixed sentences
(131026, 131047, 131049, 131051, 131053, 132000, 132001, 133010, 470, 368 are all handled). Raw
provider payloads and stack traces are never displayed. `console.error` logs a status and a
Postgres error code — never a token, never the document.

---

## 11. Security rules — do not break these

- **Meta credentials stay server-side.** No access token, app secret, verify token, or
  service-role key in a client component, and nothing sensitive behind `NEXT_PUBLIC_*`.
- **Never log a full secret**, and never print one into a report or a commit message.
- The media proxy (`/api/admin/whatsapp/media/[mediaId]/`) exists precisely so the browser can
  display media **without** ever seeing the token.
- **Treat every id coming from a browser as untrusted**, even from an authenticated admin —
  re-check server-side that it belongs to the conversation in hand. See
  `resolveSupabaseWhatsAppQuotedMessageId` for the pattern.
- **Internal notes must never be sent to WhatsApp.** If you extend the composer, keep that mode
  boundary loud.
- **Do not bypass the 24-hour window.** Meta can restrict the business account.
- Verified as *not* a leak, and fine to leave alone: the Settings page shows the configured
  `WHATSAPP_BUSINESS_ACCOUNT_ID` and `WHATSAPP_PHONE_NUMBER_ID` **values** to an authenticated
  admin. Those are identifiers, not secrets — useless without the token — and displaying them is
  the readiness console's whole purpose.

---

## 12. Do not touch — the TikTok scheduler boundary

This repo also contains an unrelated TikTok scheduler owned by a different workstream. **Never
modify:**

```
src/lib/scheduler/**            src/app/scheduler/**
src/app/api/scheduler/**        src/components/scheduler/**
src/app/api/tiktok/**           src/app/connect/tiktok/**
src/app/tiktok-media/[...path]/route.ts
src/lib/tiktokWorkflowStore.ts  src/lib/internalWorkflowAuth.ts
.codex-temp/**
migrations 202608210001, 202608210002, 202608210003, 202608230001, 202608240002
```

**Shared — read-only use is fine, but make a WhatsApp-specific version rather than editing:**
`src/lib/scheduler/config.ts`, `session.ts`, `src/lib/secureCookie.ts`, `src/lib/tiktok.ts`,
`tiktokPublishing.ts`, `src/lib/site.ts`, `posts.ts`, `internalUtilityAuth.ts`,
`src/components/internal/InternalUtilityUnlockForm.tsx`.

Also off-limits for this work: the automation advertising landing page
(`/services/business-automation/`) — verify shared changes don't break it, but don't redesign it.

**Git hygiene used throughout:** never `reset --hard`, `checkout .`, or any global discard. Stage
only WhatsApp files by explicit path. Never `git add -A` or `commit -am`.

One known pre-existing lint warning, deliberately left alone because it is scheduler code:
`src/components/scheduler/PostStatusPanel.tsx:68` `react-hooks/exhaustive-deps`.

---

## 13. Known gaps — what has never actually been verified

Be honest about these when asking for advice; they change what good advice looks like.

1. **No page in this console has ever been opened in a real browser at multiple breakpoints, and
   no accessibility audit has been run.** Everything is structurally responsive and semantically
   marked up by inspection — that is not observation. This is the recorded next task.
2. **No send has been observed arriving on a handset.** Attachment upload, a voice note playing
   as WhatsApp audio, the typing indicator reaching Meta, and Sent/Delivered/Read coming back are
   all covered by unit tests and verified against a production build, but the customer-side half
   has never been watched. Missing local credentials, per §8.
3. **Stage 9 (notes/labels)** is blocked on an additive migration, not on code.
4. **Stages 14 and 15 do not exist** — no files, no routes.
5. Cosmetic and pre-existing: the locked screen says "Unlock the voice tool" because
   `InternalUtilityUnlockForm` is shared with a text-to-speech utility. Fixing it properly means
   a per-utility copy prop on a shared component.
6. Old inbox bookmarks (`/admin/whatsapp/?filter=HOT&lead=…`) now land on the Overview and the
   params are ignored. Deliberate; add a redirect only if it becomes annoying.

**Current gate status** (all green as of `82aa9fb`): 621/621 tests, `tsc --noEmit` clean, scoped
lint clean, `npm run build` exit 0, 94 governed routes, 136/136 static pages.

---

## 14. What to do next

### Next task (recorded, and the cheapest real win)

**A browser and accessibility pass over the eight console pages, starting with
`/admin/whatsapp/settings`.**

```bash
npm run dev    # then open /admin/whatsapp
```

Open each page at **375 / 390 / 430 / 768 / 1440 px** and specifically exercise:

- the mobile drawer (open, Escape to close, scroll lock)
- the lead card list on narrow viewports
- the overview chart
- the 3-column conversations layout at each breakpoint
- the composer: type, `Enter`, `Shift + Enter`, grow to four lines then scroll, emoji insert at
  caret, `+` panel as a bottom sheet, record a voice note, enter and leave Reply Mode
- the settings form's keyboard path — the business-day pills are `sr-only` checkboxes with the
  focus ring on the *label*; verify the ring is actually visible
- touch targets at ~44×44 px

Then run an automated audit (Lighthouse or axe DevTools). This closes gap #1 above and is
cheaper than either remaining feature.

**Do this in production too, once:** send yourself one text, one image, one document, and one
voice note, and watch the status ticks progress. That closes gap #2, and no amount of local
testing substitutes for it.

### Then, one of two features — a real decision, not a default

**Automations (Stage 15) — lighter.** Auto-replies and routing rules. Needs a new table plus a
decision about *where rules execute*: inline in the webhook path (simple, but it puts your logic
in front of every inbound message and a bug there loses messages) or in a job/queue (safer,
more moving parts). Read `src/lib/whatsapp/store.ts` end to end before designing anything.

**Campaigns (Stage 14) — heaviest and highest-risk.** Sends approved templates outbound. Needs a
new send path, recipient selection, rate limiting, and consent/opt-out handling. **This is the
one remaining piece that can get the WhatsApp Business account restricted if done carelessly.**
Do not start it casually; think about opt-out before you think about UI.

**Stage 9 (notes/labels)** is a small, satisfying unblock if you want a quick win instead: write
an additive migration adding `notes` and `labels` to `whatsapp_conversations`, run it in the
Supabase SQL editor, then build the panel inputs. Keep the code degrading gracefully until the
columns exist.

### Checklist for any new page

1. Create `src/app/admin/whatsapp/<name>/page.tsx`
2. Add the entry to `src/lib/route-governance.json` (`NOINDEX`, `sitemap: false`) — **the build
   fails without it**
3. Flip `status` to `"live"` in `src/components/whatsapp/nav.ts`
4. Update the ordered live-routes assertion in `nav.test.ts`
5. Put pure logic in a `<name>Model.ts` with a `.test.ts` beside it — never import `icons.tsx`
   from a test
6. Run tests → tsc → scoped lint → stop dev → build → restart dev → **load the page and read the
   HTML**
7. Update `docs/whatsapp-platform-progress.md`
8. Commit only WhatsApp paths, by explicit path

---

## 15. A context primer to paste into another assistant

If you want help from ChatGPT (or anything else) on a specific task, paste this first, then your
question. It is the minimum that prevents confidently wrong advice.

```text
I'm working on an internal WhatsApp Business console inside a Next.js 15 App Router marketing
site (src/ layout, React 18, TypeScript 5, Tailwind v4, Node 24, deployed on Vercel). It lives at
/admin/whatsapp and is password-gated and NOINDEX. Please respect these facts about the codebase
— they are unusual and they invalidate a lot of default advice:

1. Tailwind v4 with NO tailwind.config.js. Design tokens are in an @theme block in
   src/app/globals.css. Custom palette ("Growth Ledger"): ledger-deep #0c3327, ledger #124a38,
   ledger-bright #1c7a54, paper #eff1ec, paper-raised #f7f8f4, ink #14140f, ink-soft #454a3f,
   ink-faint #737868, rule #d2d6cb, brass #b4802f. Stock Tailwind blues/slates are remapped to
   green; rose-* is not remapped and is the alert colour.
2. Supabase is accessed by RAW fetch against PostgREST with the service-role key, SERVER-SIDE
   ONLY. @supabase/supabase-js is not used. RLS is on with zero policies, so there is no browser
   database client and Supabase Realtime is NOT available. Do not suggest it.
3. "Realtime" is a poll: a client component polls an API digest route and calls router.refresh(),
   plus focus/online/visibilitychange listeners and a 60s reconcile. Outgoing messages get
   optimistic bubbles reconciled by WhatsApp message id (wamid).
4. Messages send through the Meta WhatsApp Cloud API. Media is a TWO-call flow: POST
   /{phone-number-id}/media (multipart) to get an id, then POST /{phone-number-id}/messages with
   type + {id}. Quoting uses context: {message_id}. Delivery status comes only from Meta's
   webhook and is stored with a monotonic rank so late webhooks can't walk it backwards.
5. Icons are a local inline-SVG set (src/components/whatsapp/icons.tsx), not lucide. That file
   evaluates JSX at module level, so no *.test.ts may import it, directly or transitively — pure
   logic lives in separate .ts model modules with tests beside them.
6. Every mutation goes: client fetch to /api/admin/whatsapp/<x>/ (trailing slash matters) →
   route checks hasWhatsAppAdminAccess (401) then isSameOriginMutation (403) BEFORE parsing the
   body → store → router.refresh().
7. Tests run with `npx tsx --test <files>` (node:test) — there is no `npm test` and no
   `typecheck` script (use npx tsc --noEmit). Every new page MUST be added to
   src/lib/route-governance.json or `npm run build` fails. Never run a build while the dev server
   is running.
8. Secrets stay server-side always: no Meta access token, app secret, verify token, or Supabase
   service-role key in client code or behind NEXT_PUBLIC_*. Never log a secret. IDs arriving from
   a browser are untrusted even from an authenticated admin and must be re-validated server-side.
9. The repo also contains an unrelated TikTok scheduler (src/**/scheduler/**, src/**/tiktok*)
   that must never be modified.
10. Do not bypass WhatsApp's 24-hour customer service window; outside it, only approved templates
    can be sent.

Eight console pages are live (Overview, Conversations, Contacts, Quick Replies, Templates, Phone
Numbers, Analytics, Settings). The message composer was just rebuilt: auto-resizing editor,
emoji picker with recents, attachment grid (image/video/document/audio only), functional voice
notes, and a reply-quote mode. Not started: Campaigns and Automations. Blocked on a migration:
conversation notes and labels.

My question is:
```

---

## 16. Where the detail lives

- **`docs/whatsapp-platform-progress.md`** — the authoritative 1,268-line record: every
  increment's notes, every architectural decision and its reasoning, the full verification
  history, and the exact resume point. Read this before making a design decision; it usually
  explains why something is the way it is.
- **`docs/WHATSAPP-INTEGRATION.md`** — integration and operations notes.
- **This file** — the cold-start summary.

Keep the progress doc updated as you go. Its "Interface Resume Point" section at the end is the
one thing that should always be current, because it is what a future session reads first.
