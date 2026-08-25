# Web Growth Automation Waitlist Progress

Resume document for the `/automation` waitlist landing page. Written so a fresh
session can continue without re-auditing the repository.

## Current Stage

**Complete.** All 20 build stages are done and every verification pass that can
run on this machine has run. Page, form, API, database, email, admin dashboard,
analytics, SEO, styling and motion are in place; accessibility, responsive,
performance, regression-boundary and lint/typecheck/build checks have all been
executed and their results are recorded below.

Three items remain that are **environmentally impossible here, not unfinished**:
live form submission, live email delivery, and a live RLS probe. All three need
credentials that exist only in Vercel. See Known Issues.

## Audit Result (Stage 1, complete)

Branch confirmed `main`. All infrastructure needed already exists and is reused:

| Concern | Existing system | Location |
| --- | --- | --- |
| Transactional email | Brevo | `src/lib/email.ts` (`sendTransactionalEmail`) |
| Rate limit / origin / sanitize | in-memory + helpers | `src/lib/security.ts` |
| Spam challenge | Cloudflare Turnstile | `src/lib/turnstile.ts`, `src/components/TurnstileWidget.tsx` |
| Database | Supabase, service role only | pattern in `src/lib/scheduler/supabase.ts` |
| RLS convention | `enable row level security` + **zero policies** = service-role only | `supabase/migrations/202608130001_whatsapp_crm.sql` |
| SEO metadata | `buildPageMetadata()` | `src/lib/seo.ts` |
| Analytics | `trackEvent()` to GA, params sanitized/truncated | `src/lib/analytics.ts` |
| Admin auth | sealed cookie + unlock form | `src/lib/internalUtilityAuth.ts`, `src/components/internal/InternalUtilityUnlockForm.tsx` |
| Motion | CSS keyframes + `IntersectionObserver` (GSAP exists but was not needed) | `src/app/globals.css`, `src/components/automation/AutomationMotion.tsx` |
| Design system | "Growth Ledger" + per-page CSS namespace | `src/app/globals.css` |

Hard constraints discovered:

1. **`scripts/validate-sitemap.mjs` fails the build on any ungoverned App Router
   page.** Every new `page.tsx` MUST be registered in
   `src/lib/route-governance.json`. `INDEX` requires `sitemap: true`;
   non-`INDEX` requires `sitemap: false`.
2. **`trailingSlash: true`** in `next.config.mjs`. All routes, canonicals and
   internal `fetch` calls need trailing slashes.
3. **Zod is not installed.** Validation uses existing `src/lib/security.ts`
   helpers instead of adding a dependency.
4. **`@react-email/components` is not installed** and the `@/*` alias maps only
   to `src/*`. The email template therefore lives at
   `src/emails/automation-waitlist-confirmation.ts` as a plain TS function
   returning `{ subject, text, html }`, the exact shape
   `sendTransactionalEmail()` already accepts.
5. **`LOW_CPU_EMERGENCY_MODE = true`** in `src/lib/emergency.ts` currently 503s
   `/api/get-started`, `/api/ai`, `/api/health/db` before any work.
6. **No `typecheck` script** in `package.json`. Use `npx tsc --noEmit`. There is
   also no generic `test` script; run new tests with `npx tsx --test <path>`
   rather than editing `package.json`, which the parallel agent may also be
   touching.
7. **`.env.local` holds no Supabase credentials.** `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` are set in Vercel only. Local `npm run dev`
   therefore cannot write to the waitlist; the route returns a clean 503 by
   design. Also means the anon key is not available locally for a live RLS probe.
8. **The stylesheet avoids `color-mix()`, `:has()` and `clip-path`.** A grep of
   all 5,810 pre-existing lines found one occurrence in total. The
   `automation-*` block therefore uses pre-computed hex tints and
   adjacent-sibling selectors so nothing essential (the radio indicator in
   particular) depends on newer selector support.
9. **Large content must be written with Write/Edit, never a Bash heredoc.** A
   heredoc carrying the CSS block hit `ENAMETOOLONG` from `uv_spawn` on this
   Windows environment.
10. **Playwright's own browser binaries are not installed** and `ms-playwright`
    does not exist. Verification scripts must use
    `chromium.launch({ channel: "chrome" })` against system Chrome. Do not run
    `npx playwright install`; adding or fetching dependencies is out of scope.

## Approved Decisions

Confirmed with the repository owner before implementation:

- **Emergency mode:** the waitlist API is **deliberately exempt** from
  `LOW_CPU_EMERGENCY_MODE` so the waitlist works while the flag stays `true`.
  `src/lib/emergency.ts` and its three existing consumers are left untouched.
- **Migration:** applied via Supabase CLI (v2.113.0, linked to project
  `ockqdqlmzilrnilclwwa`). A `--dry-run` is inspected first; if anything other
  than the waitlist migration is pending, stop and ask rather than applying
  another agent's work.
- **Spam protection:** honeypot + rate limit + Turnstile (matches every other
  form on the site; Turnstile is already configured and free).
- **Navigation:** footer link only. `Header.tsx` is left untouched.
- **Schema:** `SoftwareApplication` with no `offers` / `aggregateRating`, so
  nothing implies public availability pre-launch.
- **Punctuation:** the deliverable contains no em dashes. Prose uses colons,
  commas, parentheses or full stops; a byline uses `&middot;`; the "no value
  recorded" table placeholder is a single shared en dash constant, `NO_VALUE` in
  `src/lib/waitlist/schema.ts`. Numeric ranges keep en dashes ("2-5 people" is
  stored as `2–5 people`), which is correct typography for a range.

## Completed

- Stage 1: repository and infrastructure audit.
- Stage 2: this progress document.
- Stage 3: static semantic landing-page structure, `src/app/automation/page.tsx`
  plus 11 section components under `src/components/automation/`, and
  `/automation/` registered in `src/lib/route-governance.json`.
- Stage 7: database migration written **and applied** to the linked project.
- Stage 8: shared validation contract (`src/lib/waitlist/schema.ts`).
- Stage 9: server-only data access (`src/lib/waitlist/store.ts`).
- Stage 10: confirmation email template + email logo asset.
- Stage 11: waitlist API route with the full anti-abuse pipeline.
- Stage 13: `/admin/waitlist` dashboard, `page.tsx`, its own `auth.ts`, pure
  `dashboard.ts` helpers and `dashboard.test.ts` (14 tests, all passing).
- Design system: the complete `automation-*` CSS namespace appended to
  `src/app/globals.css` (~1,550 lines), every rule scoped under
  `.automation-page`.
- Motion: CSS keyframes gated behind `.automation-motion-ready`, driven by
  `IntersectionObserver` so animation only runs while a section is on screen,
  with a final `prefers-reduced-motion` block that neutralises every
  animation, transition and transform.
- Analytics: the six required events, with no name, email, business name or
  use-case text ever passed as a parameter.
- SEO: title, description, canonical, OG/Twitter and `SoftwareApplication`
  schema; `/automation/` `INDEX`, `/admin/waitlist/` `NOINDEX`.
- Footer link, `.env.local.example` documentation, and a backwards-compatible
  `containerClassName` prop on the shared `TurnstileWidget`.
- **Verification passes: accessibility, responsive, performance, motion,
  regression boundary, lint, typecheck, build.** Results under Testing Completed.

## In Progress

Nothing. See Known Issues for the three checks that require Vercel credentials.

## Files Created

- `docs/automation-waitlist-progress.md`
- `supabase/migrations/202608250001_automation_waitlist.sql`
- `src/lib/waitlist/schema.ts`
- `src/lib/waitlist/store.ts`
- `src/emails/automation-waitlist-confirmation.ts`
- `src/app/api/automation-waitlist/route.ts`
- `src/app/automation/page.tsx`
- `src/components/automation/AutomationHero.tsx`
- `src/components/automation/ProductPreview.tsx`
- `src/components/automation/WhatsAppSection.tsx`
- `src/components/automation/TikTokSection.tsx`
- `src/components/automation/WorkflowSection.tsx`
- `src/components/automation/BenefitsSection.tsx`
- `src/components/automation/EarlyAccessSteps.tsx`
- `src/components/automation/WaitlistSection.tsx`
- `src/components/automation/WaitlistForm.tsx`
- `src/components/automation/AutomationFaq.tsx`
- `src/components/automation/AutomationMotion.tsx`
- `src/components/automation/AutomationTracking.tsx`
- `src/components/automation/analytics.ts`
- `src/app/admin/waitlist/page.tsx`
- `src/app/admin/waitlist/auth.ts`
- `src/app/admin/waitlist/dashboard.ts`
- `src/app/admin/waitlist/dashboard.test.ts`
- `public/email/web-growth-logo.png`

Four throwaway Playwright verification scripts (`scripts/tmp-automation-*.mjs`)
and a `tmp-automation-shots/` screenshot directory were created during the
verification passes and have been **deleted**. They were never imported by
anything and never submitted the form, so they produced no database rows and no
email.

## Files Modified

Targeted, additive changes only. No shared file was rewritten.

Feature work:

- `src/app/globals.css`: appended the `automation-*` block after the final
  `.trust-button` reduced-motion rule. Verified purely additive before the
  punctuation pass: `git diff --numstat` reported **1,571 insertions, 0
  deletions**, so no other page's styles were disturbed.
- `src/lib/route-governance.json`: two added lines (`/automation/` INDEX,
  `/admin/waitlist/` NOINDEX).
- `src/components/Footer.tsx`: one added array entry,
  `Automation Platform (Coming Soon)`, in the Resources column.
- `src/components/TurnstileWidget.tsx`: new optional `containerClassName` prop
  defaulting to the previously hardcoded dark classes, so every existing caller
  renders byte-identically.
- `.env.local.example`: widened one comment and added a documentation-only
  block listing the variable **names** the waitlist reuses. No values.

Accessibility fixes found during verification (detail under Testing Completed):

- `src/components/automation/AutomationHero.tsx`: removed `data-automation-reveal`
  from the two hero elements so above-the-fold content is never opacity-0 while
  waiting for an observer.
- `src/app/globals.css`: `.automation-step-number` recoloured from
  `--ledger-tint` to `--ledger-bright`.

Punctuation pass (owner request, whole repository):

- Feature files: 11 code comments plus 5 visitor-facing strings in
  `BenefitsSection.tsx`, `EarlyAccessSteps.tsx`, `WhatsAppSection.tsx`,
  `WorkflowSection.tsx` and the `/automation` meta description.
- Shared placeholder: `NO_VALUE` added to `src/lib/waitlist/schema.ts` and used
  by `dashboard.ts`, `page.tsx` and `dashboard.test.ts`, so the admin table and
  the label helpers cannot drift apart.
- Pre-existing files outside the feature: `src/components/FounderProfile.tsx`,
  `src/app/blog/BlogClient.tsx` (2), `src/app/thank-you/page.tsx`,
  `src/components/scheduler/PostApprovalPanel.tsx` (a cosmetic `<span>` label
  only, re-verified by the 278 scheduler tests), and 13 pre-existing CSS
  comments in `src/app/globals.css` plus one decorative bullet character in
  `.approved-advantage-copy span::before`.
- Published blog content, 12 occurrences across 7 posts in `content/blog/`:
  `why-your-website-isnt-getting-leads.md` (3),
  `08-results-mistakes-and-reusable-playbook.md` (2),
  `email-automation-architecture.md` (2), and one each in
  `email-marketing-for-small-business.md`,
  `how-to-make-your-website-load-fast.md`,
  `measure-ai-search-visibility-ga4-search-console.md`,
  `namecheap-domain-and-hosting-guide.md`,
  `small-business-website-seo-checklist.md`. Prose and frontmatter only.
  `why-your-website-isnt-getting-leads.md` had the dash in its `title`,
  `coverAlt` and `<h1>`, now consistently "Why Your Website Is Not Getting
  Leads, and What to Fix First". Its `seoTitle` never contained a dash and is
  unchanged, the slug is unchanged, and all three inbound links elsewhere in the
  repo use the short label plus the slug, so no cross-reference broke.
- `.github/copilot-instructions.md` (4), semicolons.
- `.env.local.example` (2), in comments this work had itself added
  (`Service-role only:` and `by design:`).

**Search caveat worth knowing for any future sweep.** Ripgrep, and therefore the
agent Grep tool, honours `.gitignore`. `.env.local.example` is git-tracked but
also matches an ignore pattern, so it was invisible to every em dash search and
looked clean while containing two. It surfaced only from reading
`git diff -- .env.local.example` directly. Tracked-but-ignored files can be
enumerated with:

```
git ls-files -i -c --exclude-standard
```

which returns exactly two entries in this repository: `.env.local.example` and
`public/images/victorious.png`. Any repo-wide text sweep should check the first
one by hand.

**Second search caveat, and a real miss it uncovered.** Searching for the literal
`—` character misses HTML entities, which render identically in a browser. Three
`&mdash;` entities were found only after the owner clarified that the goal was
visitor-visible dashes, and all three were on rendered pages:

- `src/components/home/ApprovedHomepage.tsx:105`, homepage hero paragraph.
- `src/components/home/ApprovedHomepage.tsx:243`, homepage advantage section.
- `src/components/automation/WaitlistForm.tsx:209`, the waitlist success message
  shown when the confirmation email failed.

All three replaced with commas. Any future sweep must search
`&mdash;|&#8212;|&#x2014;|\\u2014` alongside the literal character.

**Authoritative verification.** Rather than trusting source searches, the built
output was scanned directly. Across every prerendered `.html` and `.body` file in
`.next/server/app`, counting the literal character and all three entity forms:
**0 em dashes.** Nothing renders an em dash on the live site.

En dashes (`–`) deliberately remain, and are correct typography rather than
oversights: the business-size ranges in `src/lib/waitlist/schema.ts:26-28`
(`2–5 people`, `6–20 people`, `21–50 people`), matching the brief's own wording;
`NO_VALUE = "–"` as the admin table's empty-cell placeholder; the decorative
bullet in `.approved-advantage-copy span::before`; and pre-existing numeric
ranges in blog prose such as `10–20 businesses`.

**Deliberately excluded:** `docs/WHATSAPP-INTEGRATION.md` (4 occurrences) and
`src/app/admin/whatsapp/page.tsx:39` (1). Both belong to the WhatsApp work the
parallel agent is actively building, and `page.tsx` is uncommitted, so editing
either risks a lost-update collision. These are the only em dashes left in the
repository.


Untouched, and belonging to the parallel agent: `src/app/admin/whatsapp/page.tsx`,
`src/app/admin/whatsapp/auth.ts`, `src/app/admin/whatsapp/dashboard.test.ts`.
**`src/app/admin/whatsapp/page.tsx:39` still contains one em dash.** It was left
alone deliberately: the file is uncommitted and in flight, so editing it risks a
lost-update collision. The owner or that agent should apply the same replacement.

## Database Changes

`public.automation_waitlist` **created on the linked project** by
`supabase/migrations/202608250001_automation_waitlist.sql`.

- Columns: `id, full_name, email, business_name, interest, use_case,
  business_size, source, status, consent_at, consent_source,
  confirmation_email_status, confirmation_email_sent_at, created_at, updated_at`.
- Check constraints on `interest`, `business_size`, `status`,
  `confirmation_email_status`.
- Defaults: `status = 'waitlisted'`, `source` and `consent_source` =
  `automation_waitlist_landing_page`, `consent_at = now()`.
- `automation_waitlist_email_key` unique on `(email)`, a **plain column** index,
  because PostgREST cannot use a functional index as an `on_conflict` target.
  The server lowercases every address in `validateWaitlistSubmission()`.
- Indexes on `(created_at desc)` and `(interest, created_at desc)`.
- **RLS enabled with zero policies**, plus `revoke all` from `anon` and
  `authenticated`. Access is only possible with the service role key,
  server-side.

Verification: `supabase migration list --linked` reports `202608250001` with
`local` = `remote`, and every earlier migration in sync. A `--dry-run` before the
push listed only this migration, so no other agent's work was applied.

Duplicate handling: `saveWaitlistSignup()` omits `created_at`, `consent_at`,
`consent_source`, `source` and `status` from the upsert payload. On insert those
take column defaults; on conflict they are absent from the generated
`UPDATE SET` and keep their original values. Resubmitting refreshes someone's
stated interest without rewriting their signup history or resetting an
`invited`/`activated` status. The response never differs between a first signup
and a resubmission, so the form cannot be used to discover whether an address is
already on the list.

## Email Configuration

Provider: **Brevo** (existing). Sender read from `BREVO_FROM_EMAIL` at runtime,
never hardcoded, so the sender is whatever is already authenticated.
Subject: `You're on the Web Growth Automation Waitlist`.
Template: `src/emails/automation-waitlist-confirmation.ts`, table-based with
inline styles. Logo is `public/email/web-growth-logo.png` (PNG because Outlook
desktop cannot render WebP, and `/images/*.png` is redirected to `.webp` by
`next.config.mjs`) on a `#0c3327` band because the brand artwork is white.

Failure handling: the signup is persisted **before** the email is attempted, so a
provider outage never loses a lead. The real outcome is written back to
`confirmation_email_status` and returned to the browser as `emailSent`, so the UI
cannot claim a confirmation was sent when it was not. Provider errors are logged
server-side only.

## Testing Completed

### Migration

- `supabase db push --dry-run --linked`: only the waitlist migration pending.
- `supabase db push --linked`: applied, exit 0.
- `supabase migration list --linked`: `202608250001` local = remote.

### Unit tests

- `npx tsx --test src/app/admin/waitlist/dashboard.test.ts`: **14 pass, 0 fail.**
  Covers filter parsing of untrusted query values, filter partitioning, interest
  counts including "both", the seven-day window with an injected clock, empty and
  unparseable input, email-status labels, locale-free dates, and admin auth
  accepting a valid sealed cookie while failing closed on missing, forged,
  rotated-secret and throwing-cookie-store cases.

### Regression boundary

- `npm run test:scheduler`: **278 pass, 0 fail.** Re-run after the one cosmetic
  edit to `src/components/scheduler/PostApprovalPanel.tsx`.
- No file under `src/lib/scheduler/**`, `src/lib/tiktok*.ts`,
  `src/lib/whatsapp/**`, `src/app/api/tiktok/**`, `src/app/api/scheduler/**` or
  `src/app/api/whatsapp/**` was modified.
- The landing page imports nothing from either production system. Its
  demonstrations are pure CSS and markup, so no marketing animation can trigger
  a TikTok post or a WhatsApp send.

### Responsive, real browser at eight widths

System Chrome via Playwright, against a production build. Widths 320, 375, 390,
430, 768, 1024, 1280, 1440:

- Horizontal scroll: **false at every width.**
- Elements overflowing the viewport: **0 at every width.**
- `<h1>` count: **1** at every width.
- Labels vs form controls: **9 labels for 9 controls** at every width.

### Accessibility

- **Contrast:** every `automation-*` text colour resolved against its actual
  ancestor background. `.automation-kicker-invert` 8.00:1,
  `.automation-button-quiet` 8.49:1, `.automation-flow-stage` 5.30:1, all AA.
  An initial sweep flagged these three, but that sweep compared each colour
  against both light and dark backgrounds rather than the one it actually sits
  on; resolving properly cleared them.
- **One real contrast defect, fixed:** `.automation-step-number` rendered the
  visible text "01" to "04" in `--ledger-tint` (#dbe7de) on a white card, which
  is **1.27:1**. The text is not `aria-hidden`, so it is content. Now
  `--ledger-bright` at **5.30:1**, the accent already used by
  `.automation-flow-stage` and `.automation-required`, so the page keeps one
  accent colour.
- **Hero reveal defect, fixed:** the hero copy and visual carried
  `data-automation-reveal`, so the first thing a visitor sees started at
  opacity 0 and depended on an observer callback to appear. Both attributes
  removed; 61 reveals remain on below-the-fold sections, where they belong.
- **Tap targets:** two items measured under 24x24 and both are conformant.
  Each radio `<input>` is 1x1 but sits inside an `.automation-radio` label
  giving a **316x47** activation area and is keyboard focusable, clearing
  SC 2.5.8. The `Privacy Policy` anchor is 85x15 and sits inside a `<p>`
  (`inSentence: true`), covered by SC 2.5.8's explicit **Inline exception**.
  That measurement also confirms the consent statement's Privacy Policy link
  resolves, so it is not a dead link.
- **Focus order (SC 2.4.3) and meaningful sequence (SC 1.3.2):** visual `y`
  order matches DOM order for every real field at both 390px (single column)
  and 1280px (two column). A probe initially reported a mismatch; the sole
  inversion was the honeypot `companyWebsite`, which sits in an
  `aria-hidden="true"` container with `tabIndex={-1}` and `autoComplete="off"`,
  so it is outside the tab order entirely. The mismatch was a query artifact,
  not a defect. A separate probe enumerating genuinely focusable elements
  returned 23 and correctly excluded it.
- **Semantics:** no clickable `<div>`. 35 headings render with motion disabled.

### Motion

- Every keyframe animates only `opacity` and `transform`; transitions add only
  paint-only properties. Nothing animates a layout-triggering property.
- With `prefers-reduced-motion: reduce`: `.automation-motion-ready` is **absent**,
  **0** elements are still animating, **0** elements are visible-but-transparent,
  and **8,760 characters** of text across 35 headings render. The page is fully
  understandable with motion disabled.

### Performance

Production build, system Chrome, 1280x900. Measured with `PerformanceObserver`:

- **CLS 0.0010** (good is under 0.1), unchanged after interaction. This is the
  metric the entrance animations could plausibly have broken; they did not.
- **INP proxy, worst case 121ms** (good is under 200ms). Typing p75 36ms,
  radio 105ms, FAQ toggle 35ms, select 43ms.
- **LCP is a text `<h1>`**, no image and no blocking font, and LCP equals FCP on
  `/automation/`, `/contact/` and `/`, so LCP is gated by first paint rather
  than by anything the page waits on.
- First-party JS transferred: **222 KB vs 218 KB** on the two pre-existing pages,
  so the whole feature adds about **4 KB**.
- Local absolute LCP was 2.5s to 3.6s across runs, consistently around 1s later
  than `/contact/`. The cause is document size: `/automation/` serves **135 KB**
  of HTML against 83 KB for `/contact/` and 109 KB for `/`, which is inherent to
  a 14-section marketing page. These are `next start` numbers on a Windows dev
  box with Clarity in flight and run-to-run spread over 1s; they are not
  representative of Vercel with Brotli and a CDN. Worth re-measuring on a real
  deployment, but there is no page-specific resource cost to remove.

### Static analysis and build

Re-run after the final punctuation pass, so these cover every edit:

- `npx tsc --noEmit`: **exit 0.**
- `npx tsx --test src/app/admin/waitlist/dashboard.test.ts`: **14 pass, 0 fail.**
- `npm run test:scheduler`: **278 pass, 0 fail.**
- `npm run build`: **exit 0**, including `validate-sitemap.mjs` route governance.
- `npx eslint src scripts eslint.config.mjs next.config.mjs postcss.config.mjs`
  (the whole real source tree): **exit 0**, one pre-existing warning in
  `src/components/scheduler/PostStatusPanel.tsx:68`
  (`react-hooks/exhaustive-deps`). That file is not in this diff; it last changed
  in commit `0af7093`. Not caused by this work and deliberately not "fixed".

**Pre-existing failure, documented not fixed:** `npm run lint`, which is bare
`eslint .`, currently exits **2** on this machine before reaching any source
file:

```
Error: ENOENT: no such file or directory, open
'...\.worktrees\codex-whatsapp-admin-access\.next\server\app\about\page.js'
```

The parallel agent created a git worktree at
`.worktrees/codex-whatsapp-admin-access/` containing its own `.next` build
output and a `.codex-temp/node_modules.broken-install/` tree. `eslint.config.mjs`
ignores `.next/**` only at the repository root, and flat config does not read
`.gitignore`, so `eslint .` walks into that worktree and crashes on a stale
artifact. The one-line fix is to change the ignore globs to `**/.next/**` and add
`**/.worktrees/**`, but `eslint.config.mjs` is a shared file and this failure is
not caused by this work, so it was left alone. Linting the real source tree
explicitly (command above) is clean.

### Build output verified

- `.next/server/app/automation.html` prerendered as static (136 KB).
- `/automation/` present in the generated `sitemap-pages.xml` body.
- **No** `admin` URL in any generated sitemap body.
- **No** `noindex` in the built `/automation/` HTML, so the page is indexable.
- `/admin/waitlist/` compiled as a server route, absent from every sitemap.

### Verified in the built output rather than the source

- Hero is free of `data-automation-reveal`; 61 remain elsewhere.
- `data-automation-demo="hero_flow"` intact.
- `--automation-faint` / `#636759` present, 11 references.
- `.automation-step-number` compiled with `var(--ledger-bright)`.
- Exactly one `<h1>`; step numbers 01 to 04 render.

## Known Issues

Cannot be tested from this machine (credentials are Vercel-only), not unfinished:

- **Live form submission.** `.env.local` has no `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY`. The route answers with a clean 503 and logs
  `[automation-waitlist] storage is not configured`. `/admin/waitlist` shows a
  plain "not configured in this environment" panel for the same reason, never a
  fabricated number.
- **Live email delivery.** Same cause. The template, subject, sender resolution
  and failure-status write-back are all exercised by code review only.
- **Live RLS probe.** No anon key locally. RLS is enforced by the migration,
  which uses the identical deny-all pattern as the existing `whatsapp_*` tables.

Real findings worth the owner's attention:

- **Enforcing the CSP would break Turnstile, on `/contact/` as well as
  `/automation/`.** `next.config.mjs:33` sets
  `Content-Security-Policy-Report-Only`, so nothing is blocked today, but the
  Turnstile frame violates the policy as written and the identical report fires
  on the pre-existing `/contact/` page. Pre-existing and out of scope, so
  `next.config.mjs` was left unmodified; fix the policy before switching the
  header to enforcing, or both forms will stop accepting submissions.
- **`LOW_CPU_EMERGENCY_MODE = true`** still 503s the older `/api/get-started`
  lead form. Out of scope here, but worth attention before launch.
- **Field order deviates from the brief.** The brief lists Full Name, Email,
  Business/Brand Name, Primary Interest, How Would You Use It?, Business Size.
  The form renders Business Size fourth, directly after Business Name, so the
  two business facts pair in one row of the two-column grid and the two
  intent fields (Primary Interest, use case) stay adjacent. Visual order matches
  DOM order throughout, so there is no WCAG issue; this is a layout choice, and
  a one-line reorder if the owner prefers the brief's sequence.
- **`src/app/admin/whatsapp/page.tsx:39`** still contains one em dash, and
  **`docs/WHATSAPP-INTEGRATION.md`** contains four. Left to the parallel agent,
  whose in-flight work owns both. Applying the same replacement there is the only
  remaining step to make the repository em-dash-free.
- **`npm run lint` currently exits 2 on this machine, before reaching any source
  file.** `eslint .` walks into the parallel agent's git worktree at
  `.worktrees/codex-whatsapp-admin-access/` and crashes on a stale `.next`
  artifact there, because `eslint.config.mjs` ignores `.next/**` only at the
  repository root and flat config does not read `.gitignore`. Not caused by this
  work, and `eslint.config.mjs` is shared, so it was left alone. See the lint
  entry under Testing Completed for the explicit-path command that lints the real
  source tree cleanly, and for the one-line config fix if the owner wants it.
- `src/lib/secureCookie.ts` emits Node's `DEP0182` AES-GCM auth-tag-length
  deprecation warning during tests. Pre-existing, unrelated, left alone.

## Next Exact Task

None for this feature. It is ready for review and deployment.

On a real deployment, verify in this order: submit the form once and confirm a
row appears in `automation_waitlist` with `confirmation_email_status = 'sent'`;
confirm the email arrives with the correct subject and a working
`Visit Web Growth` button; resubmit the same address and confirm no duplicate
row and no changed `created_at`; load `/admin/waitlist` and confirm the counts
match the table; re-measure LCP on the deployed URL.

## Do Not Touch

- TikTok Scheduler internals (`src/lib/scheduler/**`, `src/lib/tiktok*.ts`,
  `src/app/api/tiktok/**`, `src/app/api/scheduler/**`, `src/app/scheduler/**`,
  `src/app/connect/tiktok/**`)
- WhatsApp Business API internals (`src/lib/whatsapp/**`,
  `src/app/api/whatsapp/**`)
- Another agent's in-flight work: `src/app/admin/whatsapp/page.tsx`,
  `src/app/admin/whatsapp/auth.ts`, `src/app/admin/whatsapp/dashboard.test.ts`
- `src/lib/emergency.ts` and its three existing consumers
- `src/components/Header.tsx`
- `next.config.mjs`, including the report-only CSP noted above
- `package.json`. No dependency or script changes were needed, and the parallel
  agent may be editing it.
