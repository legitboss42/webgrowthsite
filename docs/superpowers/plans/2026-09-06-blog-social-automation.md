# Blog-to-Social Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically turn each genuinely new Web Growth blog post into a rendered short-form video, auto-publish it to the connected Facebook Page and Instagram professional account, and create a compliant TikTok scheduler draft that waits for the required creator consent.

**Architecture:** GitHub Actions detects added Markdown articles and performs the heavy Remotion render. The Next.js application exposes signed internal automation endpoints, Meta OAuth/admin surfaces, and platform publishers. Supabase stores automation jobs, connection metadata, publication state, audit data, and rendered media while the existing TikTok scheduler remains the final Direct Post boundary.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Remotion 4, Edge TTS, Supabase Postgres/Storage, GitHub Actions, Meta Graph API, existing TikTok Content Posting API integration.

**Spec:** `docs/superpowers/specs/2026-09-06-blog-social-automation-design.md`

## Global Constraints

- Only Git change status `added` under `content/blog/*.md` triggers automatic social creation.
- Editing, renaming, or deleting an existing article never auto-reposts it.
- Facebook and Instagram are unattended after a valid connection exists.
- TikTok generation is automatic, but the existing `NEEDS_APPROVAL` consent/publish flow remains mandatory.
- No required paid API or new recurring paid service may be introduced.
- GitHub-hosted standard runners perform Remotion rendering; do not move rendering onto Vercel Functions.
- Default rendered-asset retention is 7 days after terminal publication state.
- Production article availability is checked for at most 15 minutes before the job moves to `NEEDS_ATTENTION`.
- New public-schema Supabase tables have RLS enabled and no permissive browser policies by default.
- Meta tokens are encrypted server-side; raw secrets never enter client bundles, logs, documentation, or provider error payloads.
- One platform failure must not block successful work on another platform.
- No production deployment, production migration application, or production environment-variable change occurs until all code/tests/docs are complete and the user explicitly approves the single deployment.

---

## File map

### New social-automation domain files
- `src/lib/socialAutomation/types.ts` — shared article, job, publication, connection, render-profile types.
- `src/lib/socialAutomation/article.ts` — normalize a `Post` into a deterministic social source object and enforce publishability.
- `src/lib/socialAutomation/article.test.ts` — article eligibility/normalization tests.
- `src/lib/socialAutomation/copy.ts` — deterministic Instagram/Facebook/TikTok copy generation.
- `src/lib/socialAutomation/copy.test.ts` — platform copy tests and TikTok promotional-overlay guard tests.
- `src/lib/socialAutomation/renderProfile.ts` — map `META`/`TIKTOK` to branding/CTA behavior.
- `src/lib/socialAutomation/renderProfile.test.ts` — profile invariants.
- `src/lib/socialAutomation/crypto.ts` — Meta token envelope encryption/decryption using the existing secure-cookie primitive and a dedicated key.
- `src/lib/socialAutomation/crypto.test.ts` — round-trip/tamper/missing-key tests.
- `src/lib/socialAutomation/metaClient.ts` — transport-injected Graph API client for OAuth/account discovery and publishing.
- `src/lib/socialAutomation/metaClient.test.ts` — request-shape, processing, retry classification, and sanitization tests.
- `src/lib/socialAutomation/store.ts` — server-only Supabase store for jobs, publications, settings, connections, media and audit events.
- `src/lib/socialAutomation/orchestrator.ts` — idempotent state transitions, independent platform publication, article-availability gate, retry classification.
- `src/lib/socialAutomation/orchestrator.test.ts` — pure/fake-store orchestration tests.
- `src/lib/socialAutomation/tiktokBridge.ts` — create a VIDEO `scheduled_posts` record plus valid media linkage in `NEEDS_APPROVAL`.
- `src/lib/socialAutomation/tiktokBridge.test.ts` — owner/media/post linkage and idempotency tests.
- `src/lib/socialAutomation/internalAuth.ts` — HMAC verification for GitHub Action requests.
- `src/lib/socialAutomation/internalAuth.test.ts` — signature/replay/failure tests.

### Existing rendering files
- Modify `src/remotion/components/WebGrowthArticleVideo.tsx` — accept a platform profile and hide branding/URL/CTA/presenter where the TikTok profile requires it.
- Modify `src/remotion/Root.tsx` — register deterministic social compositions/default props.
- Create `scripts/render-social-article.mjs` — reusable dual-profile render CLI derived from the existing article renderer.
- Keep `scripts/render-article-video.mjs` working as a compatibility entry point or delegate it to the shared implementation.

### Supabase
- Create migration via `supabase migration new blog_social_automation`, then populate the generated file under `supabase/migrations/`.
- Add SQL regression coverage under `supabase/tests/blog_social_automation.sql` if the local Supabase test harness supports it; otherwise add schema contract assertions in `src/lib/socialAutomation/schema.test.ts` against the committed SQL text.

### Next.js routes/UI
- `src/app/api/internal/social-automation/jobs/route.ts` — signed job creation/upsert boundary used by GitHub Actions.
- `src/app/api/internal/social-automation/assets/route.ts` — signed rendered-asset registration boundary.
- `src/app/api/internal/social-automation/publish/route.ts` — signed publication execution/retry boundary.
- `src/app/api/admin/content-automation/meta/connect/route.ts` — admin-only OAuth start.
- `src/app/api/admin/content-automation/meta/callback/route.ts` — OAuth callback/account resolution.
- `src/app/api/admin/content-automation/settings/route.ts` — admin-only settings mutations with same-origin protection.
- `src/app/api/admin/content-automation/jobs/[id]/retry/route.ts` — manual retry boundary.
- `src/app/admin/content-automation/page.tsx` — dashboard.
- `src/app/admin/content-automation/ContentAutomationClient.tsx` — settings/retry/connect UI actions only; data remains server-fetched.
- `src/app/admin/content-automation/auth.ts` — reuse Google admin session validation pattern.
- Modify `src/lib/route-governance.json` — register `/admin/content-automation/` as `NOINDEX`, `sitemap: false`.

### GitHub automation/docs/config
- `.github/workflows/blog-social-automation.yml` — added-file detection, tests, render, upload/register, publish trigger.
- Modify `package.json` — add focused social test/render commands.
- Modify `.env.example` and `.env.local.example` — names only, never secret values.
- Create/update `docs/blog-social-automation.md` — operational setup, required GitHub/Vercel secrets, Meta setup, TikTok consent behavior, retry/storage rules, single-deployment checklist.

---

### Task 1: Normalize articles and generate deterministic platform copy

**Files:**
- Create: `src/lib/socialAutomation/types.ts`
- Create: `src/lib/socialAutomation/article.ts`
- Create: `src/lib/socialAutomation/article.test.ts`
- Create: `src/lib/socialAutomation/copy.ts`
- Create: `src/lib/socialAutomation/copy.test.ts`
- Modify: `src/lib/tiktokPublishing.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `Post` from `@/lib/posts`.
- Produces:
  - `normalizeSocialArticle(post: Post): SocialArticle`
  - `isPublishableSocialArticle(post: Post): boolean`
  - `buildSocialCopy(article: SocialArticle): SocialCopyBundle`
  - `SocialCopyBundle = { instagram: PlatformCopy; facebook: PlatformCopy; tiktok: PlatformCopy }`

- [ ] **Step 1: Write failing normalization tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { isPublishableSocialArticle, normalizeSocialArticle } from "./article";

const base = {
  slug: "seo-checklist",
  title: "Small Business SEO Checklist",
  excerpt: "A practical checklist.",
  content: "## Start here\nFix crawlability before chasing traffic.",
  category: "SEO",
  topic: "Search",
  tags: ["SEO", "Small Business"],
  cover: "/images/blog/seo.webp",
  keyTakeaways: ["Fix crawlability first"],
  steps: ["Check indexing"],
  commonMistakes: ["Ignoring canonicals"],
} as any;

test("normalizes a publishable article", () => {
  assert.equal(isPublishableSocialArticle(base), true);
  assert.deepEqual(normalizeSocialArticle(base).canonicalUrl, "https://webgrowth.info/blog/seo-checklist/");
});

test("reserved template is never publishable", () => {
  assert.equal(isPublishableSocialArticle({ ...base, slug: "_article-template" }), false);
});
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npx tsx --test src/lib/socialAutomation/article.test.ts`
Expected: FAIL because `./article` does not exist.

- [ ] **Step 3: Implement the minimal article model**

```ts
export type SocialArticle = {
  slug: string;
  title: string;
  excerpt: string;
  canonicalUrl: string;
  category: string;
  topic: string;
  tags: string[];
  cover: string;
  keyTakeaways: string[];
  steps: string[];
  commonMistakes: string[];
  prose: string;
};
```

Reject reserved/template slugs and any explicit draft/noindex metadata available on `Post`. Derive the canonical URL with the same site URL helper used elsewhere in the app.

- [ ] **Step 4: Write failing platform-copy tests**

```ts
test("TikTok copy never burns a website CTA into render instructions", () => {
  const bundle = buildSocialCopy(normalizeSocialArticle(base));
  assert.equal(bundle.tiktok.renderCta, "NONE");
  assert.equal(bundle.tiktok.branding, false);
  assert.match(bundle.instagram.caption, /webgrowth\.info/);
  assert.match(bundle.facebook.caption, /webgrowth\.info/);
});
```

- [ ] **Step 5: Implement deterministic copy generation**

Use the existing `buildHashtags()`/hook logic from `src/lib/tiktokPublishing.ts` as the source behavior, then make the TikTok module call the new shared generator rather than maintain a second divergent copy engine.

- [ ] **Step 6: Run social content tests**

Run: `npx tsx --test src/lib/socialAutomation/article.test.ts src/lib/socialAutomation/copy.test.ts`
Expected: PASS.

- [ ] **Step 7: Add the package script and commit**

Add:

```json
"test:social": "tsx --test src/lib/socialAutomation/*.test.ts"
```

Commit:

```bash
git add src/lib/socialAutomation src/lib/tiktokPublishing.ts package.json package-lock.json
git commit -m "feat: add deterministic blog social content model"
```

---

### Task 2: Add platform-safe Remotion profiles and dual rendering

**Files:**
- Create: `src/lib/socialAutomation/renderProfile.ts`
- Create: `src/lib/socialAutomation/renderProfile.test.ts`
- Modify: `src/remotion/components/WebGrowthArticleVideo.tsx`
- Modify: `src/remotion/Root.tsx`
- Create: `scripts/render-social-article.mjs`
- Modify: `scripts/render-article-video.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces `resolveRenderProfile(profile: "META" | "TIKTOK"): { branding: boolean; articleCta: boolean; showPresenter: boolean; showWebsiteText: boolean }`.
- `WebGrowthArticleVideoProps` gains `platformProfile?: "META" | "TIKTOK"`.
- Render CLI: `node scripts/render-social-article.mjs <slug> --out-dir <dir>` creates `meta.mp4`, `tiktok.mp4`, `manifest.json`, audio/subtitle artifacts.

- [ ] **Step 1: Write profile tests**

```ts
test("TikTok profile removes promotional overlays", () => {
  assert.deepEqual(resolveRenderProfile("TIKTOK"), {
    branding: false,
    articleCta: false,
    showPresenter: false,
    showWebsiteText: false,
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npx tsx --test src/lib/socialAutomation/renderProfile.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement profile resolution and wire the composition**

In `WebGrowthArticleVideo.tsx`, resolve the profile once and conditionally render every brand/logo/URL/presenter/CTA element. Do not rely on CSS opacity for prohibited TikTok overlays; do not render those nodes at all.

- [ ] **Step 4: Register social compositions**

Add composition IDs:

```tsx
<Composition id="WebGrowthSocialMeta" component={WebGrowthArticleVideo} defaultProps={{ ...defaultProps, platformProfile: "META" }} ... />
<Composition id="WebGrowthSocialTikTok" component={WebGrowthArticleVideo} defaultProps={{ ...defaultProps, platformProfile: "TIKTOK" }} ... />
```

- [ ] **Step 5: Refactor the current renderer into reusable helpers**

Move script/caption/scene generation to the shared Task 1 domain. `render-social-article.mjs` should synthesize narration once, write subtitle timing once, then render the two profiles with different props. The old `render-article-video.mjs` should delegate to shared functions or preserve its old output path for compatibility.

- [ ] **Step 6: Render a real fixture article locally**

Run:

```bash
node scripts/render-social-article.mjs 01-why-we-rebuilt-not-redesigned --out-dir out/social-test
```

Expected:
- `out/social-test/meta.mp4`
- `out/social-test/tiktok.mp4`
- `out/social-test/manifest.json`
- both videos are 1080x1920 and non-empty.

- [ ] **Step 7: Add script and commit**

```json
"social:render": "node scripts/render-social-article.mjs"
```

Commit:

```bash
git add src/lib/socialAutomation/renderProfile* src/remotion scripts/render-social-article.mjs scripts/render-article-video.mjs package.json package-lock.json
git commit -m "feat: add Meta and TikTok-safe social video renders"
```

---

### Task 3: Add the Supabase social-automation schema without touching production

**Files:**
- Create: generated `supabase/migrations/<timestamp>_blog_social_automation.sql`
- Create: `src/lib/socialAutomation/schema.test.ts` if no local SQL harness is practical.

**Interfaces:**
- Tables: `social_automation_jobs`, `social_publications`, `social_connections`, `social_automation_settings`, `social_media_assets`, `social_automation_audit_log`.
- Storage bucket: `social-automation` created as private; public delivery is via signed URLs or a narrow server delivery route where Meta requires fetch access.

- [ ] **Step 1: Create the migration file with the Supabase CLI**

Run:

```bash
supabase migration new blog_social_automation
```

Do not invent a migration filename manually.

- [ ] **Step 2: Write schema contract assertions before filling the migration**

The test must verify the migration text contains:

```ts
for (const table of [
  "social_automation_jobs",
  "social_publications",
  "social_connections",
  "social_automation_settings",
  "social_media_assets",
  "social_automation_audit_log",
]) {
  assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
}
assert.match(sql, /unique\s*\(idempotency_key\)/i);
assert.match(sql, /unique\s*\(job_id,\s*platform\)/i);
```

- [ ] **Step 3: Implement the additive schema**

Use CHECK constraints for enumerated platform/status values. `social_connections.encrypted_tokens` is required but never selectable by browser roles. Revoke public Data API access where needed and rely on service-role server reads.

Default settings row:

```sql
insert into public.social_automation_settings
  (singleton_id, enabled, instagram_enabled, facebook_enabled, tiktok_generation_enabled, asset_retention_days, default_timezone)
values
  (true, true, true, true, true, 7, 'Africa/Lagos')
on conflict (singleton_id) do nothing;
```

- [ ] **Step 4: Verify migration safety**

Run the local schema test. If a local Supabase stack is available, also run the migration there and inspect policies/constraints. Do **not** apply to linked production Supabase yet.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations src/lib/socialAutomation/schema.test.ts
git commit -m "feat: add blog social automation schema"
```

---

### Task 4: Add secure Meta token encryption and the social store

**Files:**
- Create: `src/lib/socialAutomation/crypto.ts`
- Create: `src/lib/socialAutomation/crypto.test.ts`
- Create: `src/lib/socialAutomation/store.ts`
- Create: `src/lib/socialAutomation/store.test.ts`

**Interfaces:**
- `encryptMetaTokens(payload: MetaTokenPayload): string`
- `decryptMetaTokens(ciphertext: string): MetaTokenPayload | null`
- `createSocialAutomationStore()` returns server-only CRUD methods for jobs/publications/connections/settings/assets/audit rows.

- [ ] **Step 1: Write crypto tests**

```ts
test("Meta token envelope round trips", () => {
  process.env.META_TOKEN_ENCRYPTION_KEY = "test-key-long-enough-for-test";
  const encrypted = encryptMetaTokens({ accessToken: "secret", connectedAt: "2026-09-06T00:00:00Z" });
  assert.equal(decryptMetaTokens(encrypted)?.accessToken, "secret");
});
```

Also test tampering returns null and missing encryption key throws.

- [ ] **Step 2: Implement crypto using `sealCookiePayload` / `openCookiePayload`**

Follow `src/lib/scheduler/crypto.ts`, but use a dedicated `META_TOKEN_ENCRYPTION_KEY`; never reuse the TikTok key.

- [ ] **Step 3: Write fake-client store tests**

Test idempotent job insert/read, per-platform publication upsert, and that the connection read method only returns decrypted tokens to server callers.

- [ ] **Step 4: Implement the store**

Use `createSchedulerSupabaseClient()` as the existing service-role client. Keep table-specific selectors explicit so token columns are not accidentally returned to UI data loaders.

- [ ] **Step 5: Run and commit**

Run: `npm run test:social`
Expected: PASS.

Commit:

```bash
git add src/lib/socialAutomation/crypto* src/lib/socialAutomation/store*
git commit -m "feat: add secure social automation persistence"
```

---

### Task 5: Add a transport-injected Meta Graph API client

**Files:**
- Create: `src/lib/socialAutomation/metaClient.ts`
- Create: `src/lib/socialAutomation/metaClient.test.ts`

**Interfaces:**

```ts
export type MetaClient = {
  exchangeCode(code: string, redirectUri: string): Promise<MetaTokenPayload>;
  resolveManagedPage(accessToken: string): Promise<MetaPageConnection>;
  createInstagramReel(input: { accessToken: string; igUserId: string; videoUrl: string; caption: string }): Promise<string>;
  readInstagramContainer(input: { accessToken: string; containerId: string }): Promise<"IN_PROGRESS" | "FINISHED" | "ERROR">;
  publishInstagramContainer(input: { accessToken: string; igUserId: string; containerId: string }): Promise<string>;
  publishFacebookReel(input: { pageAccessToken: string; pageId: string; videoUrl: string; description: string }): Promise<string>;
};
```

- [ ] **Step 1: Write request-shape tests with a fake `fetch`**

Assert Graph requests use the configured API version, encode captions correctly, never place access tokens in application logs, and classify provider 5xx/429 as retryable.

- [ ] **Step 2: Implement the client**

All HTTP goes through an injected fetcher. Add `sanitizeMetaError()` that exposes provider code/status but strips token/query/body secrets.

- [ ] **Step 3: Add Instagram processing-state tests**

Test `FINISHED` proceeds, `IN_PROGRESS` returns a retryable/poll result, and provider `ERROR` becomes `NEEDS_ATTENTION` with sanitized detail.

- [ ] **Step 4: Run and commit**

Run: `npx tsx --test src/lib/socialAutomation/metaClient.test.ts`
Expected: PASS.

Commit:

```bash
git add src/lib/socialAutomation/metaClient*
git commit -m "feat: add Meta publishing client"
```

---

### Task 6: Add signed internal automation boundaries and idempotent orchestration

**Files:**
- Create: `src/lib/socialAutomation/internalAuth.ts`
- Create: `src/lib/socialAutomation/internalAuth.test.ts`
- Create: `src/lib/socialAutomation/orchestrator.ts`
- Create: `src/lib/socialAutomation/orchestrator.test.ts`
- Create: `src/app/api/internal/social-automation/jobs/route.ts`
- Create: `src/app/api/internal/social-automation/assets/route.ts`
- Create: `src/app/api/internal/social-automation/publish/route.ts`

**Interfaces:**
- Header contract: `x-wg-timestamp`, `x-wg-signature`, body bytes.
- Signature: HMAC-SHA256 over `${timestamp}.${rawBody}` with `SOCIAL_AUTOMATION_WEBHOOK_SECRET`.
- Reject timestamps outside ±5 minutes.
- Orchestrator supports `createJob`, `registerAssets`, `publishReadyJob`, `retryJob`.

- [ ] **Step 1: Write signature tests**

```ts
test("rejects stale signed requests", () => {
  assert.equal(verifyInternalRequest({ timestamp: "1", signature: "deadbeef", body: "{}", nowMs: Date.now() }), false);
});
```

- [ ] **Step 2: Implement constant-time signature verification**

Use `timingSafeEqual`; never compare secrets with plain string equality.

- [ ] **Step 3: Write orchestration tests**

Cover:
- duplicate idempotency key returns existing job;
- Instagram failure still allows Facebook and TikTok preparation;
- TikTok `NEEDS_APPROVAL` is a successful terminal preparation, not a job failure;
- article availability retries stop after the 15-minute deadline;
- disabled platforms create `SKIPPED` publication state.

- [ ] **Step 4: Implement the orchestrator against injected store/client functions**

Avoid framework calls inside the domain. Route handlers perform authentication/body parsing and delegate.

- [ ] **Step 5: Implement signed route handlers**

Read `request.text()` before JSON parsing so HMAC verification covers exact bytes. Return existing job on duplicate calls rather than `409`.

- [ ] **Step 6: Run and commit**

Run: `npm run test:social`
Expected: PASS.

Commit:

```bash
git add src/lib/socialAutomation/internalAuth* src/lib/socialAutomation/orchestrator* src/app/api/internal/social-automation
git commit -m "feat: add durable social automation boundaries"
```

---

### Task 7: Bridge generated TikTok videos into the existing consent scheduler

**Files:**
- Create: `src/lib/socialAutomation/tiktokBridge.ts`
- Create: `src/lib/socialAutomation/tiktokBridge.test.ts`
- Modify: `src/app/api/scheduler/articles/route.ts`

**Interfaces:**
- `createBlogTikTokDraft(input: { userId: string; article: SocialArticle; storagePath: string; caption: string; checksum: string; byteSize: number; durationSeconds: number }): Promise<{ postId: string; mediaId: string }>`
- New automated VIDEO posts use `status: "NEEDS_APPROVAL"` and existing scheduler tables.

- [ ] **Step 1: Write bridge tests with a fake database**

Assert:
- VIDEO media asset is `VALID` only when supplied by the validated render/upload boundary;
- `article_slug` is persisted;
- post status is `NEEDS_APPROVAL`;
- `post_media.position` is `0`;
- duplicate article/job bridge call returns the existing link instead of creating another post.

- [ ] **Step 2: Implement the bridge using existing scheduler invariants**

Do not bypass creator-info, disclosures, privacy, approval fingerprinting, `SELF_ONLY` gates, or Direct Post submission code.

- [ ] **Step 3: Refactor `/api/scheduler/articles`**

Keep the existing manual article-to-photo behavior working, but reuse Task 1 normalization/copy helpers so manual and automated article content cannot drift.

- [ ] **Step 4: Run scheduler + social tests**

Run:

```bash
npm run test:scheduler
npm run test:social
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/socialAutomation/tiktokBridge* src/app/api/scheduler/articles/route.ts
git commit -m "feat: queue automated blog videos for TikTok consent"
```

---

### Task 8: Add Meta OAuth connection routes and admin settings mutations

**Files:**
- Create: `src/app/admin/content-automation/auth.ts`
- Create: `src/app/api/admin/content-automation/meta/connect/route.ts`
- Create: `src/app/api/admin/content-automation/meta/callback/route.ts`
- Create: `src/app/api/admin/content-automation/settings/route.ts`
- Create: `src/app/api/admin/content-automation/jobs/[id]/retry/route.ts`
- Create: route/model tests alongside the social domain as practical.

**Interfaces:**
- Admin auth reuses the existing Google admin session validation.
- Mutation routes require `isSameOriginMutation()`.
- OAuth state is signed/sealed and short-lived.

- [ ] **Step 1: Add tests for unauthenticated/admin/origin boundaries**

Expected matrix:
- no admin session → 401/redirect to admin sign-in;
- admin session + wrong origin on mutation → 403;
- valid admin session → operation proceeds;
- callback with invalid/expired state → safe failure without storing tokens.

- [ ] **Step 2: Implement `hasContentAutomationAdminAccess()`**

Follow `src/app/admin/whatsapp/auth.ts` / `src/app/admin/waitlist/auth.ts`; do not invent a new account system.

- [ ] **Step 3: Implement OAuth start/callback**

Start route creates state and redirects to Meta. Callback exchanges code, resolves the managed Page and linked IG professional account, encrypts tokens, and persists only safe display metadata plus ciphertext.

- [ ] **Step 4: Implement settings/retry routes**

Whitelist boolean settings and retention bounds; never accept arbitrary table fields from the browser.

- [ ] **Step 5: Run and commit**

Run focused route/model tests, then `npm run test:social`.

Commit:

```bash
git add src/app/admin/content-automation/auth.ts src/app/api/admin/content-automation src/lib/socialAutomation
git commit -m "feat: add Meta connection and automation controls"
```

---

### Task 9: Add the Content Automation admin dashboard

**Files:**
- Create: `src/app/admin/content-automation/page.tsx`
- Create: `src/app/admin/content-automation/ContentAutomationClient.tsx`
- Create: `src/app/admin/content-automation/dashboardModel.ts`
- Create: `src/app/admin/content-automation/dashboardModel.test.ts`
- Modify: `src/lib/route-governance.json`

**Interfaces:**
- Server page loads safe job/publication/connection/settings summaries through the store.
- Client component only performs settings, connect and retry mutations.

- [ ] **Step 1: Write dashboard model tests**

```ts
test("TikTok approval state is presented as action, not failure", () => {
  assert.equal(presentPublication({ platform: "TIKTOK", status: "NEEDS_APPROVAL" } as any).tone, "action");
});
```

Also verify failure/success/skipped states and that token/ciphertext fields cannot be part of the UI model type.

- [ ] **Step 2: Implement responsive dashboard**

Show job title/slug/time, overall state, platform status cards, Meta connection, settings, external links, sanitized errors, and `Publish on TikTok` deep-link to the existing scheduler post.

- [ ] **Step 3: Register route governance**

Add `/admin/content-automation/` as `NOINDEX` and `sitemap: false` in the same schema used by other admin routes.

- [ ] **Step 4: Run UI/static validation**

Run:

```bash
npx tsx --test src/app/admin/content-automation/dashboardModel.test.ts
node scripts/validate-sitemap.mjs
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/content-automation src/lib/route-governance.json
git commit -m "feat: add content automation admin dashboard"
```

---

### Task 10: Add GitHub Actions trigger, render upload, and publication invocation

**Files:**
- Create: `.github/workflows/blog-social-automation.yml`
- Create: `scripts/detect-new-blog-posts.mjs`
- Create: `scripts/social-automation-client.mjs`
- Create: `scripts/social-automation-client.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Detector input: base SHA + head SHA.
- Detector output: newline-safe JSON array of added publishable Markdown paths.
- Client signs requests with `SOCIAL_AUTOMATION_WEBHOOK_SECRET`.

- [ ] **Step 1: Write detector/client tests**

Use fixture name-status input and verify only `A\tcontent/blog/foo.md` is selected; `M`, `R`, `D`, `_article-template.md`, and non-blog files are ignored.

- [ ] **Step 2: Implement detection with `git diff --name-status`**

Do not infer “new” from file timestamps or article dates.

- [ ] **Step 3: Implement the signed client**

```js
const timestamp = String(Date.now());
const body = JSON.stringify(payload);
const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
```

- [ ] **Step 4: Implement the workflow**

The workflow runs only on pushes to `main` touching `content/blog/**`. For each added article:
1. install with `npm ci`;
2. run focused social/scheduler tests;
3. render the two videos;
4. create/upsert the job through the signed API;
5. upload/register media through the signed API/storage mechanism;
6. invoke publication.

Set `concurrency` per article/commit so retries cannot overlap blindly.

- [ ] **Step 5: Keep branch testing non-publishing**

Add `workflow_dispatch` dry-run support for feature-branch validation. The real `push: main` publishing path is not exercised until the final approved deployment/configuration.

- [ ] **Step 6: Run workflow static tests and commit**

Commit:

```bash
git add .github/workflows/blog-social-automation.yml scripts/detect-new-blog-posts.mjs scripts/social-automation-client* package.json package-lock.json
git commit -m "feat: automate new blog social rendering pipeline"
```

---

### Task 11: Add environment documentation, operational docs, and cleanup/health behavior

**Files:**
- Modify: `.env.example`
- Modify: `.env.local.example`
- Create: `docs/blog-social-automation.md`
- Extend: `src/lib/socialAutomation/orchestrator.ts`
- Extend tests: `src/lib/socialAutomation/orchestrator.test.ts`

**Interfaces:**
- Documented vars: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`, `META_GRAPH_API_VERSION`, `META_TOKEN_ENCRYPTION_KEY`, `SOCIAL_AUTOMATION_WEBHOOK_SECRET`, existing Supabase server variables.
- Cleanup selection: terminal media older than `asset_retention_days` and not referenced by a non-terminal publication.

- [ ] **Step 1: Write retention selection tests**

Test 6-day-old terminal media is kept with default 7 days, 8-day-old terminal media is eligible, and media referenced by `PROCESSING`/`NEEDS_APPROVAL` is protected.

- [ ] **Step 2: Implement cleanup selection/operation**

Deletion must update DB cleanup state only after Storage confirms deletion. Failed deletion remains retryable; never delete TikTok media while consent is pending.

- [ ] **Step 3: Document the operational setup**

The document must explicitly separate:
- code complete;
- production Supabase migration still unapplied;
- GitHub/Vercel secret names still unconfigured;
- Meta app connection still requires real account consent;
- TikTok final consent remains manual;
- deployment must be one final approved operation.

- [ ] **Step 4: Commit**

```bash
git add .env.example .env.local.example docs/blog-social-automation.md src/lib/socialAutomation/orchestrator*
git commit -m "docs: add blog social automation operations guide"
```

---

### Task 12: Full verification and pre-deployment gate

**Files:**
- No new production changes unless verification exposes a defect.
- Update: `docs/blog-social-automation.md` with actual verified commands/results.

**Interfaces:** None; this is the release gate.

- [ ] **Step 1: Run focused unit suites**

```bash
npm run test:social
npm run test:scheduler
npm run test:whatsapp
```

Expected: PASS.

- [ ] **Step 2: Run static/code quality checks**

```bash
npx tsc --noEmit
npm run lint
npm run seo:validate
node scripts/validate-sitemap.mjs
```

Expected: PASS, or document/fix only verified pre-existing unrelated lint debt rather than hiding new failures.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Render both profiles from a real article**

```bash
node scripts/render-social-article.mjs 01-why-we-rebuilt-not-redesigned --out-dir out/social-release-check
```

Verify with `ffprobe` that both are 1080x1920 and playable. Inspect representative frames to confirm the TikTok output contains no Web Growth logo, URL, promotional CTA overlay, or presenter brand mark.

- [ ] **Step 5: Run Supabase advisors/read-only schema review**

Review the committed migration against current production schema and run Supabase database/security advisors in read-only mode. Do not apply the migration yet.

- [ ] **Step 6: Compare branch against main**

Ensure only intended social-automation code/docs/config changed and no WhatsApp feature was altered beyond shared helper reuse.

- [ ] **Step 7: Stop before deployment**

Do **not** merge to `main`, apply the production Supabase migration, set production Vercel/GitHub secrets, or trigger a production deployment. Present the completed verification report to the user and request explicit permission for the single production deployment/configuration pass.

- [ ] **Step 8: After explicit deployment approval only**

Perform one coordinated production release:
1. apply the reviewed Supabase migration;
2. configure required production secrets/environment variables without exposing values;
3. configure GitHub Actions secrets;
4. merge/promote the completed branch once;
5. allow/trigger the one production Vercel deployment;
6. connect Meta through the admin flow;
7. run a controlled end-to-end test article or dry-run path;
8. verify Instagram/Facebook publication state and TikTok `NEEDS_APPROVAL` creation;
9. record final production status in documentation.
