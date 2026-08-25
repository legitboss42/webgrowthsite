# WhatsApp Platform Interface Redesign — Progress & Resume Doc

> Living document. Update after every milestone so a fresh session (or a
> reconnect after a dropped network) can resume exactly where we left off.
> Last updated: 2026-08-25.

## Current phase

**Increment 2 (Overview dashboard + route split) — COMPLETE and verified.**
Next up: Increment 3 (Conversations polish — 3-column desktop / one-panel mobile).
Nothing is in progress mid-edit.

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
- **Increment 3 — Conversations polish. ← NEXT.** 3-column desktop / one-panel-at-a-time
  mobile using the already-working thread + composer + auto-refresh.
- **Increment 4 — Contacts** (real data).
- **Later** — Templates, Quick Replies, Campaigns, Automations, deep Analytics
  (each its own increment, additive migrations only, honest empty states until wired).

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

## Verification (Increments 1–2, all green)

- `npx tsx --test src/app/admin/whatsapp/*.test.ts src/components/whatsapp/nav.test.ts src/lib/whatsapp/*.test.ts` → **76/76 pass**
- `npx tsc --noEmit` → **clean**
- `npx eslint src/components/whatsapp src/components/SiteChrome.tsx src/app/admin/whatsapp src/app/layout.tsx` → **0 problems**
  (do NOT judge by bare `npm run lint`: it walks `.codex-temp/` and reports ~814 pre-existing findings)
- `npm run build` → **✓ Compiled successfully**; "Sitemap validation passed / Governed
  routes: 86"; `/admin/whatsapp`, `/admin/whatsapp/conversations`, all 4 admin API routes
  and the webhook present; public pages still prerendered static.
- Dev smoke test: `/admin/whatsapp/` 200, `/admin/whatsapp/conversations/` 200, `/` 200;
  unauthenticated requests correctly render the unlock form on console routes.
- `git status` → only WhatsApp-redesign files. No TikTok/scheduler file, no
  `package-lock.json`, no `.codex-temp` change.

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

Increment 3 — Conversations polish:
1. Rework `/admin/whatsapp/conversations` into the mockup's 3-column desktop layout
   (list | thread | contact details) and one-panel-at-a-time on mobile.
2. Keep every existing behaviour: 7 filters, `?filter=`/`?lead=` params, message thread,
   audio playback, `ReplyComposer` (text + voice), `AutoRefresh` polling and alerts.
3. Chat-bubble thread styling; the contact panel uses only real columns
   (`website`, `source`, `intent`, `status`, `assigned_to`, `lead_temperature`).
   Notes/labels need an additive migration — defer to their own increment, do not fake them.
4. Re-run the full verification list above, update this doc, checkpoint-commit.
