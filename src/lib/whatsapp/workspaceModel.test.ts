import assert from "node:assert/strict";
import test from "node:test";
import {
  applyWhatsAppWorkspaceToBody,
  normalizeWhatsAppWorkspaceSlug,
  scopeWhatsAppRestPath,
} from "./workspaceModel";

const workspaceId = "11111111-1111-4111-8111-111111111111";

test("workspace slugs normalize to stable SaaS-safe values", () => {
  assert.equal(normalizeWhatsAppWorkspaceSlug(" J Luxe Medical & Aesthetics "), "j-luxe-medical-aesthetics");
});

test("tenant table reads are scoped without rewriting global runtime tables", () => {
  assert.equal(
    scopeWhatsAppRestPath("whatsapp_contacts?select=id,wa_id&limit=5", workspaceId),
    `whatsapp_contacts?select=id,wa_id&limit=5&workspace_id=eq.${workspaceId}`,
  );
  assert.equal(
    scopeWhatsAppRestPath("whatsapp_automation_runtime_config?select=*", workspaceId),
    "whatsapp_automation_runtime_config?select=*",
  );
});

test("an explicit workspace filter is never duplicated", () => {
  const path = `whatsapp_contacts?workspace_id=eq.${workspaceId}&select=id`;
  assert.equal(scopeWhatsAppRestPath(path, workspaceId), path);
});

test("mutation bodies are forced into the trusted server workspace", () => {
  assert.deepEqual(
    applyWhatsAppWorkspaceToBody({ wa_id: "2348000000000", workspace_id: "attacker" }, workspaceId),
    { wa_id: "2348000000000", workspace_id: workspaceId },
  );
  assert.deepEqual(
    applyWhatsAppWorkspaceToBody([{ wa_id: "1" }, { wa_id: "2" }], workspaceId),
    [{ wa_id: "1", workspace_id: workspaceId }, { wa_id: "2", workspace_id: workspaceId }],
  );
});
