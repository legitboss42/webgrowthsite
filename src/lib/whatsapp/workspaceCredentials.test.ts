import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptWhatsAppWorkspaceAccessToken,
  encryptWhatsAppWorkspaceAccessToken,
  resolveWhatsAppMetaConfig,
} from "./workspaceCredentials";

test("workspace access tokens encrypt and decrypt only with the same server secret", () => {
  const env = { WHATSAPP_WORKSPACE_CREDENTIAL_SECRET: "stage11-secret" };
  const encrypted = encryptWhatsAppWorkspaceAccessToken("EAAB-client-token", env);
  assert.ok(encrypted?.startsWith("v1."));
  assert.equal(decryptWhatsAppWorkspaceAccessToken(encrypted || "", env), "EAAB-client-token");
  assert.equal(
    decryptWhatsAppWorkspaceAccessToken(encrypted || "", { WHATSAPP_WORKSPACE_CREDENTIAL_SECRET: "different-secret" }),
    null,
  );
});

test("explicit env resolution stays isolated from workspace storage for unit integrations", async () => {
  const config = await resolveWhatsAppMetaConfig({
    env: {
      WHATSAPP_ACCESS_TOKEN: "token-1",
      WHATSAPP_PHONE_NUMBER_ID: "phone-1",
      WHATSAPP_BUSINESS_ACCOUNT_ID: "waba-1",
      WHATSAPP_API_VERSION: "v26.0",
    },
  });
  assert.deepEqual(config, {
    workspaceId: null,
    token: "token-1",
    phoneNumberId: "phone-1",
    wabaId: "waba-1",
    apiVersion: "v26.0",
  });
});

test("explicit env without a token and phone id is not treated as configured", async () => {
  assert.equal(await resolveWhatsAppMetaConfig({ env: { WHATSAPP_ACCESS_TOKEN: "token-only" } }), null);
});
