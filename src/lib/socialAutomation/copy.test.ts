import test from "node:test";
import assert from "node:assert/strict";

import { normalizeSocialArticle } from "./article";
import { buildSocialCopy } from "./copy";

const post = {
  slug: "landing-page-guide",
  title: "Landing Page Guide for Small Businesses",
  excerpt: "Build a landing page that turns attention into enquiries.",
  content: "A landing page has one job. Make the offer clear and remove friction.",
  category: "Conversion",
  topic: "Landing Pages",
  primaryKeyword: "landing page",
  tags: ["Landing Pages", "CRO"],
  cover: "/images/blog/landing.webp",
  keyTakeaways: ["Make one action obvious", "Lead with the offer"],
  steps: ["Define the conversion goal"],
  commonMistakes: ["Adding competing calls to action"],
} as any;

test("builds separate copy for Instagram, Facebook, and TikTok", () => {
  const bundle = buildSocialCopy(normalizeSocialArticle(post));
  assert.match(bundle.instagram.caption, /webgrowth\.info\/blog\/landing-page-guide\//);
  assert.match(bundle.facebook.caption, /webgrowth\.info\/blog\/landing-page-guide\//);
  assert.equal(bundle.tiktok.renderCta, "NONE");
  assert.equal(bundle.tiktok.branding, false);
  assert.equal(bundle.instagram.branding, true);
  assert.equal(bundle.facebook.branding, true);
});

test("limits hashtags and removes duplicates", () => {
  const bundle = buildSocialCopy(normalizeSocialArticle(post));
  assert.ok(bundle.tiktok.hashtags.length <= 6);
  assert.equal(new Set(bundle.tiktok.hashtags).size, bundle.tiktok.hashtags.length);
});
