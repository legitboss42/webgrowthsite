# Blog Social E2E Production Test Progress — 2026-09-07

## Objective
Run one controlled temporary blog article through the real production blog-to-social automation, verify Instagram/Facebook auto-publishing and TikTok scheduler handoff, then remove the temporary article after evidence is captured.

## First production attempt

Temporary article commit on `main`:

- Commit: `8f01450736feed8713d4e5c6e1bce0e3bc967ade`
- Original slug: `temporary-automation-test-5-signs-your-business-is-ready-for-automation`
- GitHub Actions run: `34158067333`

### GitHub Actions result

The workflow trigger and detector worked correctly.

- `npm run test:social`: 98/98 passed.
- `npm run test:scheduler`: 280/280 passed.
- The new article slug was detected correctly.
- `Publish new articles` failed because `SOCIAL_AUTOMATION_WEBHOOK_SECRET` was empty in the GitHub Actions environment at that time.

No provider publishing occurred during that run.

## Vercel build result

Vercel production deployment for commit `8f014507...` failed before the article could become available on `webgrowth.info`.

Confirmed failed deployments:

- `dpl_5gqZNwKgQFJ15e5BYzXBVsGk8v4j`
- `dpl_7qyDEZ8J71yaKxNxvbW5rcqusvJs`

Both failed on:

`SITEMAP CHECK FAILED: Ungoverned article: temporary-automation-test-5-signs-your-business-is-ready-for-automation`

The previous production deployment from commit `78f29fc891d6a47f0b4c4ce929393134e50e7c2b` remains READY, so the live site was not replaced by the failed build.

## Root cause

The repository intentionally requires every public blog Markdown file to be declared in `src/lib/route-governance.json`.

The public blog loader also exposes only governance articles with `status: INDEX`. Therefore making the temporary test article merely `NOINDEX` would not work for this end-to-end test: the social runner would wait for an article URL that the public loader intentionally refuses to serve.

The first temporary article also used `/images/blog/default-cover.webp`, which is not a valid existing indexed-article cover path. A governed `INDEX` article would have failed the next sitemap validation stage on its metadata/link requirements.

## Prepared replacement branch

Branch:

`test/blog-social-e2e-governed`

Prepared changes:

1. Removed the failed original temporary article from the branch.
2. Added a replacement article:
   - `content/blog/temporary-social-automation-e2e-test.md`
3. The replacement includes:
   - unique `seoTitle`
   - unique `primaryKeyword`
   - `searchIntent`
   - `coverAlt`
   - real existing `/images/blog/automation-flow.webp` cover
   - two indexed related guides
   - two FAQs
   - at least three contextual internal links
   - a contextual `/services/business-automation/` link
   - explicit evidence note stating that the article is a temporary production verification artifact

## Remaining pre-deployment change

Add this article to `src/lib/route-governance.json` as an indexed temporary article:

```json
{
  "slug": "temporary-social-automation-e2e-test",
  "status": "INDEX",
  "sitemap": true
}
```

The final `main` push must contain both the deletion of the old failed slug and the addition of the new governed slug. The blog-social detector intentionally reacts only to Git name-status `A` files, so merely editing the old file would not retrigger publication.

## Deployment boundary

Do not merge or deploy the prepared branch until the governance entry is included and validation is green.

After the governed test article successfully deploys, continue the same test through:

1. GitHub detection
2. Remotion rendering
3. signed internal job creation
4. asset upload
5. Instagram automatic publication
6. Facebook automatic publication
7. TikTok `NEEDS_APPROVAL` creation
8. TikTok approval/publish verification
9. final dashboard/job-state verification
10. deletion of the temporary article after evidence is captured
