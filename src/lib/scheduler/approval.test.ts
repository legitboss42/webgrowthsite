import assert from "node:assert/strict";
import test from "node:test";
import { approvalFingerprint, buildApprovalSnapshot } from "./approval";
import { canTransitionPost, isSameOriginMutation } from "./policy";

const base = {
  creatorOpenId: "open-1",
  media: [{ id: "m1", checksum: "abc", position: 0 }],
  title: "Title",
  caption: "Caption",
  privacyLevel: "SELF_ONLY" as const,
  allowComment: true,
  allowDuet: false,
  allowStitch: false,
  brandContent: false,
  brandOrganic: true,
  declarationVersion: "2026-08",
};

test("approval fingerprints are deterministic and change with creator-visible content", () => {
  const first = approvalFingerprint(buildApprovalSnapshot(base));
  const reordered = approvalFingerprint(buildApprovalSnapshot({ ...base }));
  const changed = approvalFingerprint(buildApprovalSnapshot({ ...base, caption: "Changed" }));
  assert.equal(first, reordered);
  assert.notEqual(first, changed);
});

test("post state transitions prevent cancellation after submission", () => {
  assert.equal(canTransitionPost("SCHEDULED", "CANCELLED"), true);
  assert.equal(canTransitionPost("PROCESSING", "CANCELLED"), false);
});

test("state-changing requests require the application origin", () => {
  assert.equal(isSameOriginMutation("https://webgrowth.info", "https://webgrowth.info/scheduler"), true);
  assert.equal(isSameOriginMutation("https://evil.test", "https://webgrowth.info/scheduler"), false);
});
