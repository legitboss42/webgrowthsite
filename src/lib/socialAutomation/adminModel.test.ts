import test from "node:test";
import assert from "node:assert/strict";

import {
  isMetaConnectionUsable,
  parseSocialAutomationSettingsPatch,
  canRetryPublicationStatus,
} from "./adminModel";

test("settings parser accepts only explicit booleans and bounded retention", () => {
  assert.deepEqual(
    parseSocialAutomationSettingsPatch({
      enabled: true,
      instagramEnabled: false,
      facebookEnabled: true,
      tiktokGenerationEnabled: true,
      assetRetentionDays: 14,
    }),
    {
      enabled: true,
      instagram_enabled: false,
      facebook_enabled: true,
      tiktok_generation_enabled: true,
      asset_retention_days: 14,
    }
  );
  assert.equal(parseSocialAutomationSettingsPatch({ enabled: "true" }), null);
  assert.equal(parseSocialAutomationSettingsPatch({ assetRetentionDays: 0 }), null);
  assert.equal(parseSocialAutomationSettingsPatch({ assetRetentionDays: 31 }), null);
  assert.equal(parseSocialAutomationSettingsPatch({}), null);
});

test("Meta connection is unusable when reconnect is required or token expiry has passed", () => {
  const now = Date.parse("2026-09-06T02:00:00.000Z");
  assert.equal(isMetaConnectionUsable({ reconnectRequired: false, accessExpiresAt: null }, now), true);
  assert.equal(
    isMetaConnectionUsable({ reconnectRequired: false, accessExpiresAt: "2026-09-06T03:00:00.000Z" }, now),
    true
  );
  assert.equal(
    isMetaConnectionUsable({ reconnectRequired: false, accessExpiresAt: "2026-09-06T01:59:59.000Z" }, now),
    false
  );
  assert.equal(isMetaConnectionUsable({ reconnectRequired: true, accessExpiresAt: null }, now), false);
});

test("manual retry touches only failed or attention platform states", () => {
  assert.equal(canRetryPublicationStatus("FAILED_RETRYABLE"), true);
  assert.equal(canRetryPublicationStatus("NEEDS_ATTENTION"), true);
  assert.equal(canRetryPublicationStatus("PUBLISHED"), false);
  assert.equal(canRetryPublicationStatus("PROCESSING"), false);
  assert.equal(canRetryPublicationStatus("NEEDS_APPROVAL"), false);
});
