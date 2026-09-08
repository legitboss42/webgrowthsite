import test from "node:test";
import assert from "node:assert/strict";

import {
  buildKineticVideoProps,
  type KineticArticleSource,
} from "./kineticVideo";

const article: KineticArticleSource = {
  slug: "why-your-website-isnt-getting-leads",
  title: "Why Your Website Is Not Getting Leads, and What to Fix First",
  excerpt:
    "Find out why your website is not getting leads and which trust, clarity, speed, CTA, mobile, or enquiry-flow issues to fix first.",
  primaryKeyword: "why a website is not getting leads",
  category: "Conversion",
  tags: ["Conversion", "Leads", "Website Audit"],
  keyTakeaways: [
    "A website can look good and still fail if clarity, trust, CTA flow, or mobile usability are weak.",
    "Most website conversion problems show up in the homepage message, service-page structure, and enquiry path.",
    "A website audit is often the fastest way to understand what to fix before paying for a full redesign.",
  ],
  steps: [
    "Check the homepage message first.",
    "Review CTA visibility and trust signals.",
    "Test the website on mobile and check loading speed.",
  ],
  commonMistakes: ["Using vague homepage copy that never explains the real offer."],
  prose:
    "A website can look polished and still fail commercially. The issue is often structural rather than visual. Visitors should understand what your business does within seconds. Review the message, trust signals, and enquiry path before paying for a redesign.",
};

test("no-voice render props omit audioSrc and subtitles", () => {
  const props = buildKineticVideoProps(article, "META");

  assert.equal(props.audioMode, "none");
  assert.equal("audioSrc" in props, false);
  assert.deepEqual(props.subtitles, []);
});

test("kinetic timing is deterministic for identical article input", () => {
  const first = buildKineticVideoProps(article, "META");
  const second = buildKineticVideoProps(structuredClone(article), "META");

  assert.deepEqual(second, first);
});

test("generated beats stay concise and cover the educational story", () => {
  const props = buildKineticVideoProps(article, "META");
  const roles = props.beats.map((beat) => beat.role);

  assert.ok(props.beats.length >= 4 && props.beats.length <= 6);
  assert.deepEqual(roles.slice(0, 4), ["hook", "problem", "insight", "action"]);
  assert.ok(roles.includes("takeaway"));
  for (const beat of props.beats.slice(0, -1)) {
    const words = beat.text.split(/\s+/).filter(Boolean);
    assert.ok(words.length >= 3, `${beat.role} is too short: ${beat.text}`);
    assert.ok(words.length <= 12, `${beat.role} is too long: ${beat.text}`);
    assert.ok(beat.highlight.length > 0 && beat.text.includes(beat.highlight));
  }
});

test("article headings are not repeated as the insight beat", () => {
  const props = buildKineticVideoProps(
    {
      ...article,
      prose: `${article.title}. ${article.prose}`,
    },
    "META"
  );
  const insight = props.beats.find((beat) => beat.role === "insight");

  assert.notEqual(insight?.text.replace(/[.!?]+$/, "").toLowerCase(), article.title.toLowerCase());
  assert.match(insight?.text ?? "", /look polished/i);
});

test("shortened beats never end on a dangling connector", () => {
  const props = buildKineticVideoProps(article, "META");

  for (const beat of props.beats) {
    assert.doesNotMatch(beat.text, /\b(?:and|or|to|what|the|a|an|of|for|with)\.$/i);
  }
});

test("TikTok props contain no promotional Web Growth copy or URL", () => {
  const props = buildKineticVideoProps(article, "TIKTOK");
  const serialized = JSON.stringify(props);

  assert.doesNotMatch(serialized, /web\s*growth/i);
  assert.doesNotMatch(serialized, /webgrowth\.info/i);
  assert.doesNotMatch(serialized, /read (the )?(full )?guide/i);
  assert.equal(props.beats.at(-1)?.text, "Save this idea for later.");
  assert.equal(props.branding, null);
});

test("Meta props retain understated branding and article CTA", () => {
  const props = buildKineticVideoProps(article, "META");

  assert.deepEqual(props.branding, {
    name: "WEB GROWTH",
    tagline: "Build. Grow. Monetize.",
    url: "webgrowth.info",
  });
  assert.equal(props.beats.at(-1)?.role, "ending");
  assert.match(props.beats.at(-1)?.text ?? "", /read the guide/i);
});

test("output duration remains between 12 and 18 seconds", () => {
  for (const profile of ["META", "TIKTOK"] as const) {
    const props = buildKineticVideoProps(article, profile);
    assert.ok(props.durationInSeconds >= 12, `${profile} duration was too short`);
    assert.ok(props.durationInSeconds <= 18, `${profile} duration was too long`);
    assert.equal(props.durationInFrames, Math.ceil(props.durationInSeconds * 30));
    assert.equal(
      props.beats.at(-1)?.endFrame,
      props.durationInFrames,
      `${profile} final beat must end on the composition boundary`
    );
  }
});
