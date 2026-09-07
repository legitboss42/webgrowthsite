import test from "node:test";
import assert from "node:assert/strict";

import {
  metaFallbackConnectionUrl,
  shouldUseMetaRedirectFallback,
} from "./metaLoginFlow";

test("mobile Meta connection uses the full-page redirect fallback", () => {
  assert.equal(
    shouldUseMetaRedirectFallback({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148",
      maxTouchPoints: 5,
      coarsePointer: true,
      viewportWidth: 390,
    }),
    true
  );
  assert.equal(
    shouldUseMetaRedirectFallback({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0",
      maxTouchPoints: 0,
      coarsePointer: false,
      viewportWidth: 1440,
    }),
    false
  );
});

test("fallback Meta connection URL preserves a safe relative return target", () => {
  assert.equal(
    metaFallbackConnectionUrl("/admin/content-automation/"),
    "/api/admin/content-automation/meta/connect/?returnTo=%2Fadmin%2Fcontent-automation%2F"
  );
});
