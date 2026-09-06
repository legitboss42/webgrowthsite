import test from "node:test";
import assert from "node:assert/strict";

import { resolveRenderProfile } from "./renderProfile";

test("TikTok render removes promotional brand overlays", () => {
  assert.deepEqual(resolveRenderProfile("TIKTOK"), {
    branding: false,
    articleCta: false,
    showPresenter: false,
    showWebsiteText: false,
  });
});

test("Meta render retains Web Growth branding and article CTA", () => {
  assert.deepEqual(resolveRenderProfile("META"), {
    branding: true,
    articleCta: true,
    showPresenter: true,
    showWebsiteText: true,
  });
});
