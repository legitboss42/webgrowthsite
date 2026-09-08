# Fresh Blog-to-Social End-to-End Test — 2026-09-07

## Why this second test exists

The first controlled article successfully proved the GitHub trigger, Remotion rendering, Supabase asset upload, Facebook publication, Instagram publication, and TikTok scheduler handoff. TikTok later failed before provider submission because the automation-created MP4 had been marked valid without the scheduler's durable video-validation evidence.

That TikTok bridge defect was fixed in PR #22 and merged to `main` as commit `d5a6c06d10e37e2c0b4b7a06bbbd22c2dab4e2ea`. The production deployment for that commit reached READY before this second test package was prepared.

The owner manually deleted the first test's Facebook and Instagram posts and requested a completely fresh test article rather than recovering the old TikTok scheduler record.

## Atomic test package

This test package is intentionally prepared as one commit:

- remove `content/blog/temporary-social-automation-e2e-test.md`;
- add `content/blog/temporary-social-automation-e2e-test-2.md`;
- replace the old temporary article slug with the new slug in `src/lib/route-governance.json`;
- retain the real indexed-article governance rules instead of weakening sitemap validation;
- keep the TikTok validation fix already merged in `main`.

## Fresh article

- Slug: `temporary-social-automation-e2e-test-2`
- Title: `A Simple 15-Minute Lead Follow-Up Workflow for Small Businesses`
- Purpose: controlled production verification only
- Cover: existing `/images/blog/automation-flow.webp`
- Cleanup: delete after Facebook, Instagram, and TikTok have all been verified end-to-end

## Acceptance path

After explicit approval to merge this test package to `main`, verify:

1. the new Markdown file is detected as an added blog article;
2. one production deployment serves the article;
3. the signed blog-social workflow creates the social automation job;
4. Meta and TikTok vertical MP4s render and upload;
5. Facebook publishes successfully;
6. Instagram publishes successfully;
7. the TikTok scheduler media row contains current durable validation evidence before approval;
8. TikTok enters `NEEDS_APPROVAL` with a fresh post ID;
9. the owner approves and schedules it;
10. the scheduler submits the stored MP4 to TikTok and receives a real `publish_id`;
11. TikTok reaches its terminal published state;
12. only after that evidence is captured, remove the temporary article and its governance entry in a later cleanup change.

## Deployment boundary

Preparing and validating this branch does not authorize another production deployment. The branch should be merged to `main` only after the entire atomic test package is validated and the owner approves that production test deployment.
