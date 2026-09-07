import test from "node:test";
import assert from "node:assert/strict";

import { buildSocialAutomationJobSeed } from "./jobSeed";

const article = {
  slug: "seo-checklist",
  title: "SEO Checklist",
  excerpt: "Fix the basics first.",
  canonicalUrl: "https://webgrowth.info/blog/seo-checklist/",
  category: "SEO",
  topic: "Search",
  primaryKeyword: "seo checklist",
  tags: ["SEO"],
  cover: "/images/blog/seo.webp",
  keyTakeaways: ["Fix crawlability"],
  steps: ["Check indexing"],
  commonMistakes: ["Ignoring canonicals"],
  prose: "Fix crawlability before chasing traffic.",
};

test("job seed is deterministic and creates one publication per platform", () => {
  const seed = buildSocialAutomationJobSeed(article, "abc1234", "v1");
  assert.equal(seed.idempotencyKey, "seo-checklist:abc1234:v1");
  assert.deepEqual(seed.publications.map((item) => item.platform), [
    "INSTAGRAM",
    "FACEBOOK",
    "TIKTOK",
  ]);
  assert.equal(seed.publications.every((item) => item.status === "PENDING"), true);
  assert.equal(seed.articleSnapshot.article.slug, "seo-checklist");
});
