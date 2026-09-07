import test from "node:test";
import assert from "node:assert/strict";

import { isPublishableSocialArticle, normalizeSocialArticle } from "./article";

const base = {
  slug: "seo-checklist",
  title: "Small Business SEO Checklist",
  excerpt: "A practical checklist for improving search visibility.",
  content: "## Start here\nFix crawlability before chasing traffic. Make the next action obvious.",
  category: "SEO",
  topic: "Search",
  tags: ["SEO", "Small Business"],
  cover: "/images/blog/seo.webp",
  keyTakeaways: ["Fix crawlability first"],
  steps: ["Check indexing"],
  commonMistakes: ["Ignoring canonicals"],
  methodologyNote: "Based on a technical site audit.",
  evidenceNote: "Validated against crawl and index data.",
} as any;

test("normalizes a publishable article with a canonical Web Growth URL", () => {
  assert.equal(isPublishableSocialArticle(base), true);
  const article = normalizeSocialArticle(base);
  assert.equal(article.canonicalUrl, "https://webgrowth.info/blog/seo-checklist/");
  assert.equal(article.slug, "seo-checklist");
  assert.deepEqual(article.tags, ["SEO", "Small Business"]);
});

test("reserved article template is never publishable", () => {
  assert.equal(isPublishableSocialArticle({ ...base, slug: "_article-template" }), false);
});

test("blank title is never publishable", () => {
  assert.equal(isPublishableSocialArticle({ ...base, title: "   " }), false);
});
