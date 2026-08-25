# WhatsApp Platform Development Progress

Resume document for the `/admin/whatsapp` platform redesign. Written so a fresh
session can continue without re-auditing the repository.

## Current Phase

**Stage 2 in progress** (WhatsApp application shell). Stage 1 (audit) is complete
and recorded below.

## Stage 1 Audit Result (complete)

### Framework and tooling

| Concern | Finding |
| --- | --- |
| Next.js | `15.5.14`, App Router, `src/app` |
| React | `18.3.1` |
| Tailwind | **v4** via `@tailwindcss/postcss`. No `tailwind.config.*`; tokens live in `@theme` inside `src/app/globals.css` |
| Fonts | Loaded globally in `src/app/layout.tsx`: Inter (`--font-inter`), Fraunces (`--font-fraunces`), IBM Plex Mono (`--font-ibm-plex-mono`) |
| Database | Supabase, service role only, server side |
| Chart library | **None installed.** Charts must be hand-rolled SVG (see decisions) |
| Icon library | **None installed.** Icons are inline SVG |
| Path alias | `@/*` maps to `src/*` only |

### Existing WhatsApp integration (working, preserved)

| Piece | Location |
| --- | --- |
| Webhook (GET verify + POST ingest) | `src/app/api/whatsapp/webhook/route.ts` |
| Signature check, payload normalisation, auto-reply orchestration | `src/lib/whatsapp/webhook.ts` |
| Outbound send (Graph API) | `src/lib/whatsapp/send.ts` |
| Supabase + in-memory stores | `src/lib/whatsapp/store.ts` |
| Intent/temperature classifier, 24h window helper | `src/lib/whatsapp/classify.ts` |
| Domain types | `src/lib/whatsapp/types.ts` |
| Admin lead-queue page (old UI) | `src/app/admin/whatsapp/page.tsx` |
| Pure lead filter helpers | `src/app/admin/whatsapp/dashboard.ts` |
| Admin auth gate | `src/app/admin/whatsapp/auth.ts` |
| Tests | `src/lib/whatsapp/*.test.ts`, `src/app/admin/whatsapp/dashboard.test.ts` |

Message flow, unchanged by this work:

```
Meta -> /api/whatsapp/webhook (verify sig) -> parseWhatsAppWebhook
     -> createSupabaseWhatsAppStore.recordInbound -> whatsapp_events / _contacts
        / _conversations / _messages
     -> optional safe auto-reply via sendWhatsAppText -> recordOutbound
Statuses -> updateMessageStatus (whatsapp_messages.delivery_status)
```

### Database schema that already exists

`supabase/migrations/202608130001_whatsapp_crm.sql` and
`202608240001_whatsapp_audio_messages.sql`:

- `whatsapp_contacts` - `id, wa_id (unique), phone, display_name, business_name,
  email, website, source, tracker_reference, lead_status, lead_temperature
  (COLD|WARM|HOT), created_at, updated_at`
- `whatsapp_conversations` - `id, contact_id (**unique**), status,
  first_message_at, last_message_at, intent, human_review_required, assigned_to,
  created_at, updated_at`
- `whatsapp_messages` - `id, conversation_id, whatsapp_message_id (unique),
  direction (inbound|outbound), message_type, message_text, message_timestamp,
  delivery_status, raw_event_reference, media_id, media_mime_type, media_sha256,
  media_voice, media_filename, created_at`
- `whatsapp_events` - `id, meta_event_id (unique), event_type, payload, processed,
  created_at`
- **RLS enabled with zero policies** on all four, so access is service-role only.

Gaps against the brief: no labels, no notes, no per-message read/delivered
timestamps, no phone-number table, no templates, no quick replies, no unread
counter, no multi-tenant column. `whatsapp_conversations.contact_id` being
`unique` means one conversation per contact, which is a real constraint the UI
must respect.

### Auth

`src/app/admin/whatsapp/auth.ts` exports `hasWhatsAppAdminAccess(cookieStore)`,
which accepts **either** the sealed internal-utility cookie
(`src/lib/internalUtilityAuth.ts`) **or** an owner TikTok scheduler session
(`src/lib/scheduler/session.ts` + `isOwnerOpenId`). Locked visitors get
`InternalUtilityUnlockForm`.

### Environment variables (all server-only, no `NEXT_PUBLIC_`)

`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
`WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET`,
`WHATSAPP_GRAPH_API_VERSION`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
Confirmed: **zero** WhatsApp or Meta value is exposed through a
`NEXT_PUBLIC_*` variable.

### Design system in place ("Growth Ledger")

`@theme` tokens in `src/app/globals.css`, usable directly as Tailwind utilities:

- Green: `ledger` `#124a38`, `ledger-deep` `#0c3327`, `ledger-bright` `#1c7a54`,
  `ledger-tint` `#dbe7de`
- Paper: `paper` `#eff1ec`, `paper-raised` `#f7f8f4`, `paper-sunk` `#e4e7de`
- Ink: `ink` `#14140f`, `ink-soft` `#454a3f`, `ink-faint` `#737868`
- Rules: `rule` `#d2d6cb`, `rule-strong` `#b7bbae`
- Accent: `brass` `#b4802f`, `brass-tint` `#ece0c6`

Note: the stock Tailwind `blue`/`indigo`/`violet`/`purple` scales are
**overridden to green** in `@theme`, so `bg-blue-500` is not blue. Use the
semantic names above.

## Hard constraints discovered

1. **`scripts/validate-sitemap.mjs` fails `npm run build` on any ungoverned App
   Router page.** Every new `page.tsx` must be registered in
   `src/lib/route-governance.json`. Admin pages must be
   `"status": "NOINDEX", "sitemap": false`.
2. **`trailingSlash: true`** in `next.config.mjs`. All internal links need a
   trailing slash.
3. **No `typecheck` or generic `test` script** in `package.json`. Use
   `npx tsc --noEmit` and `npx tsx --test <path>`. Do not edit `package.json`;
   the parallel agent may be touching it.
4. **`npm run lint` (bare `eslint .`) exits 2 on this machine before reaching any
   source file.** `eslint.config.mjs` ignores `.next/**` only at the repo root and
   flat config does not read `.gitignore`, so `eslint .` walks into
   `.worktrees/codex-whatsapp-admin-access/.next` and crashes on a stale
   artifact. Pre-existing, not caused by this work. Lint explicit paths instead:
   `npx eslint src scripts eslint.config.mjs next.config.mjs postcss.config.mjs`.
5. **`.env.local` holds no Supabase or WhatsApp credentials.** They exist in
   Vercel only. Locally every WhatsApp screen must therefore render a truthful
   "not configured" state, never fabricated numbers.
6. **`LOW_CPU_EMERGENCY_MODE = true`** in `src/lib/emergency.ts`. It currently
   503s `/api/get-started`, `/api/ai` and `/api/health/db`. New WhatsApp admin
   endpoints are not wired to it and `src/lib/emergency.ts` is left untouched.
7. **Zod is not installed.** Validate with `src/lib/security.ts` helpers
   (`sanitizeText`, `isValidEmail`, `checkRateLimit`, `isAllowedOrigin`).
8. **Large content must be written with Write/Edit, never a Bash heredoc.** A
   heredoc carrying a large block hits `ENAMETOOLONG` from `uv_spawn` on this
   Windows environment.
9. **`src/app/admin/whatsapp/dashboard.test.ts` reads `page.tsx` as text and
   asserts it matches `/hasWhatsAppAdminAccess/`.** `page.tsx` must keep
   referencing that symbol or the parallel agent's test fails.
10. **Playwright browser binaries are not installed.** Verification scripts must
    use `chromium.launch({ channel: "chrome" })` against system Chrome.
11. The stylesheet avoids `color-mix()`, `:has()` and `clip-path`; the repo has
    one occurrence in 7,381 lines. Keep new CSS to the same floor.

## Parallel work in flight (collision risk)

`git worktree list` shows a live second worktree:
`.worktrees/codex-whatsapp-admin-access` on branch
`codex/whatsapp-admin-access` at `34026c7`.

Its uncommitted counterparts in the main worktree are
`src/app/admin/whatsapp/page.tsx`, `src/app/admin/whatsapp/auth.ts` (new) and
`src/app/admin/whatsapp/dashboard.test.ts`. **`auth.ts` and `dashboard.test.ts`
are treated as read-only by this work.** `page.tsx` is edited surgically and
keeps its `hasWhatsAppAdminAccess` reference so their test still passes.

A separate `docs/automation-waitlist-progress.md` documents a completed
`/automation` waitlist feature. Its files are untouched here.

## Important Architecture Decisions

1. **Tailwind utilities, not a `globals.css` namespace.** The `/automation`
   feature appended ~1,550 lines to `globals.css`. `globals.css` ships on every
   public marketing page, so admin-only CSS there is dead weight for visitors.
   The admin UI therefore uses the existing `@theme` tokens through Tailwind
   utilities and adds **zero** lines to `globals.css`.
2. **Shell in a layout, not per page.** `src/app/admin/whatsapp/layout.tsx` owns
   the auth gate, sidebar, topbar and mobile drawer, so every route inherits it
   and a future move to `app.webgrowth.info` is a directory move plus a
   `basePath`, not a rewrite.
3. **Nav is data, grouped for expansion.** `src/components/whatsapp/layout/nav.ts`
   holds the item list in labelled groups (Inbox / Messaging / Account) so the
   future modules in the brief's section 46 slot in without touching the shell.
4. **Charts are hand-rolled SVG.** No chart package is installed and the brief
   forbids adding one for a single chart. A small stacked/line SVG component
   costs about 4 KB against Recharts' ~100 KB.
5. **Icons are inline SVG** in one module, for the same reason.
6. **Signature UI element: the 24-hour service window is a first-class object.**
   It is the one constraint unique to WhatsApp business messaging, so it is shown
   as a precise monospace countdown rail in the chat header and as a state on
   conversation rows, and it physically locks the free-text composer when it
   expires. It is derived from `isFreeformReplyAllowed` in
   `src/lib/whatsapp/classify.ts`, the same helper the send path already uses, so
   the UI cannot disagree with the server.
7. **Type treatment.** Inter for UI, IBM Plex Mono as the data face (metric
   numerals, timestamps, phone numbers, message ids, the window countdown),
   Fraunces reserved for page titles only. Mono numerals give tabular alignment
   in dense tables, which the brief asks for.
8. **No fabricated data.** Every screen reads real Supabase rows or renders an
   empty/not-configured state. Mockup numbers are treated as visual reference
   only, per the brief's section 37.

## Completed

- Stage 1: repository, integration, schema, auth, env and design-system audit
  (recorded above).
- Stage 2 start: this progress document.

## In Progress

Stage 2, WhatsApp application shell.

## Remaining

Stages 3-15 from the brief: overview dashboard, conversation list, chat, contact
panel, live data, statuses, notes/labels/assignment, contacts page, quick
replies, templates, analytics, campaign foundation, automation architecture.

## Files Created

- `docs/whatsapp-platform-progress.md`

## Files Modified

None yet.

## Known Issues

- Pre-existing: `npm run lint` exits 2 before linting any source file (see
  constraint 4).
- Pre-existing: `src/app/admin/whatsapp/page.tsx:39` contains one em dash, noted
  by the parallel agent as left for this work. It disappears when the page is
  rebuilt in Stage 3.
- The brief references two attached mockups (overview dashboard, conversation
  inbox). **No image was attached to the session that produced this document.**
  The implementation therefore follows the brief's written design direction
  (sections 7-20) plus the existing Growth Ledger tokens. If the mockups are
  supplied later, re-check spacing, card styling and the green accent system
  against them.
- `whatsapp_conversations.contact_id` is `unique`, so a contact can only ever
  have one conversation. Worth revisiting before campaigns, but not changed here
  because the constraint is load-bearing for the webhook's upsert.

## Next Exact Task

Build the shell: `src/components/whatsapp/layout/` (`nav.ts`, `icons.tsx`,
`WhatsAppSidebar.tsx`, `WhatsAppTopbar.tsx`, `WhatsAppShell.tsx`) and
`src/app/admin/whatsapp/layout.tsx`, then register new routes in
`src/lib/route-governance.json`.

## Do Not Touch

TikTok scheduler and associated files:

- `src/lib/scheduler/**`, `src/lib/tiktok*.ts`
- `src/app/api/tiktok/**`, `src/app/api/scheduler/**`
- `src/app/scheduler/**`, `src/app/connect/tiktok/**`
- `src/components/scheduler/**`
- TikTok environment variables and migrations

Also treated as read-only:

- `src/app/admin/whatsapp/auth.ts` and
  `src/app/admin/whatsapp/dashboard.test.ts` (parallel agent's in-flight work)
- `src/lib/emergency.ts`, `src/components/Header.tsx`, `next.config.mjs`,
  `package.json`, `eslint.config.mjs`
- `src/app/automation/**`, `src/components/automation/**`,
  `src/app/admin/waitlist/**`, `src/lib/waitlist/**` (completed parallel feature)
