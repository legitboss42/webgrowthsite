import test from "node:test";
import assert from "node:assert/strict";

import { signInternalRequest, verifyInternalRequest } from "./internalAuth";

const secret = "automation-secret";

test("accepts a fresh matching HMAC request", () => {
  const nowMs = Date.parse("2026-09-06T01:00:00.000Z");
  const timestamp = String(nowMs);
  const body = JSON.stringify({ slug: "seo-checklist" });
  const signature = signInternalRequest({ body, timestamp, secret });
  assert.equal(verifyInternalRequest({ body, timestamp, signature, secret, nowMs }), true);
});

test("rejects a stale signed request", () => {
  const nowMs = Date.parse("2026-09-06T01:10:01.000Z");
  const timestamp = String(Date.parse("2026-09-06T01:00:00.000Z"));
  const body = "{}";
  const signature = signInternalRequest({ body, timestamp, secret });
  assert.equal(verifyInternalRequest({ body, timestamp, signature, secret, nowMs }), false);
});

test("rejects body tampering", () => {
  const nowMs = Date.now();
  const timestamp = String(nowMs);
  const signature = signInternalRequest({ body: "{}", timestamp, secret });
  assert.equal(
    verifyInternalRequest({ body: '{"changed":true}', timestamp, signature, secret, nowMs }),
    false
  );
});
