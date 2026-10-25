import assert from "node:assert/strict";
import test from "node:test";
import { verifyWhatsAppBusinessPhone } from "./whatsappReadOnlyVerifier";

const params = {
  apiVersion: "v26.0",
  phoneNumberId: "1234567891234",
  token: "fixture-token-is-not-real",
};

test("bounded GET verifies configured phone and hides token", async () => {
  let count=0;
  const response = await verifyWhatsAppBusinessPhone({
    ...params,
    fetcher: async (url, init) => {
      count++;
      const u = new URL(String(url));
      assert.equal(u.origin, "https://graph.facebook.com");
      assert.equal(u.searchParams.has("access_token"), false);
      assert.equal(u.searchParams.get("fields"), "id,verified_name");
      assert.equal(init?.method, "GET");
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer fixture-token-is-not-real");
      return new Response(JSON.stringify({ id: params.phoneNumberId, verified_name: "Test" }), { status: 200 });
    }
  });
  assert.equal(response.ok,true);
  assert.equal(response.httpStatus,200);
  assert.equal(count,1);
  assert.doesNotMatch(JSON.stringify(response), /fixture-token|1234567891234|Test/);
});

test("expired provider authentication returns sanitized 401", async () => {
  const value = await verifyWhatsAppBusinessPhone({
    ...params,
    fetcher: async () => new Response(JSON.stringify({ error: { message: "secret token" }}), { status: 401 }),
  });
  assert.equal(value.status,"AUTH_OR_PERMISSION_DENIED");
  assert.doesNotMatch(JSON.stringify(value), /secret/);
});

test("a mismatched Graph resource fails closed", async () => {
  const value=await verifyWhatsAppBusinessPhone({
    ...params,fetcher: async () => new Response(JSON.stringify({id:"54321"}),{status:200}),
  });
  assert.equal(value.status,"RESOURCE_MISMATCH");
});

test("bad configuration never calls the network", async () => {
  let calls=0;
  const value=await verifyWhatsAppBusinessPhone({
    ...params,phoneNumberId:"https://evil.test",fetcher:async()=>{calls++;throw Error("never");},
  });
  assert.equal(calls,0);
  assert.equal(value.status,"INVALID_CONFIGURATION");
});

test("missing token never calls network", async () => {
  let calls=0;
  const value=await verifyWhatsAppBusinessPhone({
    ...params,token:"",fetcher:async()=>{calls++;throw Error("never");},
  });
  assert.equal(calls,0);
  assert.equal(value.status,"MISSING_CREDENTIAL");
});

test("network failures don't leak errors",async()=>{
  const value=await verifyWhatsAppBusinessPhone({
    ...params,fetcher:async()=>{throw Error("hidden-provider-detail");},
  });
  assert.equal(value.status,"NETWORK_ERROR");
  assert.doesNotMatch(JSON.stringify(value),/hidden-provider-detail/);
});
