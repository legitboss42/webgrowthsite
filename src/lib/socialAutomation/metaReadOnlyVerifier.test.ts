import assert from "node:assert/strict";
import test from "node:test";
import {
  verifyMetaPageAndInstagram,
} from "./metaReadOnlyVerifier";

const base = {
  graphVersion: "v23.0",
  pageId: "123456789012",
  instagramId: "987654321098",
  pageAccessToken: "fixture-page-token-private",
};

test("both authorized Graph profile reads pass without disclosing identifiers", async () => {
  const requests: string[] = [];
  const response = await verifyMetaPageAndInstagram({
    ...base,
    fetcher: async (url, init) => {
      const u = new URL(String(url));
      requests.push(u.pathname);
      assert.equal(init?.method, "GET");
      assert.equal(new Headers(init?.headers).get("Authorization"),
        "Bearer fixture-page-token-private");
      assert.equal(u.searchParams.has("access_token"), false);
      const id = u.pathname.split("/").at(-1);
      return new Response(JSON.stringify({ id }), { status: 200 });
    },
  });
  assert.equal(response.facebook.ok, true);
  assert.equal(response.instagram.ok, true);
  assert.equal(requests.length, 2);
  assert.doesNotMatch(JSON.stringify(response), /fixture-page-token-private|123456789012|987654321098/);
});

test("Graph permission denial is sanitized", async () => {
  const response = await verifyMetaPageAndInstagram({
    ...base,
    fetcher: async () => new Response(JSON.stringify({
      error: { message: "secret error and private token", code: 190 },
    }), { status: 403 }),
  });
  assert.equal(response.facebook.reason, "AUTH_OR_PERMISSION_DENIED");
  assert.equal(response.instagram.reason, "AUTH_OR_PERMISSION_DENIED");
  assert.doesNotMatch(JSON.stringify(response), /secret|private token/);
});

test("invalid resource never calls network", async () => {
  let calls = 0;
  const response = await verifyMetaPageAndInstagram({
    ...base,
    pageId: "https://evil.example/path",
    fetcher: async () => { calls++; throw Error("should not run"); },
  });
  assert.equal(calls, 0);
  assert.equal(response.facebook.reason, "INVALID_CONFIGURATION");
  assert.equal(response.instagram.reason, "INVALID_CONFIGURATION");
});

test("missing credential never calls Graph", async () => {
  let calls = 0;
  const response = await verifyMetaPageAndInstagram({
    ...base, pageAccessToken: "",
    fetcher: async () => { calls++; throw Error("should not run"); },
  });
  assert.equal(calls, 0);
  assert.equal(response.facebook.reason, "MISSING_CREDENTIAL");
});

test("token resource mismatch fails closed", async () => {
  const response = await verifyMetaPageAndInstagram({
    ...base,
    fetcher: async () => new Response(JSON.stringify({ id: "000000000000" }), { status: 200 }),
  });
  assert.equal(response.facebook.ok, false);
  assert.equal(response.instagram.reason, "RESOURCE_MISMATCH");
});

test("network errors do not leak exception contents", async () => {
  const response = await verifyMetaPageAndInstagram({
    ...base,
    fetcher: async () => { throw Error("sensitive infrastructure detail"); },
  });
  assert.equal(response.facebook.reason, "NETWORK_ERROR");
  assert.doesNotMatch(JSON.stringify(response), /sensitive infrastructure detail/);
});
