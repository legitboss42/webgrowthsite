import test from "node:test";
import assert from "node:assert/strict";

import { decryptMetaTokens, encryptMetaTokens } from "./crypto";

const original = process.env.META_TOKEN_ENCRYPTION_KEY;

test.afterEach(() => {
  if (original === undefined) delete process.env.META_TOKEN_ENCRYPTION_KEY;
  else process.env.META_TOKEN_ENCRYPTION_KEY = original;
});

test("Meta token envelope round trips", () => {
  process.env.META_TOKEN_ENCRYPTION_KEY = "test-meta-key";
  const encrypted = encryptMetaTokens({
    userAccessToken: "user-secret",
    pageAccessToken: "page-secret",
    connectedAt: "2026-09-06T00:00:00.000Z",
  });
  assert.notEqual(encrypted, "user-secret");
  assert.equal(decryptMetaTokens(encrypted)?.pageAccessToken, "page-secret");
});

test("tampered Meta token ciphertext is rejected", () => {
  process.env.META_TOKEN_ENCRYPTION_KEY = "test-meta-key";
  const encrypted = encryptMetaTokens({ userAccessToken: "secret", connectedAt: "now" });
  assert.equal(decryptMetaTokens(`${encrypted}x`), null);
});

test("encryption fails closed when key is missing", () => {
  delete process.env.META_TOKEN_ENCRYPTION_KEY;
  assert.throws(() => encryptMetaTokens({ userAccessToken: "secret", connectedAt: "now" }));
});
