import test from "node:test";
import assert from "node:assert/strict";
import { bindWhatsAppScopedRpc } from "./data";

const WORKSPACE = "514d88ca-3b92-4225-ae4c-b23cef26a611";

test("AI knowledge RPC is upgraded to the workspace-scoped function", () => {
  const result = bindWhatsAppScopedRpc({
    pathAndQuery: "rpc/search_whatsapp_ai_knowledge",
    workspaceId: WORKSPACE,
    body: { query_text: "pricing", source_ids: null, match_limit: 8 },
  });
  assert.ok(result);
  assert.equal(result.pathAndQuery, "rpc/search_whatsapp_ai_knowledge_scoped");
  assert.deepEqual(result.body, { query_text: "pricing", source_ids: null, match_limit: 8, workspace_id_arg: WORKSPACE });
});

test("AI knowledge RPC fails closed without a trusted workspace", () => {
  assert.equal(bindWhatsAppScopedRpc({ pathAndQuery: "rpc/search_whatsapp_ai_knowledge", workspaceId: null, body: { query_text: "pricing" } }), null);
});

test("ordinary RPC mutations are not rewritten", () => {
  const result = bindWhatsAppScopedRpc({ pathAndQuery: "rpc/something_else", workspaceId: WORKSPACE, body: { value: 1 } });
  assert.deepEqual(result, { pathAndQuery: "rpc/something_else", body: { value: 1 } });
});
