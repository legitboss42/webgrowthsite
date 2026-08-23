import assert from "node:assert/strict";
import test from "node:test";
import { assertPublicEnrollmentEnabled, assertVideoUploadEnabled, getSchedulerLaunchState } from "./launch";

test("all public beta gates fail closed", () => {
  delete process.env.SCHEDULER_PUBLIC_ENROLLMENT_ENABLED;
  delete process.env.SCHEDULER_NEW_SCHEDULING_ENABLED;
  delete process.env.SCHEDULER_VIDEO_ENABLED;
  delete process.env.TIKTOK_DIRECT_POST_ENABLED;
  delete process.env.TIKTOK_PUBLIC_POSTING_ENABLED;
  assert.deepEqual(getSchedulerLaunchState(), {
    publicEnrollment: false,
    newScheduling: false,
    video: false,
    directPost: false,
    publicPosting: false,
  });
});

test("public posting cannot activate without Direct Post", () => {
  process.env.TIKTOK_PUBLIC_POSTING_ENABLED = "true";
  delete process.env.TIKTOK_DIRECT_POST_ENABLED;
  assert.equal(getSchedulerLaunchState().publicPosting, false);
});

test("public enrollment assertion rejects a disabled enrollment gate", () => {
  assert.throws(
    () => assertPublicEnrollmentEnabled({ ...getSchedulerLaunchState(), publicEnrollment: false }),
    /Public scheduler enrollment is disabled\./,
  );
});

test("public enrollment assertion accepts an enabled enrollment gate", () => {
  assert.doesNotThrow(() => assertPublicEnrollmentEnabled({ ...getSchedulerLaunchState(), publicEnrollment: true }));
});

// Mutation target: checking the video gate after storage reservation must accept bytes while video launch is disabled.
test("video upload assertion fails closed independently of photo uploads", () => {
  const disabled = { ...getSchedulerLaunchState(), video: false };
  assert.throws(() => assertVideoUploadEnabled("VIDEO", disabled), /Video uploads are unavailable\./);
  assert.doesNotThrow(() => assertVideoUploadEnabled("PHOTO", disabled));
});
