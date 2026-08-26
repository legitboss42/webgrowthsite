# WhatsApp Platform Interface Redesign — Progress & Resume Doc

> Living document. Update after every milestone so a fresh session (or a
> reconnect after a dropped network) can resume exactly where we left off.
> Last updated: 2026-08-26 (interface paused for live messaging features).

## Interface Development Paused

Interface implementation was temporarily paused to implement and live-test core WhatsApp
messaging/profile functionality.

### Interface Progress Before Pause

Current stage: **Increment 10 — editable console settings. COMPLETE and verified**, but
**uncommitted**. Nothing is half-edited: no file is mid-refactor, no component is a stub,
no route is registered without a page. The pause happened at a clean checkpoint, not
mid-task. Work is on `main` (`git branch --show-current` → `main`), HEAD `b5ac807`
"Add WhatsApp settings and readiness console", equal to `origin/main`. Increment 10 sits
on top of that as 22 uncommitted paths (15 modified files, 521 insertions / 100 deletions,
7 untracked).

Completed:
- Stages 1–8 of the user's 15-stage order (audit, shell, overview, conversation list,
  active chat, contact panel, live data wiring, message statuses).
- Stages 10 (Contacts), 11 (Quick Replies), 12 (Templates), 13 (Analytics).
- Increments 1–10: shell → overview → conversations polish → contacts → quick replies →
  templates → phone numbers → analytics → settings (read-only) → settings (editable).
- Eight console pages live: `/admin/whatsapp` (overview), `/conversations`, `/contacts`,
  `/quick-replies`, `/templates`, `/phone-numbers`, `/analytics`, `/settings`.
- Verification at the point of pause: 506/506 tests, `npx tsc --noEmit` clean, eslint 0
  problems on the WhatsApp paths, `npm run build` exit 0, 94 governed routes.

Partially completed:
- **Stage 9 (notes, labels, assignment)** — the only genuinely unfinished earlier stage.
  `assigned_to` exists and is displayed read-only. `notes` and `labels` have **no columns**
  on `whatsapp_conversations`, so the contact panel says so rather than rendering inputs
  that cannot save. Needs an additive migration first. **Do not build that UI before the
  column exists.**
- Stages 14 (Campaigns) and 15 (Automations) — **NOT STARTED**. No files, no routes, no
  nav entries beyond the "Soon" chips.

Current files (the 22 uncommitted paths carrying Increment 10):
```
 M docs/whatsapp-platform-progress.md
 M src/app/admin/whatsapp/AutoRefresh.test.ts
 M src/app/admin/whatsapp/AutoRefresh.tsx
 M src/app/admin/whatsapp/analytics/page.tsx
 M src/app/admin/whatsapp/conversations/page.tsx
RM src/app/admin/whatsapp/settingsModel.test.ts -> src/app/admin/whatsapp/integrationModel.test.ts
RM src/app/admin/whatsapp/settingsModel.ts     -> src/app/admin/whatsapp/integrationModel.ts
 M src/app/admin/whatsapp/page.tsx
 M src/app/admin/whatsapp/settings/page.tsx
 M src/app/api/whatsapp/webhook/route.ts
 M src/lib/whatsapp/classify.test.ts
 M src/lib/whatsapp/classify.ts
 M src/lib/whatsapp/store.ts
 M src/lib/whatsapp/webhook.test.ts
 M src/lib/whatsapp/webhook.ts
?? src/app/admin/whatsapp/SettingsEditor.tsx
?? src/app/api/admin/whatsapp/settings/
?? src/lib/whatsapp/settings.test.ts
?? src/lib/whatsapp/settings.ts
?? src/lib/whatsapp/settingsStore.test.ts
?? src/lib/whatsapp/settingsStore.ts
?? supabase/migrations/202608260001_whatsapp_settings.sql
```
**None of this is committed.** A future session must not assume `git log` shows Increment 10
— it does not. Check `git status` before concluding work is missing.

Known issues at the point of pause:
- **Nothing in the console has been opened in a real browser.** Analytics, Settings, and the
  editable settings form are structurally responsive and semantically marked up, but that is
  inspection, not observation. No automated accessibility audit has been run.
- **Increment 10 has never run against a real `whatsapp_settings` table** in this
  environment — only the defaults-and-fallback paths, plus unit tests. (The user has since
  applied the migration in Supabase; see the migrations section below.)
- **There is no realtime anywhere.** `AutoRefresh` polls `/api/admin/whatsapp/notifications`
  and calls `router.refresh()`. It deliberately **pauses while a `TEXTAREA`/`INPUT` is
  focused or the tab is hidden** — which is exactly the behaviour the live-messaging work
  below has to change.
- Stage 8 shows the raw Meta status string in the thread; humanising it was left as cosmetic.
- `SUPABASE_SERVICE_ROLE_KEY` is not available locally (Vercel marks it Sensitive), so
  Supabase-backed pages render "—" here. Meta-backed pages (Templates, Phone Numbers) do
  show live data because `WHATSAPP_ACCESS_TOKEN` is present.
- Cosmetic, pre-existing: the locked screen says "Unlock the voice tool" because
  `InternalUtilityUnlockForm` is shared with the text-to-speech utility.

### Exact Resume Point

After the live-feature work is complete, resume interface development from:

**A browser + accessibility pass over the eight existing console pages, starting with
`/admin/whatsapp/settings`.** Run `npm run dev`, open each page at 375px / 768px / 1440px,
and specifically exercise: the mobile drawer, the lead card list, the overview chart, the
3-column conversations layout at each breakpoint, and the settings form's keyboard path
(the business-day pills are `sr-only` checkboxes with the focus ring on the label — verify
it is actually visible). Then run an accessibility audit. This closes the single honest gap
in the verification list and is cheaper than either remaining feature.

**Then** — and only after asking the user which — one of Stage 15 (Automations, lighter,
needs a new table plus a decision on where rules execute) or Stage 14 (Campaigns, heaviest
and highest-risk: new send path, recipient selection, rate limiting, consent/opt-out). The
user has **not** chosen between these; do not assume. Stage 9 (notes/labels) is blocked on
an additive migration, not on code.

## Current phase

**Increment 10 (editable console settings) — COMPLETE and verified.** Eight console
pages live. Settings now writes as well as reports.
Remaining: Campaigns, Automations — neither started.
Nothing is in progress mid-edit.

**Interface development is currently PAUSED** — see "Interface Development Paused" above and
"Live Messaging Feature Checkpoint" at the end. Do not resume the broader interface
implementation until explicitly instructed.

### The user's 15-stage order, mapped to code (as at 2026-08-26)

| Stage | Requirement | State |
| --- | --- | --- |
| 1 | Audit repository and existing WhatsApp architecture | COMPLETE |
| 2 | WhatsApp-specific application shell | COMPLETE |
| 3 | Responsive overview dashboard | COMPLETE |
| 4 | Conversation list | COMPLETE |
| 5 | Active chat interface | COMPLETE |
| 6 | Contact details panel | COMPLETE |
| 7 | Connect UI to existing live WhatsApp data | COMPLETE |
| 8 | Reliable message statuses | COMPLETE (raw Meta string shown in the thread; humanising it is cosmetic) |
| 9 | Notes, labels, and assignment | **PARTIALLY COMPLETE — blocked.** `assigned_to` exists and is shown read-only; `notes` and `labels` have no columns, and the panel says so instead of mocking inputs. Needs an additive migration the user must apply by hand. |
| 10 | Contacts page | COMPLETE |
| 11 | Quick Replies | COMPLETE (migration now applied) |
| 12 | Templates | COMPLETE |
| 13 | Analytics dashboard | COMPLETE (Increment 8) |
| 14 | Campaign foundation | NOT STARTED |
| 15 | Automation architecture | NOT STARTED |

Stage 9 is the only genuinely unfinished earlier stage, and it is blocked on the same
kind of hand-applied migration as Stage 11 — not on code.

Settings is not one of the user's 15 stages. It was built as Increment 9 because it was
the lightest remaining route and it makes the two migration blockers (Stages 9 and 11)
visible in the UI instead of only in this document. Increment 10 then made it editable,
because a page called Settings that cannot set anything is a report, not a setting.

## Session recovery log — 2026-08-26

The 2026-08-25 session ended mid-stream. Two things had to be recovered before any new
code, both diagnosed from `main` rather than memory:

1. **This document had been lost in a merge.** It exists in `052eed7` and `c07a376` but
   was dropped by merge commit `01ac25f` (parents `79bdbdc` + `c07a376`). It is not
   gitignored — the merge simply resolved it away. Restored with
   `git show c07a376:docs/whatsapp-platform-progress.md > docs/whatsapp-platform-progress.md`.
   **If a future session finds no progress doc, check the merge parents before assuming
   no work was recorded.**
2. **A second, orphaned console shell was sitting in the tree.** Commit `052eed7`
   ("Save current main workspace changes") carried main's stale pre-merge edits into
   history: 1,541 lines across `src/components/whatsapp/layout/**` (6 files) and
   `src/lib/whatsapp/admin/**` (4 files). It was a competing architecture
   (`supabase-js createClient` + a `ShellSummary` type) against the live PostgREST
   `data.ts`, and its own `layout/nav.ts` linked to six routes that did not exist
   (`/overview/`, `/campaigns/`, `/automations/`, `/analytics/`, `/webhook/`,
   `/settings/`). Confirmed unreferenced by two independent greps — path imports and
   every exported basename — plus `git log --diff-filter=A`. It typechecked and held no
   secrets; it was simply dead. **Deleted** with the user's explicit approval. Recoverable
   from `052eed7` if ever needed.

Verified against code at the same time: 120/120 WhatsApp tests passing, `tsc --noEmit`
clean, eslint 0 problems on the WhatsApp paths, route-governance entries matching the six
real routes exactly, and `.env.example` already documenting every WhatsApp/Meta/Supabase
variable. No mock data, no `NEXT_PUBLIC_*` in WhatsApp code, no secret env read inside any
`"use client"` file.

## RESOLVED: both migrations have been applied

Confirmed by the user on 2026-08-26: **both SQL files were run in the Supabase SQL editor**,
and **`WHATSAPP_BUSINESS_ACCOUNT_ID` is set in Vercel production**.

- `supabase/migrations/202608250001_whatsapp_quick_replies.sql` — applied. Stage 11 is no
  longer runtime-blocked; `/admin/whatsapp/quick-replies` can read and write.
- `supabase/migrations/202608260001_whatsapp_settings.sql` — applied. Increment 10 is no
  longer runtime-blocked; the Settings page can save.

`/admin/whatsapp/settings` reports both tables, so this is verifiable in the UI rather than
only here. Note the console reads Supabase with the **service-role key**, which is not
available in this local environment — so a *local* run may still show "—" even though the
tables exist. Check production, or the Settings page's table probe, not local page output.

### The historical blocker, kept for context

Investigated on 2026-08-25. **Vercel was not a route to these secrets**, which is why the
migrations had to be applied by hand:

1. **Vercel redacts "Sensitive" variables.** `vercel env pull` writes the literal string
   `[SENSITIVE]` for them — they are write-only by design. `SUPABASE_SERVICE_ROLE_KEY` and
   `INTERNAL_TOOL_SESSION_SECRET` both come back redacted, so they **cannot** be recovered
   from Vercel by any CLI call. (An earlier attempt appended those placeholders into
   `.env.local`; they were detected and removed. If you ever see a var whose value is
   literally `[SENSITIVE]`, that is the cause.)
2. **`DATABASE_URL` / `POSTGRES_URL` / `PGHOST` point at `neon.tech`, NOT Supabase.**
   The Supabase project ref does not appear in them, and `NEON_PROJECT_ID` is set. There
   are two databases in this project. **Running a migration against `DATABASE_URL` would
   create the table in the wrong database.** The WhatsApp tables are in Supabase
   (`supabase.co`), reached via PostgREST with the service-role key.
3. PostgREST cannot execute DDL, so the service-role key alone would not run a migration
   even if it were readable.

**Do NOT run `supabase db push`.** `supabase/migrations/` holds the TikTok scheduler
migrations (`202608210001`, `202608210002` — which creates cron jobs — `202608210003`,
`202608230001`, `202608240002`). The remote has no CLI migration history, so a push would
try to apply those too, crossing the do-not-touch boundary. Every future WhatsApp migration
follows the same route: write the file, ask the user to run it in the SQL editor, and make
the code degrade to a documented default until it exists.

Still true locally: to make Supabase-backed pages (Overview metrics, Conversations,
Contacts) show real data here instead of "—", `SUPABASE_SERVICE_ROLE_KEY` would have to be
added to the worktree `.env.local` (Supabase dashboard → Project Settings → API).


## Env vars: check `.env.local`, not just `src/`

`WHATSAPP_BUSINESS_ACCOUNT_ID` **is configured** in `.env.local`. An earlier pass
grepped only `src/` for it, found no references, and wrongly reported Templates as
blocked on a missing variable — it was set all along, just not yet used by any code.
**"Not referenced in code" ≠ "not configured."** Check `.env.local` (names only —
never print values) before declaring an integration blocked.

Confirmed live against Meta on 2026-08-25 (probe script written, run, then deleted):
- Business account resolves: **"Web Growth Digital Services"**, id matches config.
- Templates endpoint returns **1** template: `hello_world` · APPROVED · UTILITY · en_US.
- Full WhatsApp/Meta vars present in `.env.local`: `WHATSAPP_ACCESS_TOKEN`,
  `WHATSAPP_API_VERSION`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_PHONE_NUMBER_ID`.
  (`META_APP_SECRET` is read by the webhook — verify separately before relying on it.)

## Migrations must also be applied to Supabase by hand

Increment 5 added `supabase/migrations/202608250001_whatsapp_quick_replies.sql`. There is
no migration runner wired into the build or deploy, so **the SQL file alone does not create
the table** — it has to be run against the Supabase project (SQL editor or CLI). Until it
is, `/admin/whatsapp/quick-replies` reads an empty list and saving returns an error.
Record every new migration in `docs/WHATSAPP-INTEGRATION.md` under "Database" as well.

## NEVER run `npm run build` while `npm run dev` is running

Both write the same `.next/` directory, so a production build clobbers the dev
server's chunks and every dev request then 500s with
`Cannot find module './383.js'` from `.next/server/webpack-runtime.js` (or a
`segment-explorer-node.js#SegmentViewNode` manifest error). **It is not a code bug.**
Fix: stop dev, `rm -rf .next`, restart dev. Verify order that works: run tests →
tsc → eslint → stop dev → build → restart dev → curl smoke test.

## CRITICAL build rule — register every new page

`scripts/validate-sitemap.mjs` runs inside `npm run build` and walks every
`src/app/**/page.tsx`. Line ~156: **`if (!governedPageRoutes.has(route)) fail("Ungoverned
App Router page")`**. So **every new page you add MUST get an entry in
`src/lib/route-governance.json`** or the build fails. Console pages use:
`{ "path": "/admin/whatsapp/<name>/", "status": "NOINDEX", "sitemap": false, "reason": "..." }`.
Adding WhatsApp entries there is safe — `publicPages.test.ts` only asserts the
scheduler entries, which must not be touched.

## Where this work lives (IMPORTANT for resume)

- **Working tree:** the repo root, `c:\Users\HomePC\Documents\Web Growth\webgrowth-info`.
- **Branch: `main`.** The user's standing instruction is that all WhatsApp work happens
  directly on `main` — **do not create another branch, worktree, or workspace.**
- **Historical note (this changed).** Increments 1–8 were carried out on
  `codex/whatsapp-admin-access` in the worktree `.worktrees/codex-whatsapp-admin-access`.
  That branch was merged and `main` is now ahead of it — the worktree still exists on disk at
  `c07a376` but is **stale**. Ignore it. If you find yourself reading files there, you are in
  the wrong tree.
- `.codex-temp/` is Codex's scratch area (it contains a `node_modules.broken-install`
  tree). **Never touch it.** It is the source of ~814 pre-existing `npm run lint` findings;
  lint only the app's own paths.

## The task (what the user asked for)

Redesign the `/admin/whatsapp` interface into a clean, professional, mobile-and-
desktop-friendly WhatsApp business-communication console, following two supplied
mockups (Overview Dashboard + 3-column Conversations/Inbox) and the Growth Ledger
design system. Build a reusable responsive app shell (deep-green sidebar + top
bar + mobile drawer). Later grows toward a broader automation platform. Build
incrementally with checkpoints; **do not change functionality** — this is a
visual/structural redesign on top of an already-working integration.

## PIVOTAL CONTEXT — functionality is already built

The initial audit was done against `main` (a single dark lead-queue table). But
this branch is **5 commits ahead** and already ships a working inbox. So the job
is a **reskin + app shell**, not new backend features.

Already built & working on this branch (MUST be preserved exactly):
- Auth gate `hasWhatsAppAdminAccess` + `InternalUtilityUnlockForm` when locked.
- Lead queue with 7 filters (`ALL/HOT/WARM/REVIEW/PRICING/MEETING/PROPOSAL`) + counts.
- Selected-conversation detail (intent, status, last contact, review flag).
- Full message thread from `whatsapp_messages` (inbound/outbound + delivery status).
- Audio playback of voice notes via `/api/admin/whatsapp/media/[mediaId]`.
- `ReplyComposer` — text reply + voice-note record/upload → `/api/admin/whatsapp/reply`
  and `/api/admin/whatsapp/reply/audio`; respects the 24h service window & sender config.
- `AutoRefresh` — 10s polling, browser notifications + in-page mobile alerts, pauses
  while typing/hidden, via `/api/admin/whatsapp/notifications`.
- Pure logic in `dashboard.ts`: `filterWhatsAppLeads`, `buildWhatsAppDashboardModel`,
  `buildWhatsAppReplyComposerState` (all test-covered).

## Design system (reuse — do NOT invent new tokens)

Growth Ledger, light/paper identity. Tailwind v4 `@theme` in `src/app/globals.css`
(no tailwind.config.js). Tokens are exposed as Tailwind color utilities:
- Sidebar / dark surfaces: `ledger-deep #0c3327`, `ledger #124a38`, `ink-ground #0e1a14`.
- Canvas: `paper #eff1ec`, cards `paper-raised #f7f8f4`, sunk `paper-sunk #e4e7de`.
- Text: `ink #14140f`, `ink-soft #454a3f`, `ink-faint #737868`; on dark: `on-dark #eaebe4`, `on-dark-soft #9aa292`.
- Accents: `ledger-bright #1c7a54` (green), `brass #b4802f` (gold); tints `ledger-tint`, `brass-tint`.
- Rules/borders: `rule #d2d6cb`, `rule-strong #b7bbae`.
- Fonts: `font-sans` (Inter), `font-display` (Fraunces), `font-mono` (IBM Plex Mono).
- Utilities available: `.wg-card`, `.wg-btn`/`-primary`/`-secondary`/`-ghost`, `.wg-eyebrow`, `.wg-rule`.
- Stock Tailwind slate/blue/indigo/violet/purple/sky/cyan are remapped to ledger green
  and amber→brass. `rose-*` is NOT remapped, so it is the honest choice for HOT/alert states.

## Approved decisions (from the user)

1. **Foundation shell first** (smallest safe checkpoint), then Overview. ✅ done.
2. **Icons:** originally approved as `lucide-react`. **Changed** — see decision below.
   Chart for Increment 2 is still a hand-rolled inline SVG (no charting library).
3. **Git:** work in the existing worktree/branch `codex/whatsapp-admin-access`. ✅

## Architecture decisions

- **Icons are local inline SVG** (`src/components/whatsapp/icons.tsx`), not
  `lucide-react`. Reason: the npm install was blocked at the time, and the console
  needs ~14 glyphs — a local set adds zero dependency, zero bundle cost, and keeps a
  single stroke weight. It also honours the brief's "don't install unnecessary
  packages". Swapping to lucide later is a one-file change.
- **Server components fetch; client leaves poll.** Keep the existing pattern
  (service-role REST reads server-side; `AutoRefresh` client polling). No realtime
  (RLS has no policies, no browser DB client). Secrets stay server-side — the layout
  passes only a `senderConnected` **boolean** to the client shell, never credentials.
- **App shell** is `src/components/whatsapp/WhatsAppShell.tsx`, mounted from
  `src/app/admin/whatsapp/layout.tsx`. The layout re-checks auth and, when locked,
  renders the unlock form **instead of** children (no shell). `page.tsx` keeps its own
  `hasWhatsAppAdminAccess` gate for defence-in-depth and because `dashboard.test.ts`
  asserts that reference exists.
- **The unlock form is left untouched.** `InternalUtilityUnlockForm` is dark-styled and
  shared with another internal utility, so the locked screen keeps its dark
  `bg-[#050806]` treatment rather than restyling a shared component.
- **Nav honesty:** `nav.ts` marks each route `live` or `soon`. Only `live` routes render
  as links; `soon` routes render disabled with a "Soon" chip, so the shell never links
  to a 404 or implies a feature exists. Today only `/admin/whatsapp` is live.
- **Marketing chrome on `/admin`:** the root `layout.tsx` rendered the marketing
  `Header`/`Footer` on every route inside `<main className="pt-28">`. Two small client
  helpers in `src/components/SiteChrome.tsx` (`PublicChromeOnly`, `SiteMain`) hide that
  chrome and drop the top offset on `/admin/*` only. `Footer` stays a server component
  (passed as children). Verified: all public pages still prerender static.
- **No route churn in Increment 1.** The inbox stays at `/admin/whatsapp` so every
  existing link, `getFilterHref`/`getLeadHref`, and bookmark keeps working. Increment 2
  moves the inbox to `/admin/whatsapp/conversations` and makes the root the Overview.
- **No invented data.** There is no env var for the sender's display number (only
  `WHATSAPP_PHONE_NUMBER_ID`), so the sidebar shows verifiable connection status only.
  The `senderNumber` prop exists for when the Phone Numbers page fetches it for real.

## Increment plan

- **Increment 1 — foundation. ✅ COMPLETE (verified).** Inline icon set; responsive
  shell (deep-green sidebar, sticky top bar, mobile drawer with Escape + scroll lock +
  close-on-navigate); inbox restyled dark→light Growth Ledger; new mobile card list for
  leads (the 980px table now only loads at `lg+`); marketing chrome suppressed on
  `/admin`. Zero behaviour change.
- **Increment 2 — Overview dashboard. ✅ COMPLETE (verified).** Inbox moved to
  `/admin/whatsapp/conversations`; the root is now the Overview. Real metric cards,
  a hand-rolled inline-SVG sent-vs-received chart (14 UTC days), integration status
  from server config, recent conversations, quick actions into filtered inbox views,
  and an honest "not built yet" campaigns card. Counts that cannot be read render as
  "—", never a fabricated 0.
- **Increment 3 — Conversations polish. ✅ COMPLETE (verified).** The inbox is now the
  mockup's 3-column layout (list | thread | contact details) on desktop and shows exactly
  one panel at a time on phones. Chat-bubble thread on a dotted canvas, per-column
  scrolling, and the composer pinned below the thread. All prior behaviour intact.
- **Increment 4 — Contacts. ✅ COMPLETE (verified).** `/admin/whatsapp/contacts` lists
  `whatsapp_contacts` with real columns only, temperature filter chips with counts, a
  no-JavaScript search, desktop table + mobile cards, and a link into each contact's
  conversation where one exists.
- **Increment 5 — Quick Replies. ✅ COMPLETE (verified).** New `whatsapp_quick_replies`
  table, a manage page with create/edit/delete, and insert-into-composer buttons in the
  inbox. First admin write path beyond replies.
- **Increment 6 — Templates. ✅ COMPLETE (verified).** `/admin/whatsapp/templates` reads
  live from Meta's Graph API server-side and renders each template as a phone-style
  preview (header, body, footer, buttons) with category, language, and placeholders.
  Read-only by design.
- **Increment 7 — Phone Numbers. ✅ COMPLETE (verified).** `/admin/whatsapp/phone-numbers`
  reads the account's numbers live from Meta: quality rating, messaging limit, verification,
  account mode, display-name status, platform, throughput, webhook URL, and phone number ID.
  The deployment's configured sender is badged. **This also closed the two gaps deliberately
  left earlier** — the Overview's integration card now shows the real sender number, quality
  rating, and messaging limit, and the shell sidebar shows the real display number.
- **Increment 8 — Analytics. ✅ COMPLETE (verified).** `/admin/whatsapp/analytics` reports
  volume, delivery, response time, and new-contact quality over a 7/30/90-day range, all
  derived from stored messages. No Meta Insights call, no charting dependency, and every
  rate is blank rather than 0% when there is nothing to divide by.
- **Increment 9 — Settings. ✅ COMPLETE (verified).** `/admin/whatsapp/settings` reports
  which environment variables are set, which capabilities that leaves available, whether
  Meta still accepts the token, which tables actually exist, and how the console is gated.
  Read-only. Secrets are reported as set/missing and never displayed — a test enforces it.
- **Increment 10 — editable console settings. ✅ COMPLETE (verified).** Settings now
  writes a single-row `whatsapp_settings` jsonb document and three consumers read it:
  lead-scoring keywords (hot / warm / spam) layered over the built-in classifier on the
  receive path, business hours + a first-reply target, and console preferences (activity
  window, inbox refresh interval). Connection status is demoted to a section below the
  controls. Every failure mode falls back to documented defaults.
- **Later** — Campaigns, Automations
  (each its own increment, additive migrations only, honest empty states until wired).

## Increment 10 notes

- **Why this exists.** The user's objection was exact: "why is it a settings page if i can
  not actually set something?" Increment 9 shipped a readiness report under a name that
  promises control. This increment gives it control over things that are ours to control —
  nothing here can touch Meta or the environment, and the page says so.
- **One jsonb document, not a column per setting.** Migrations here are applied by hand in
  the Supabase SQL editor (see the BLOCKED section), so every new setting must not cost
  another migration. `whatsapp_settings` is a single row (`id = 'default'`, enforced by a
  check constraint) holding one `settings` object. Validation lives in TypeScript
  (`validateWhatsAppSettingsInput`) where it is unit-testable, not in the schema.
- **Keywords are additive, never a replacement.** `applyWhatsAppLeadKeywords` runs *after*
  the built-in classifier: spam beats hot beats warm, hot forces a safe acknowledgement,
  warm only lifts COLD, and intent is never rewritten. An empty or cleared list behaves
  identically to no rules at all — a test asserts absent and empty rules agree — so a
  keyword list cannot break classification, and every pre-existing `classify.test.ts`
  assertion still holds.
- **Matching is on word edges** (`(?<![a-z0-9])…(?![a-z0-9])`), so "art" does not fire
  inside "start". Without this, a short keyword silently mis-scores half the inbox.
- **A spam keyword suppresses the auto-reply, it does not discard the message.** The
  webhook still stores it. Dropping inbound messages on an operator-typed keyword would be
  a data-loss bug wearing a feature's clothes.
- **The receive path does not hit the database per message.** `loadWhatsAppSettings` caches
  in-process for 60s. Every failure — table absent, 500, network throw, no seed row —
  resolves to `WHATSAPP_DEFAULT_SETTINGS`, each with its own test.
- **The settings page reads with `maxAgeMs: 0`.** An editor must show what is actually
  stored, not a copy up to a minute old.
- **Timezones are computed locally, not borrowed.** All the timezone machinery in this repo
  lives in `src/lib/scheduler/*`, which is TikTok-owned. `getWhatsAppLocalTimeParts` is a
  small WhatsApp-local `Intl.DateTimeFormat` helper instead, per the user's "prefer a
  WhatsApp-specific version rather than risky cross-product refactoring".
- **`settingsModel.ts` was renamed `integrationModel.ts`.** With a real settings document
  in the codebase, "settingsModel" meant the wrong thing — that file is about the hosting
  environment. `whatsapp_settings` was added to `WHATSAPP_EXPECTED_TABLES` so the same page
  reports whether its own storage exists.
- **The refresh interval is clamped client-side too** (`resolveWhatsAppInboxRefreshMs`,
  5–300s). A hand-edited settings document must not be able to poll the notifications
  endpoint every few milliseconds.
- **Fixed while here:** the settings page had a second `<h1>` competing with the one the
  shell already renders.

## Increment 9 notes

- **The model is `settingsModel.ts`**, following the same suffix rule as
  `analyticsModel.ts` / `contactsModel.ts` / `quickRepliesModel.ts`.
- **The display rule is mechanical, not a judgement call at each render site.** Every row
  carries a `kind`: `secret` rows always have `value: null`, `identifier` and `option` rows
  carry their value. A test builds rows from an env where every secret is the literal
  `LEAKED-SECRET-VALUE` and asserts that string appears nowhere in
  `JSON.stringify(rows)`. If someone later adds a masked-preview field, that test fails.
- **Identifiers are shown in full; secrets never are.** `WHATSAPP_PHONE_NUMBER_ID`,
  `WHATSAPP_BUSINESS_ACCOUNT_ID`, and `SUPABASE_URL` are configuration — they cannot send
  or read anything on their own, and the Phone Numbers page already displays phone number
  ids. The access token, app secret, verify token, and service role key are reported as
  set/missing and nothing more: no prefix, no last-4, no length.
- **Resolution order mirrors production exactly.** `resolveWhatsAppGraphApiVersion` and
  `resolveWhatsAppVerifyTokenSource` replicate the fallback chains in `send.ts`,
  `phoneNumbers.ts`, and `api/whatsapp/webhook/route.ts`. If those ever diverge, Settings
  would report a configuration the app is not using — worse than reporting nothing. Both
  chains are covered by tests naming the file they mirror.
- **Capabilities map missing variables onto symptoms.** "META_APP_SECRET is missing" means
  little; "every inbound webhook is rejected as unsigned, so no message arrives" is the
  thing the operator is already looking at. A test asserts no consequence string contains
  a `WHATSAPP_` variable name, which keeps them written as symptoms.
  Verified against the code: an empty app secret makes `isValidMetaSignature` return false
  (webhook.ts:35) → 401 on every POST; an empty verify token makes `verifyWebhook` return
  403 on the handshake (webhook.ts:28).
- **`probeWhatsAppTable` was added to `data.ts` rather than reusing `readWhatsAppRows`.**
  That helper collapses "table does not exist" and "database unreachable" into `null`,
  which is right for rendering data and useless for diagnosing configuration. The probe
  reads the status code and treats 404 / `PGRST205` / `42P01` as a missing table. This is
  what surfaces the unapplied quick-replies migration directly in the UI.
- **The one live check is the cached Graph read.** Presence of a token is not proof it
  still works, so Settings reuses `fetchWhatsAppPhoneNumbers({ revalidateSeconds: 300 })` —
  the same cached call the overview already makes, so the page adds no new Graph traffic.
  Reasons are mapped to plain sentences; no provider response body is rendered.
- **The console-pages list reads `WHATSAPP_NAV_SECTIONS`** instead of restating routes, so
  it cannot drift from the nav. Links append a trailing slash because nav hrefs omit it and
  `trailingSlash: true` would otherwise 308.
- The webhook endpoint is shown **for reference only**, with a note that whatever is already
  registered at Meta is what receives traffic. Settings must never imply the operator should
  go change a working subscription.

## Increment 8 notes

- **The model is `analyticsModel.ts`, not `analytics.ts`.** A file named `analytics.ts`
  beside a route directory named `analytics/` makes `../analytics` resolve ambiguously
  (file vs directory index). The repo already solves this with `contactsModel.ts` beside
  `contacts/` and `quickRepliesModel.ts` beside `quick-replies/` — follow that suffix
  whenever a model shares a name with a route folder.
- **The real `delivery_status` vocabulary was confirmed before it was modelled.**
  `src/lib/whatsapp/webhook.ts` pushes `item.status` **verbatim** from Meta's
  `value.statuses[]`, and `store.ts:198` PATCHes it straight into the column. So stored
  values are Meta's own `sent` / `delivered` / `read` / `failed`, and **null** until a
  status webhook lands. `queued` is our label for that null; `unknown` catches anything
  Meta adds later (degrade-don't-throw, same rule as template statuses).
- **`read` counts toward the delivered rate** — a message that was opened necessarily
  reached the handset. Meta overwrites the status as it progresses, so each outbound row
  belongs to exactly one bucket and the buckets partition the total (asserted in a test).
- **Response time is per conversation.** An inbound message opens a wait that the next
  outbound message closes; a run of consecutive inbound messages collapses into one wait
  timed from the first, because a customer sending three messages is asking one question.
  Pairs where the reply predates the question are dropped (clock skew, not a negative
  duration). **Median is reported next to the average** — one overnight reply wrecks a mean
  at this volume.
- **Rows are read newest-first with a 20,000 cap.** Analytics needs the ordered sequence
  inside each conversation, so it cannot aggregate in SQL. Ordering `desc` means a capped
  read loses the oldest days rather than the days an admin is actually looking at, and the
  page says so in a banner instead of silently under-reporting.
- **`?days=` is whitelisted, never interpolated.** `resolveWhatsAppAnalyticsRange` only
  ever returns 7, 30, or 90; anything else becomes the 30-day default before it can reach
  a PostgREST query string.
- The chart reuses `overview.ts`'s `buildWhatsAppActivitySeries` and
  `buildWhatsAppChartGeometry` unchanged — same UTC-day buckets, same hand-rolled SVG, so
  the Overview and Analytics charts can never disagree.

## Increment 7 notes

- **Field list verified live before coding.** A throwaway probe (written, run, deleted)
  confirmed all twelve fields — including `webhook_configuration` — are returned together
  by `GET /{business-account-id}/phone_numbers?fields=…`. Requesting an unsupported field
  400s the whole call, so **probe before adding one**.
- Live values on the connected account as of 2026-08-25: quality `GREEN`, tier `TIER_250`,
  `code_verification_status: VERIFIED`, `account_mode: LIVE`, `platform_type: CLOUD_API`,
  `throughput.level: STANDARD`, `is_official_business_account: false`, webhook pointing at
  `https://webgrowth.info/api/whatsapp/webhook/`.
- **Graph calls are cached where they repeat.** `fetchWhatsAppPhoneNumbers` takes
  `revalidateSeconds`; the Overview uses 300s and the **layout uses 600s** because the
  layout renders on every console page and must not cost a Meta round trip per navigation.
  Omitting the option gives `cache: "no-store"` (the Phone Numbers page itself).
- The layout's Graph call is wrapped so a failure only omits the sidebar number — it can
  never block a page from rendering.
- `describeWhatsAppMessagingTier` falls back to the raw tier string, so a tier Meta adds
  later is displayed rather than silently hidden. Same principle as template statuses.
- Watch out: `src/app/admin/whatsapp/page.tsx` already had a local `sender` from
  `getWhatsAppSenderConfig()`; the phone-number lookup is named `senderNumber` to avoid
  shadowing it.


## Increment 6 notes

- **Lives in `src/lib/whatsapp/templates.ts`**, beside `send.ts`, because it calls Meta
  rather than Supabase. It follows `send.ts`'s injectable `env`/`fetch` shape, so all 11
  tests run with no network.
- **The token goes in the Authorization header, never the query string** — there is an
  explicit test asserting the token does not appear in the request URL.
- **Never import this into a client component.** The browser must not hold Meta
  credentials; the page is a server component and passes only rendered output down.
- **Four honest states** instead of one blank page: `NOT_CONFIGURED` (names the two env
  vars), `PERMISSION_DENIED` (token rejected or missing scope), `API_ERROR` (Meta
  unreachable), and an approved-but-empty list. Graph error bodies are logged
  server-side and never shown to the browser.
- **Unknown values degrade rather than throw** — a new template status or component type
  (e.g. `CAROUSEL`) normalizes to `"UNKNOWN"` and still renders, so a Meta change cannot
  500 the page. Tested.
- Approved templates sort first, then alphabetically, so the usable ones lead.
- Template *sending* is deliberately absent: that is Campaigns' job, and it needs the
  outbound-template send path plus rate/consent thinking. The page says so.


## Increment 5 notes

- **Migration** `202608250001_whatsapp_quick_replies.sql`: one new table, `if not exists`
  throughout, RLS enabled with **no policies** (service-role only), CHECK constraints on
  shortcut format and title/body length. Additive and reversible — it creates nothing that
  existed and alters no existing table. **It still has to be run against Supabase by hand.**
- **Validation is duplicated on purpose.** `quickRepliesModel.ts` mirrors the SQL CHECK
  constraints so the user sees "Keep the title under 80 characters" instead of a Postgres
  error. If you change the constraint, change the model (and its tests) in the same commit.
- **Write path** is `/api/admin/whatsapp/quick-replies` (POST/PATCH/DELETE), following the
  reply route exactly: `hasWhatsAppAdminAccess` → 401, then `isSameOriginMutation` → 403
  for CSRF. **Copy that pair into every future mutation route.**
- **Postgres error text never reaches the browser.** `mutateWhatsAppRest` logs the real
  code/message server-side and returns a generic "The change could not be saved.", except
  unique violations (`23505`) which map to a clear duplicate-shortcut message.
- **Quick replies only fill the textarea.** `insertQuickReply` appends to the composer's
  local state; sending still goes through the existing reply route, the 24-hour window, and
  the sender-configured check. No new send path was created.
- `ReplyComposer`'s `quickReplies` prop is optional and defaults to `[]`, so the component
  works anywhere it is mounted without one.


## Increment 4 notes

- **Search is injection-safe by construction.** `sanitizeWhatsAppSearchTerm` strips every
  character with meaning inside a PostgREST filter (`,` `(` `)` `*` `%` quotes, backslashes,
  control chars), keeps what people actually search with (letters, digits, space, `@ . _ - +`),
  and caps length at 64. `buildWhatsAppContactSearchFilter` then builds the
  `or=(...)` fragment URL-encoded. A test asserts a hostile term
  (`x),lead_status.eq.open,(y`) cannot escape. **Never interpolate raw user input into a
  PostgREST query** — route it through these helpers.
- **Search needs no client JavaScript** — it is a plain `<form method="get">`, so the page
  stays a server component and the query lives in the URL.
- **The temperature filter is whitelisted** (`isWhatsAppContactFilter`) before reaching
  `lead_temperature=eq.…`, so that value can never be attacker-controlled either.
- **Embedded conversation shape.** PostgREST may return an embedded row as an object or a
  single-element array depending on how it resolves the relationship, so
  `normalizeWhatsAppContactRow` accepts both (tested both ways).
- **Naming:** the model module is `contactsModel.ts`, deliberately NOT `contacts.ts`,
  because a `contacts/` route directory sits beside it — `contacts.ts` would resolve fine
  today but silently lose to `contacts/index.ts` if anyone ever added one.
- **Result cap is disclosed.** The query pulls at most `WHATSAPP_CONTACT_PAGE_SIZE` (200)
  rows ordered by `updated_at.desc`; when that cap is hit the page says so and points at
  search, rather than silently truncating.


## Increment 3 notes

- **Layout modes.** `nav.ts` now carries an optional `layout: "scroll" | "fill"` per nav
  item, read by the shell through `getWhatsAppLayoutMode(pathname)`. Only the inbox is
  `"fill"`: the shell root becomes `h-dvh overflow-hidden` so the three columns scroll
  independently. Every other page stays `min-h-dvh` and scrolls normally. `h-dvh` (not
  `h-screen`) so mobile browser chrome does not clip the composer.
- **Mobile panels are URL-driven, not client state.** `?lead=` selects the thread and
  `?panel=contact` the details panel; with neither, the list shows. So the browser back
  button walks list → thread → details, and any panel is linkable. Desktop ignores this
  and always renders all three via `lg:flex`.
- **Deliberate distinction:** `buildWhatsAppDashboardModel` still defaults `selectedLead`
  to the first row (desktop shows a thread immediately), but the *mobile* panel choice
  keys off the raw `params.lead`, so a phone opens on the list instead of jumping into a
  conversation. Don't "simplify" these into one value.
- **New real columns surfaced.** The conversation query now also selects
  `first_message_at`, `assigned_to`, and contact `business_name`, `email`, `phone`. These
  are all real schema columns (see `202608130001_whatsapp_crm.sql`); nulls render as "—".
  `WhatsAppLeadRow` gained them as optional fields, so existing test fixtures still typecheck.
- **Notes/labels are still absent on purpose.** The mockup shows them but the schema has
  no columns for them. The panel says so rather than faking content. They need an additive
  migration in their own increment.
- **Composer** was slimmed (3-row textarea, tighter padding, no outer card) because it is
  now pinned under the thread inside a `max-h-[55%] overflow-y-auto` container.
  Presentational only — no logic touched.


## Increment 2 notes

- **Data layer:** `src/app/admin/whatsapp/data.ts` centralises service-role PostgREST
  reads. `countWhatsAppRows` uses `Prefer: count=exact` + `Range: 0-0` and reads the
  total from `Content-Range`. Read failures return **`null`, not 0**, so the UI can
  distinguish "unavailable" from a real zero — `formatWhatsAppMetric` renders `null` as "—".
- **Chart:** `overview.ts` holds pure geometry (`buildWhatsAppActivitySeries`,
  `buildWhatsAppChartGeometry`) with 11 tests, including the all-zero series (no divide
  by zero), single-point, and empty cases. Bucketing is by **UTC day** — matching the
  `timestamptz` columns and keeping tests deterministic regardless of machine timezone.
- **Env name gotcha:** the webhook signature secret is **`META_APP_SECRET`**, not
  `WHATSAPP_APP_SECRET`. Verify a name against its consumer before reporting on it.
- **Phone-number facts intentionally absent.** Quality rating, messaging limits, and the
  sender's display number are Graph API data; the Overview shows only what is verifiable
  from config (credentials present, verify token, app secret, API version, last activity).
- **Dev-server flake:** right after moving a route file, Next's dev bundler can throw
  `Could not find the module ... segment-explorer-node.js#SegmentViewNode` and 500 once.
  It self-heals on the next request (verified 200 after). The production build is the
  authoritative check.


## Files created (this redesign)

- `docs/whatsapp-platform-progress.md` (this file)
- `src/components/whatsapp/icons.tsx` — local inline SVG icon set
- `src/components/whatsapp/nav.ts` — nav model + pure path/active/meta helpers
- `src/components/whatsapp/nav.test.ts` — 8 tests for those helpers + chrome gating
- `src/components/whatsapp/WhatsAppShell.tsx` — the responsive console shell (client)
- `src/components/SiteChrome.tsx` — `isConsoleRoute`, `PublicChromeOnly`, `SiteMain`
- `src/app/admin/whatsapp/layout.tsx` — auth-aware console layout
- `src/app/admin/whatsapp/data.ts` — service-role PostgREST reads + exact-count helper
- `src/app/admin/whatsapp/overview.ts` — pure overview model + hand-rolled SVG geometry
- `src/app/admin/whatsapp/overview.test.ts` — 11 tests for the model and chart maths
- `src/app/admin/whatsapp/conversations/page.tsx` — the inbox (moved from the root, via `git mv`)
- `src/app/admin/whatsapp/contactsModel.ts` — contact model + injection-safe search helpers
- `src/app/admin/whatsapp/contactsModel.test.ts` — 12 tests incl. a search-injection test
- `src/app/admin/whatsapp/contacts/page.tsx` — the contact directory
- `src/app/admin/whatsapp/quickRepliesModel.ts` — quick-reply model + validation
- `src/app/admin/whatsapp/quickRepliesModel.test.ts` — 9 tests for slug/validation rules
- `src/app/admin/whatsapp/QuickReplyManager.tsx` — create/edit/delete UI (client)
- `src/app/admin/whatsapp/quick-replies/page.tsx` — the quick-replies page
- `src/app/api/admin/whatsapp/quick-replies/route.ts` — POST/PATCH/DELETE, auth + CSRF
- `supabase/migrations/202608250001_whatsapp_quick_replies.sql` — the new table
- `src/lib/whatsapp/templates.ts` — Graph API template reads + pure helpers
- `src/lib/whatsapp/templates.test.ts` — 11 tests, no network required
- `src/app/admin/whatsapp/templates/page.tsx` — the template list
- `src/app/admin/whatsapp/analyticsModel.ts` — pure analytics model (range whitelist,
  delivery breakdown, response times, totals, duration/rate formatting)
- `src/app/admin/whatsapp/analyticsModel.test.ts` — 20 tests, no network or database
- `src/app/admin/whatsapp/analytics/page.tsx` — the analytics page
- `src/app/admin/whatsapp/settingsModel.ts` — pure settings model (env presence, resolution
  chains, capability mapping, webhook URL); never returns a secret value.
  **Renamed `integrationModel.ts` in Increment 10.**
- `src/app/admin/whatsapp/settingsModel.test.ts` — 20 tests incl. the secret-leak invariant.
  **Renamed `integrationModel.test.ts` in Increment 10.**
- `src/app/admin/whatsapp/settings/page.tsx` — the settings page
- `src/lib/whatsapp/settings.ts` — the operator-editable settings model: keyword
  normalization and word-edge matching, the additive lead-scoring override, timezone-aware
  business hours, target comparison, parsing, clamping, and validation. Pure.
- `src/lib/whatsapp/settings.test.ts` — 29 tests, fixed-instant timezone assertions
- `src/lib/whatsapp/settingsStore.ts` — the 60s-cached read, the upsert write, and the
  fallback-to-defaults behaviour for every failure mode
- `src/lib/whatsapp/settingsStore.test.ts` — 13 tests via a recording `fetch` stub,
  including one asserting a failed write leaks no schema detail to the operator
- `src/app/api/admin/whatsapp/settings/route.ts` — PUT, auth + same-origin CSRF guard
- `src/app/admin/whatsapp/SettingsEditor.tsx` — the editable form (client)
- `supabase/migrations/202608260001_whatsapp_settings.sql` — the single-row settings table

## Files modified (this redesign)

- `src/app/admin/whatsapp/page.tsx` — **now the Overview dashboard** (was the inbox).
- `src/app/admin/whatsapp/conversations/page.tsx` — restyled to light theme + mobile card
  list; imports moved to `../`; `getFilterHref`/`getLeadHref` now point at
  `/admin/whatsapp/conversations/`; the two fetches now call `readWhatsAppRows` from
  `data.ts` (same throw→log→empty-array behaviour). Filters, model building, and composer
  wiring are otherwise unchanged.
- `src/app/admin/whatsapp/ReplyComposer.tsx` — **className strings only.**
- `src/app/admin/whatsapp/AutoRefresh.tsx` — **className strings only** (the two
  returned JSX blocks). No exported function or string was altered, so its tests hold.
- `src/app/admin/whatsapp/dashboard.test.ts` — the source-reading assertions were
  repointed from `./page.tsx` to `./conversations/page.tsx` (every assertion kept), plus a
  new test asserting the Overview page is gated by `hasWhatsAppAdminAccess` too.
- `src/components/whatsapp/nav.ts` + `nav.test.ts` — Overview is live at the console root,
  Conversations is live at `/conversations`.
- `src/app/layout.tsx` — two surgical edits: one import line, and wrapping
  `Header`/`Footer`/`main`. The TikTok pixel, GTM, Clarity, and analytics blocks were
  not touched.
- `src/lib/route-governance.json` — added `/admin/whatsapp/conversations/` (NOINDEX) and
  retitled the root entry. Scheduler entries untouched.
- `src/app/admin/whatsapp/data.ts` — **additive only.** Increment 9 appended
  `probeWhatsAppTable` + `WhatsAppTableProbe`. No existing function was altered.
- `src/components/whatsapp/nav.ts` + `nav.test.ts` — Increment 8 promoted Analytics to
  `live`; Increment 9 promoted Settings to `live` and gave it a truer description. The
  ordered live-routes assertion in the test is the thing that must be updated in step.
- `src/lib/route-governance.json` — Increment 8 added `/admin/whatsapp/analytics/`,
  Increment 9 added `/admin/whatsapp/settings/`. Both NOINDEX, `sitemap: false`.
  Increment 10 needed no change — the settings path did not move.

### Increment 10 modifications

- `src/lib/whatsapp/classify.ts` — `classifyWhatsAppIntent(input, rules?)` and
  `getSafeReply(text, rules?)`. The built-in rules were extracted into
  `classifyBuiltInIntent` unchanged; the override runs after it. `rules` is optional at
  every level, so no existing caller changed behaviour.
- `src/lib/whatsapp/store.ts` — `SupabaseStoreOptions.leadKeywords?`.
- `src/lib/whatsapp/webhook.ts` — `processWhatsAppWebhook(payload, store, send?, options = {})`.
- `src/app/api/whatsapp/webhook/route.ts` — loads settings through the cache and passes
  `settings.leadKeywords` to both the store factory and the processor.
- `src/lib/whatsapp/classify.test.ts` — 3 tests: absent vs empty rules are identical; a hot
  keyword promotes COLD→HOT and forces an acknowledgement; a spam keyword demotes HOT→COLD
  and suppresses the reply.
- `src/lib/whatsapp/webhook.test.ts` — 1 test proving a spam-keyword message is still stored
  while producing no auto-reply.
- `src/app/admin/whatsapp/settings/page.tsx` — restructured: "Console settings" (chips,
  summary `<dl>`, and the editor) first; "Connection status" demoted below a `border-t`.
  Reads with `maxAgeMs: 0`. The duplicate `<h1>` was removed and `Section` moved to `<h3>`.
- `src/app/admin/whatsapp/AutoRefresh.tsx` — added `resolveWhatsAppInboxRefreshMs` and a
  `refreshSeconds` prop; the interval is now clamped to 5–300s.
- `src/app/admin/whatsapp/AutoRefresh.test.ts` — 1 test for the clamp and the fallback.
- `src/app/admin/whatsapp/conversations/page.tsx` — passes
  `refreshSeconds={settings.console.inboxRefreshSeconds}`.
- `src/app/admin/whatsapp/page.tsx` — the `ACTIVITY_DAYS = 14` constant is gone; the window
  is `settings.console.activityWindowDays`, and the chart caption, `aria-label`, and empty
  state all follow it.
- `src/app/admin/whatsapp/analytics/page.tsx` — the response-time card now shows the median
  judged against the configured target, or a link into Settings when no target is set.

## Files deleted (2026-08-26 recovery)

The orphaned second shell described in the recovery log above. All ten files were added by
`052eed7` and imported by nothing:

- `src/components/whatsapp/layout/{SidebarNav,WhatsAppShell,WhatsAppSidebar,WhatsAppTopbar,icons,nav}.tsx|ts`
- `src/lib/whatsapp/admin/{account,client,format,shell}.ts`

The live shell is `src/components/whatsapp/WhatsAppShell.tsx` with
`src/components/whatsapp/nav.ts` — **flat, not under `layout/`.** The live data layer is
`src/app/admin/whatsapp/data.ts` (raw PostgREST + service-role key), **not**
`supabase-js createClient`.

## Verification (Increments 1–10, all green)

Latest run — 2026-08-26, after Increment 10 (editable console settings):

- Every test file under `src/` → **506/506 pass** (whole repo, scheduler suites included).
  Increment 10 added 46: 29 in `settings.test.ts`, 13 in `settingsStore.test.ts`, 3 in
  `classify.test.ts`, 1 in `webhook.test.ts`, 1 in `AutoRefresh.test.ts` (the settings-model
  rename moved 20 more without changing them). There is **no `npm test` script** — run
  `npx tsx --test $(find src -name '*.test.ts' -o -name '*.test.tsx')`.
- `npx tsc --noEmit` → **clean**
- `npx eslint src/app/admin/whatsapp src/lib/whatsapp src/app/api/admin/whatsapp
  src/app/api/whatsapp src/components/whatsapp` → **0 problems**. One real finding was fixed
  in the process (an unescaped apostrophe on the settings page).
- `npm run build` → **exit 0**. `validate-sitemap.mjs` → "Sitemap validation passed /
  Governed routes: **94**" (unchanged — no new page path). The manifest lists all **eight**
  console pages and **six** admin API routes, now including
  `/api/admin/whatsapp/settings/route`.
- Security sweep of the new files: no `NEXT_PUBLIC`, no `"use client"` anywhere in
  `src/lib/whatsapp`, no `process.env` in `SettingsEditor.tsx` (the only new client file),
  and no secret interpolated into JSX. Every `console.error` in `settingsStore.ts` is
  server-side and logs a status and a Postgres error code — never a token, and never the
  document. A rejected write returns the fixed string "The settings could not be saved." with
  no constraint, relation, or column text; a test asserts exactly that.
- The new PUT route carries the same two-part guard as every other admin write —
  `hasWhatsAppAdminAccess` (401) then `isSameOriginMutation` (403) — before it parses a body.
- `git status --porcelain` by path → **no** `src/lib/scheduler`, `src/app/scheduler`,
  `src/app/api/scheduler`, `src/components/scheduler`, `src/app/connect`,
  `src/app/api/tiktok`, `src/lib/tiktok*.ts`, `src/app/tiktok-media`, `.codex-temp`,
  `src/app/automation`, or `src/app/layout.tsx` change. `supabase/migrations/` gained exactly
  one new WhatsApp file; no existing migration was modified.
- **Fixed while reviewing:** the business-day pills are `sr-only` checkboxes, which left
  keyboard users with no visible focus indicator. The ring now sits on the label via
  `focus-within`.

**Not verified:** Analytics, Settings, and the new settings form have not been opened in a
real browser at any viewport, and no automated accessibility audit has been run. The form
uses `fieldset`/`legend`, real labels, `aria-describedby` hints, and a `role="status"`
feedback region, but that is structural, not observed. **Nothing in Increment 10 has been
exercised against a real `whatsapp_settings` table** — the migration is unapplied, so only
the defaults-and-fallback paths have run outside the unit tests.

Previous run — 2026-08-26, after Increment 9 (Settings):

- 459/459 tests, `tsc --noEmit` clean, eslint 0 problems, build exit 0, 94 governed routes,
  eight console pages in `.next/app-path-routes-manifest.json`.

Previous run — 2026-08-26, after Increment 8:

- 439/439 tests, `tsc --noEmit` clean, eslint 0 problems, build exit 0, 93 governed routes,
  seven console pages in `.next/app-path-routes-manifest.json`.

Earlier run — Increments 1–6:

- 109/109 tests, `tsc --noEmit` clean, eslint 0 problems, build green with 89 governed routes.
- Dev smoke test on a clean `.next`: templates 200, quick-replies 200, contacts 200 (incl.
  `?temp=HOT&q=…` and hostile `temp`/`q`), inbox 200, overview 200, `/` 200.
- **Runtime auth check:** unauthenticated `POST`/`DELETE` to
  `/api/admin/whatsapp/quick-replies/` → **401**; unauthenticated page requests render the
  unlock form.

## Dev-server first compiles are slow on this machine

First-hit route compiles have taken 5–62s, and once the dev bundler hung for 7+ minutes on
a route it later compiled in 62s from a clean `.next`. **A slow or hung dev compile is not
evidence of a code fault** — confirm with `npm run build` (authoritative), then
`rm -rf .next` and restart dev. Use `curl --max-time` so a probe cannot hang indefinitely.


## Trailing slashes on API fetches

`next.config` sets **`trailingSlash: true`**, so `/api/admin/whatsapp/foo` 308-redirects to
`/api/admin/whatsapp/foo/`. A 308 preserves method and body and `fetch` follows it, which is
why the existing `ReplyComposer` calls work without the slash — but it wastes a round trip.
**New client fetches should include the trailing slash.** The existing reply/audio fetch
strings were deliberately left unchanged: they work, and `dashboard.test.ts` asserts on them.


## Known issues / watch-outs

- Test invariant: `dashboard.test.ts` reads **`./conversations/page.tsx`** and asserts it
  contains `hasWhatsAppAdminAccess`, `ReplyComposer`, the full `media_*` select string,
  `/api/admin/whatsapp/media/`, and `<audio`. Keep those inline in that page — moving the
  select string into `data.ts` would break the test.
- `AutoRefresh.test.ts` tests pure helpers, not JSX — safe to restyle the component,
  but do not change the strings returned by `getWhatsAppNotificationStatusText`.
- **Old inbox bookmarks** (`/admin/whatsapp/?filter=HOT&lead=…`) now land on the Overview
  and the params are ignored. Deliberate: the brief lists both routes. Add a redirect only
  if that becomes annoying in practice.
- **Cosmetic, pre-existing:** the locked screen says "Unlock the voice tool" because
  `InternalUtilityUnlockForm` is shared with the text-to-speech utility. Not a regression.
  Fixing it properly means a per-utility copy prop on that shared component — ask first.
- Not yet reviewed in a real browser. Dev server: `npm run dev`, then `/admin/whatsapp`.
  Worth eyeballing the mobile drawer, the lead card list, and the chart on a narrow viewport.
- No `typecheck` npm script → use `npx tsc --noEmit`.
- Tooling note: Claude Code's auto permission mode classifies each Bash command with a
  model; when that model 503s, Bash is blocked. Allow-listed commands in
  `~/.claude/settings.json` bypass it (the verify commands were added there on 2026-08-25).


## DO NOT TOUCH (Codex / TikTok scheduler)

Pure TikTok/scheduler — never modify:
`src/lib/scheduler/**`, `src/app/scheduler/**`, `src/app/api/scheduler/**`,
`src/components/scheduler/**`, `src/app/tiktok-media/[...path]/route.ts`,
`src/app/connect/tiktok/**`, `src/app/api/tiktok/**`, `src/lib/tiktokWorkflowStore.ts`,
`src/lib/internalWorkflowAuth.ts`, `.codex-temp/**`, and the 5 scheduler migrations
(`202608210001`, `202608210002`, `202608210003`, `202608230001`, `202608240002`).

Shared — do NOT edit for WhatsApp (make WhatsApp-specific versions; read-only use OK):
`src/lib/scheduler/config.ts`, `src/lib/scheduler/session.ts`, `src/lib/secureCookie.ts`,
`src/lib/tiktok.ts`, `src/lib/tiktokPublishing.ts`, `src/lib/site.ts`, `src/lib/posts.ts`,
`src/lib/internalUtilityAuth.ts`, `src/components/internal/InternalUtilityUnlockForm.tsx`.

Never run destructive git (`reset --hard`, `checkout .`, global discard). Stage only
WhatsApp-redesign files by explicit path. Never `git add -A` / `commit -am`.

## Next exact task

**Interface development is PAUSED.** The next task is not an interface increment — it is the
live messaging/profile work recorded under "Live Messaging Feature Checkpoint" at the end of
this document. When that is finished, **STOP** and wait to be told to resume.

The interface resume point is recorded in full under "Interface Development Paused" near the
top of this document.

**Outstanding user actions: one migration, plus two production observations.**
`supabase/migrations/202608260002_whatsapp_delivery_error.sql` has **not** been run — it adds
`whatsapp_messages.delivery_error` (additive, plus a partial index). Everything works without
it; the only cost is that a failed message shows its status but not its sanitized reason. The
two production observations that cannot be made from this machine are listed in the
"Live Messaging Feature Checkpoint" below. The earlier three actions are closed: both
original migrations were run and `WHATSAPP_BUSINESS_ACCOUNT_ID` is set in Vercel production.
See the "RESOLVED" section above.

**Blocked, not skipped: conversation notes and labels.** The schema has no `notes` or
`labels` column on `whatsapp_conversations` — the inbox says so honestly rather than
rendering an input that cannot save. Finishing it needs an additive migration the user must
apply by hand, exactly like quick-replies. Do not build the UI before the column exists.

**Candidate increments after the pause lifts** (ask which; do not assume):
- **Browser + accessibility pass** — the recorded resume point. A non-feature increment.
  Analytics, Settings, and the settings form are structurally responsive and semantically
  marked up but have never been opened in a browser or audited. Cheaper than either feature
  and it closes the one honest gap in the verification list. The settings form is the most
  worthwhile target: it is the first page in this console with a substantial number of
  interactive controls, including day-selection pills built as `sr-only` checkboxes.
- **Automations** — auto-replies and routing rules. Needs a new table plus a decision about
  where rules execute (webhook path vs a job), so it touches the working receive path.
  Read `src/lib/whatsapp/store.ts` end to end before proposing a design. Lighter of the two.
- **Campaigns** — sends approved templates outbound. Heaviest and highest-risk: needs a new
  send path, recipient selection, rate limiting, and opt-out/consent thinking. This is the
  one remaining piece that can get the WhatsApp account restricted if done carelessly. Do
  not start it casually.

For any of them: register the route in `src/lib/route-governance.json`, flip `status` to
`"live"` in `nav.ts`, update the live-routes assertion in `nav.test.ts` (**it asserts the
exact ordered list**, and nav order is Workspace → Growth → Configuration), run the full
verification list above (stop dev before building), update this doc, then commit **only if
the user asks** — do not commit unprompted.

## Live Messaging Feature Checkpoint

All six items are implemented on `main`. Verified against a **production build** (`next build`
then `next start`, port 3008) rather than only a dev server, driven by a temp-directory script
that authenticated through the real `/api/internal/session/` route: **35/35 checks passed**.

**The most important finding of this work was a runtime bug that every gate missed.** The
console shell rendered the wordmark with `quality={80}`, and `next.config.mjs` (lines 59-61)
allows only `[60, 65, 68, 75]`. An unlisted quality makes `next/image` **throw during render**.
The console pages are server-rendered on demand, so `next build` never executed that path, and
React swallowed the throw into the Suspense fallback. Result: **all eight console pages served
nothing but the loading screen** while build, typecheck, and 572 tests stayed green. Fixed at
both call sites (75 — what `Header` and `Footer` already use for this asset) rather than by
widening the shared `images.qualities` list, and pinned by
`src/components/whatsapp/shellBranding.test.ts`, a guard that was mutation-tested: it goes red
and names the offending file when `quality={80}` is reintroduced.

Lesson worth carrying: **a green build says nothing about whether a dynamic page renders.** No
earlier session's page-level claim about these eight pages had ever been observed in real
rendered HTML.

### 1. Web Growth Dashboard Logo

Status: **Done and observed rendering.**

Implementation: the project's existing `public/images/brand/web-growth-logo.webp` (3151×467,
6.75:1) — no new logo was created. Two placements in
`src/components/whatsapp/WhatsAppShell.tsx`: the sidebar wordmark in `SidebarContent`
(`h-5 w-auto`), serving both the desktop `<aside>` and the mobile drawer; and a new mobile-only
mark in the sticky header (`h-4 w-auto`, `lg:hidden`), because on a phone the sidebar sits
behind the drawer so nothing on screen carried the mark until it was opened. `Header.tsx`
already pairs this asset with light paper, so that is a proven treatment rather than a new one.
Both are `next/image` links to the console root, labelled
`aria-label="Web Growth WhatsApp console"`, sized by height with `w-auto` so the intrinsic ratio
drives the width and the wordmark can never stretch. Deliberately **not** added to the sidebar
account card (same column as the wordmark — redundant) or to the settings business-profile card
(that card must show Meta's real customer-visible picture, not our local file). No customer
avatar was replaced by the logo.

Live Test: all eight console pages return 200 and render the real shell — `<h1>`, the menu
button, both logos, exactly two labelled links each. The optimizer serves real bytes at every
breakpoint: 384×57, 640×95, 256×38, all 6.74:1, as WebP to capable clients (6,956 B) with a
JPEG fallback (4,593 B). No broken image. **Not done:** no actual browser was opened at
375/390/430 px — the markup is confirmed present and correct, but observed layout at those
widths is part of the interface resume point below.

### 2. Web Growth WhatsApp Profile Picture

Status: **Investigated at the Meta level and verified registered. The premise behind the report
turned out to be wrong in an important way — this is not a backend configuration fault, so no
Meta-side "fix" was invented for a problem that does not exist there.**

Meta Configuration: read live from the Graph API (v26.0), not inferred from the frontend. The
connected WABA holds exactly **one** phone number, **+234 806 670 6336**, `verified_name`
"Web Growth Digital Services", quality **GREEN**, `code_verification_status` **VERIFIED**,
`account_mode` **LIVE**, `platform_type` **CLOUD_API**. The configured
`WHATSAPP_PHONE_NUMBER_ID` **is** that number's id — no mismatch, no duplicate account or
number was created. `GET /{phone-number-id}/whatsapp_business_profile` returns HTTP 200 with a
genuine `pps.whatsapp.net` `profile_picture_url`; fetching that URL returns HTTP 200,
`image/jpeg`, **33,772 bytes, 640×638**. The picture is genuinely registered and servable.
Also set: `description`, `email`, `websites`, `vertical`. **Not set: `about` and `address`** —
both optional, but `about` is the short line under the business name inside the chat, so it is
the one worth adding in WhatsApp Manager.

Customer-Side Verification: **the picture is served end to end through our own authenticated
route** — `GET /api/admin/whatsapp/profile-photo/` returns HTTP 200, `image/jpeg`, 33,772 bytes,
`Cache-Control: private, max-age=300`, and refuses an unauthenticated caller with 401. The
settings card renders that proxied Meta photo (not the local logo) and reports the picture as
"Registered"; all seven profile fields report 7/7. What could **not** be verified here, stated
plainly: whether a particular customer's handset shows it. No API can report on another
person's cache and none can flush it. Since the configuration is correct and the bytes are
servable, "customers don't see it" is client-side caching/propagation — and the settings card
says exactly that rather than implying we can act on another device's cache.
**Needs the user:** open a chat with the production number from a phone that has never messaged
it (or clear WhatsApp's cache) and confirm the picture appears.

### 3. Customer Fallback Avatars

Status: **Implemented and unit-tested. Not yet seen against real contact rows.**

Implementation: `src/lib/whatsapp/avatar.ts`, a pure module. Name priority `display_name` →
`business_name` → `wa_id`; initials take the first two words ("Victor Chinukwue" → VC,
"Victor" → V) via a Unicode-aware `[\p{L}\p{N}]` class so non-Latin names still resolve. Tone is
one of six ledger-palette pairs chosen by an FNV-1a hash **keyed on `wa_id` only** —
deliberately not on the name, so renaming a contact never changes their colour and the same
contact always gets the same appearance. Rendered by
`src/components/whatsapp/ContactAvatar.tsx` in the conversation list, chat header, contact
detail panel, the contacts page (mobile cards and desktop table), and the overview's recent
conversations. No WhatsApp customer profile photo is ever requested — the Cloud API does not
provide them, so nothing retries for something that cannot arrive.

Test: unit tests green inside the 574-test suite. One consistency bug was caught and fixed while
wiring this up: the overview query never selected `business_name`, so a contact with no
`display_name` but a `business_name` would have drawn a *different* avatar there than
everywhere else — the column was added to that query and its mapper. **Not done:** not visually
confirmed against real rows, because this machine has no `SUPABASE_SERVICE_ROLE_KEY` (see the
final subsection).

### 4. Agent → Customer Typing Indicator

Status: **Implemented against the current, live-verified API contract. Not observed on a
customer handset from this machine.**

Implementation: `src/lib/whatsapp/typing.ts` plus `POST /api/admin/whatsapp/typing/`. The
contract was **not** written from memory — it was established by probing the live Graph API
until Meta's own JSON-schema validator published it (`expected : '[text]'` for
`typing_indicator.type`). The supported call on **v26.0** is `POST
/{phone-number-id}/messages` with `{messaging_product, status: "read", message_id: <real
inbound wamid>, typing_indicator: {type: "text"}}`. Two consequences worth knowing: it needs a
**real inbound wamid**, and Meta **bundles the indicator with the read receipt**, so triggering
typing also marks the customer's message read. Both are documented in the module header and
disclosed in the composer UI rather than hidden. Throttling is
`WHATSAPP_TYPING_REFRESH_MS = 8000` behind a `shouldSendWhatsAppTypingSignal` guard — one call
per window, never per keystroke. Every failure path resolves rather than throws and logs status
only, so **typing can never block a send**. The route is server-side only and enforces admin
auth plus same-origin; no credential reaches a client component.

Live Test: route guards verified live — 401 unauthenticated, 403 cross-origin. The customer-side
observation (agent types → indicator appears on the handset) could not be made here: it needs a
real inbound wamid, which needs a stored inbound message, which needs the database this machine
cannot reach. **Needs the user:** message the production number from a phone, open that thread
in `/admin/whatsapp/conversations`, start typing, and watch the handset.

### 5. Real-Time Messages

Status: **Done, within a hard architectural limit worth stating precisely.**

There is no Supabase realtime subscription and there cannot be one: RLS is enabled with **zero
policies**, so the service-role key is the only way in, and that key must never reach a browser.
"Real-time" here is therefore an improved poll, not a subscription — `AutoRefresh` polls
`/api/admin/whatsapp/notifications/` and calls `router.refresh()`, a *soft* refresh that
preserves client component state. Honest engineering within the constraint, not a faked
subscription.

Incoming: the webhook path is unchanged, deliberately — Customer → Meta → webhook → store →
render. The poll compares a 12-row digest and only refreshes when that fingerprint actually
changes, so the conversation list updates (order, last-message preview, timestamp, unread count,
and the open thread) without refetching the whole list on a timer.

Outgoing: optimistic bubbles via `OutboundQueue` + `outboundQueueModel.ts`, three states only —
`sending`, `sent`, `unconfirmed`. A dropped connection is `unconfirmed`, **never** "failed",
because we genuinely do not know; a server refusal drops the bubble and hands the draft back to
the composer, so nothing failed ever looks successful. A real `failed` only ever comes from
Meta's status webhook.

Reconnect: `focus`, `online`, and `visibilitychange` listeners plus a 60 s reconcile that
refreshes even when the fingerprint looks unchanged, so a missed event cannot strand the view;
polling pauses only on a hidden tab. Verified live that the endpoint degrades to a clean 503
with a sanitized body when storage is unconfigured, and 401 when unauthenticated.

Duplicate Protection: deduplication is on the **wamid** — the same `whatsapp_message_id` the row
upserts on — so one incoming message is one dashboard message and one outgoing reply is one
dashboard message, whichever arrives first (optimistic bubble or stored row). Four unit tests
cover `pruneStoredWhatsAppOutbound`. The provider is keyed `key={lead.id}`, which also fixed a
**pre-existing** bug where React reused the composer across lead changes and carried a
half-typed draft into another thread. **Not done:** incoming/outgoing were not observed arriving
live, for the same missing-credential reason as items 3 and 4.

### 6. Message Statuses

`src/lib/whatsapp/messageStatus.ts` + `src/components/whatsapp/MessageStatus.tsx`. Meta's
webhook stays authoritative; nothing is manufactured in the frontend. A monotonic rank
(`null` 0, accepted/queued/sending 1, sent 2, delivered 3, read 4, failed 5) is applied in the
PATCH itself, so a late or out-of-order webhook can never walk a status backwards. Statuses live
in the database, so a browser refresh does not reset them. Nothing is colour-only: every state
carries an `sr-only` description and a `title`. **Not observed live** — the logic is
unit-tested and the transport is unchanged and already working, but no real status webhook
reached this machine.

Sent: single check.

Delivered: double check.

Read: double check in `ledger-bright` (white on a dark bubble).

Failed: `rose` — the one palette in this design system that is *not* remapped onto the ledger
greens, so it is the honest alert colour — with the visible word "Failed" plus a sanitized
reason mapped from Meta's code (131026, 131047, 131049, 131051, 131053, 132000, 132001, 133010,
470, 368). Raw provider payloads are never shown. Existing retry behaviour was preserved, not
rebuilt. One trap caught before it shipped: selecting `delivery_error` would have **blanked
every thread**, because PostgREST rejects a select naming a column the table lacks and
`readWhatsAppRows` collapses that to `null`; `readConversationMessageRows` now retries without
the column, so the unapplied migration costs the failure *sentence*, never the messages.

## Build Status

Lint: **0 warnings, 0 errors** on `src/app/admin/whatsapp`, `src/components/whatsapp`,
`src/lib/whatsapp`, `src/app/api/admin/whatsapp` (`next lint --dir …`, exit 0). One warning
remains repo-wide — `src/components/scheduler/PostStatusPanel.tsx:68`
`react-hooks/exhaustive-deps` — which is **pre-existing TikTok scheduler code and was
deliberately left alone**. Bare `npm run lint` still walks `.codex-temp/` and reports ~814
pre-existing findings; scope the lint to the WhatsApp paths.

Typecheck: **clean** — `npx tsc --noEmit`, no output.

Build: **exit 0** — `npm run build`; sitemap validation passed, **94 governed routes**. Tests:
**574/574 pass**, 0 fail (up from 572 — two new branding guards). Live: **35/35** against the
production build, including that neither the access token nor the admin passphrase appears in
any of the eight rendered admin pages or in any of the 16 client bundles scanned. §24 TikTok
untouched; §25 verified — `/` and `/services/business-automation/` both still render (HTTP 200,
112,514 and 104,283 bytes) with no console chrome.

Reviewed, not a defect: the settings page shows the configured `WHATSAPP_BUSINESS_ACCOUNT_ID`
and `WHATSAPP_PHONE_NUMBER_ID` **values** to an authenticated admin, and the phone-numbers page
uses the number id as a React key. Those are identifiers, not secrets — useless without the
token, which never leaves the server — and displaying them is the readiness console's purpose.
Pre-existing behaviour from `b5ac807`, left as is. Separately, and checked rather than assumed:
in **dev only**, Next's fetch instrumentation serialized Meta's raw response headers into the
RSC payload; a rebuild against `next start` confirmed all of it is absent from production, so
no change was needed.

### What could not be tested on this machine, and why

The root tree's `.env.local` has no WhatsApp/Meta/Supabase variables; those live in the stale
`.worktrees/codex-whatsapp-admin-access/.env.local`, which supplies `SUPABASE_URL`,
`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_API_VERSION`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, and
`WHATSAPP_PHONE_NUMBER_ID`. Two are missing **everywhere**:

- **`SUPABASE_SERVICE_ROLE_KEY`** — so `getWhatsAppSupabaseConfig()` returns null, every read
  returns null, and every page renders its empty state. No real conversation, contact, message,
  or status could be displayed locally.
- **`META_APP_SECRET`** — so webhook signature verification would reject Meta, and a local
  webhook is unreachable from the internet regardless.

Consequently end-to-end tests **B, E, F, G, H, I, J** and the §28 mobile checks against real
data could not be run here, and neither could the customer-side halves of **C** and **D**.
Those items are verified by unit tests, live Graph API probes, and production-build route
checks — not by an observed message on a handset, and this checkpoint does not claim otherwise.
Everything reachable without those two values *was* tested live, and that is what found the
`quality={80}` bug.

## Interface Resume Point

The broader WhatsApp interface implementation was paused at:

**Increment 10 (editable console settings) — complete and verified, with eight console pages
live: Overview, Conversations, Contacts, Templates, Quick Replies, Analytics, Phone Numbers,
Settings. Stages 1-8 and 10-13 are done. Stage 9 is partially complete — `assigned_to` is
read-only, and `notes`/`labels` are blocked on an additive migration, not on code. Stages 14
(Campaigns) and 15 (Automations) are NOT STARTED. Nothing is mid-edit.**

The exact next task when development resumes is:

**A browser and accessibility pass over the eight existing console pages, starting with
`/admin/whatsapp/settings`.** Run `npm run dev`, open each page at 375px / 768px / 1440px, and
specifically exercise: the mobile drawer, the lead card list, the overview chart, the 3-column
conversations layout at each breakpoint, and the settings form's keyboard path (the business-day
pills are `sr-only` checkboxes with the focus ring on the label — verify it is actually
visible). Then run an accessibility audit. This closes the single honest gap in the verification
list and is cheaper than either remaining feature.

This is now **more clearly the right next step than when it was first recorded**: the
`quality={80}` throw proved those pages had never actually rendered, so the pass is not polish —
it is the first real look at them. Add the mobile widths this work introduced, **375 / 390 /
430 px**, checking avatars, chat layout, composer, status indicators, and the new mobile header
wordmark beside the page title.

**Then** — and only after asking the user which — one of Stage 15 (Automations, lighter, needs a
new table plus a decision on where rules execute) or Stage 14 (Campaigns, heaviest and
highest-risk: new send path, recipient selection, rate limiting, consent/opt-out). The user has
**not** chosen between these; do not assume. Stage 9 (notes/labels) is blocked on an additive
migration, not on code.

Do not resume the broader interface implementation until explicitly instructed.



