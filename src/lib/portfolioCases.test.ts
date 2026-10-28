import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { portfolioCases } from "./portfolioCases";

const newProjectSlugs = ["jimtop-site", "noun-compass"];

test("portfolio case slugs are unique", () => {
  const slugs = portfolioCases.map((item) => item.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("new portfolio cases are unfeatured and have live links and local images", () => {
  for (const slug of newProjectSlugs) {
    const matches = portfolioCases.filter((item) => item.slug === slug);
    assert.equal(matches.length, 1, `expected one portfolio entry for ${slug}`);

    const item = matches[0];
    assert.equal(item.featured, undefined, `${slug} must remain unfeatured`);
    assert.match(item.liveUrl, /^https:\/\//, `${slug} must use a verified HTTPS URL`);
    assert.ok(item.imageAlt.trim(), `${slug} needs meaningful image alt text`);
    assert.ok(
      existsSync(path.join(process.cwd(), "public", item.imageUrl.replace(/^\//, ""))),
      `${slug} image asset must exist`,
    );
  }
});
