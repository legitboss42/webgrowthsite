# WhatsApp Platform Interface Redesign — Progress & Resume Doc

> Living document. Update after every milestone so a fresh session (or a
> reconnect after a dropped network) can resume exactly where we left off.
> Last updated: 2026-08-25.

## Current phase

**Increment 6 (Templates) — COMPLETE and verified. The first milestone is DONE:**
Overview, Conversations, Contacts, Templates, Quick Replies, all inside the app shell.
Next up: Campaigns / Automations / Analytics / Phone Numbers / Settings — none started.
Nothing is in progress mid-edit.

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

- **Git worktree:** `.worktrees/codex-whatsapp-admin-access`
- **Branch:** `codex/whatsapp-admin-access` (this is the branch the WhatsApp work
  is carried out on — NOT `main`).
- The primary `main` working tree at the repo root has some *stale, uncommitted*
  early WhatsApp edits (`page.tsx`, `dashboard.test.ts`, untracked `auth.ts`).
  **Do not rely on or "fix" those** — the real, current, committed state is on
  this branch. Leave main's uncommitted files alone (never revert others' work).
- `.codex-temp/` in this worktree is Codex's scratch area (it contains a
  `node_modules.broken-install` tree). **Never touch it.** It is the source of
  ~814 pre-existing `npm run lint` findings; lint only the app's own paths.

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
- **Later** — Campaigns, Automations, deep Analytics, Phone Numbers, Settings
  (each its own increment, additive migrations only, honest empty states until wired).

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

## Verification (Increments 1–6, all green)

- `npx tsx --test src/app/admin/whatsapp/*.test.ts src/components/whatsapp/nav.test.ts src/lib/whatsapp/*.test.ts` → **109/109 pass**
- `npx tsc --noEmit` → **clean**
- `npx eslint src/components/whatsapp src/components/SiteChrome.tsx src/app/admin/whatsapp src/app/api/admin/whatsapp src/lib/whatsapp src/app/layout.tsx` → **0 problems**
  (do NOT judge by bare `npm run lint`: it walks `.codex-temp/` and reports ~814 pre-existing findings)
- `npm run build` → **✓ Compiled successfully**; "Sitemap validation passed / Governed
  routes: 89"; all 5 console pages (`/admin/whatsapp`, `/conversations`, `/contacts`,
  `/templates`, `/quick-replies`) and all 5 admin API routes + the webhook present; public
  pages still prerendered static.
- Dev smoke test on a clean `.next`: templates 200, quick-replies 200, contacts 200 (incl.
  `?temp=HOT&q=…` and hostile `temp`/`q`), inbox 200, overview 200, `/` 200.
- **Runtime auth check:** unauthenticated `POST`/`DELETE` to
  `/api/admin/whatsapp/quick-replies/` → **401**; unauthenticated page requests render the
  unlock form.
- `git status` → only WhatsApp-redesign files. No TikTok/scheduler file, no
  `package-lock.json`, no `.codex-temp` change.

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

The first milestone is complete. Nothing is half-finished. Two things the user must do
outside the code, then pick the next increment with them:

**Outstanding user actions**
1. **Run the quick-replies migration against Supabase** —
   `supabase/migrations/202608250001_whatsapp_quick_replies.sql`. Nothing in the build or
   deploy applies migrations. Until it runs, `/admin/whatsapp/quick-replies` lists nothing
   and saving errors.
2. **Confirm the production env** has `WHATSAPP_BUSINESS_ACCOUNT_ID` (it is in `.env.local`;
   Vercel needs it too, or Templates shows its "not configured" state in production).

**Candidate next increments** (ask which; do not assume):
- **Phone Numbers** — real quality rating, messaging limits, and the sender's display
  number from `GET /{WHATSAPP_BUSINESS_ACCOUNT_ID}/phone_numbers`. This also fills the
  gaps deliberately left on the Overview and in the shell's `senderNumber` prop.
- **Analytics** — response times and volumes from stored messages, extending `overview.ts`.
- **Campaigns** — sends approved templates outbound. Heaviest and highest-risk: needs a
  new send path, recipient selection, rate limiting, and opt-out/consent thinking. Do not
  start it casually.
- **Automations** — auto-replies and routing rules.

For any of them: register the route in `src/lib/route-governance.json`, flip `status` to
`"live"` in `nav.ts`, update the live-routes assertion in `nav.test.ts`, run the full
verification list above (stop dev before building), update this doc, checkpoint-commit.



