import test from "node:test";
import assert from "node:assert/strict";

import { planFacebookAction, planInstagramAction, planTikTokAction } from "./publicationPlan";

test("Instagram reuses an existing processing container instead of creating another", () => {
  assert.equal(
    planInstagramAction({ enabled: true, status: "PROCESSING", externalPublicationId: "container-1" }),
    "POLL"
  );
  assert.equal(
    planInstagramAction({ enabled: true, status: "PUBLISHED", externalPublicationId: "media-1" }),
    "DONE"
  );
  assert.equal(
    planInstagramAction({ enabled: true, status: "PENDING", externalPublicationId: null }),
    "CREATE"
  );
});

test("disabled Meta platforms skip and published Facebook work is idempotent", () => {
  assert.equal(planFacebookAction({ enabled: false, status: "PENDING" }), "SKIP");
  assert.equal(planFacebookAction({ enabled: true, status: "PUBLISHED" }), "DONE");
  assert.equal(planFacebookAction({ enabled: true, status: "FAILED_RETRYABLE" }), "PUBLISH");
});

test("TikTok approval draft is terminal preparation and must not duplicate", () => {
  assert.equal(planTikTokAction({ enabled: true, status: "NEEDS_APPROVAL" }), "DONE");
  assert.equal(planTikTokAction({ enabled: true, status: "PENDING" }), "PREPARE");
  assert.equal(planTikTokAction({ enabled: false, status: "PENDING" }), "SKIP");
});
