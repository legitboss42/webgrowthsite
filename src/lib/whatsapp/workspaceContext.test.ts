import assert from "node:assert/strict";
import test from "node:test";
import {
  enterWhatsAppWorkspace,
  getWhatsAppRuntimeWorkspaceId,
  runWithWhatsAppWorkspace,
} from "./workspaceContext";

const workspaceA = "11111111-1111-4111-8111-111111111111";
const workspaceB = "22222222-2222-4222-8222-222222222222";

test("background workspace context survives async work and restores after nesting", async () => {
  await runWithWhatsAppWorkspace(workspaceA, async () => {
    assert.equal(getWhatsAppRuntimeWorkspaceId(), workspaceA);
    await Promise.resolve();
    assert.equal(getWhatsAppRuntimeWorkspaceId(), workspaceA);
    runWithWhatsAppWorkspace(workspaceB, () => {
      assert.equal(getWhatsAppRuntimeWorkspaceId(), workspaceB);
    });
    assert.equal(getWhatsAppRuntimeWorkspaceId(), workspaceA);
  });
});

test("request auth can enter a resolved workspace context", async () => {
  await new Promise<void>((resolve) => {
    setImmediate(() => {
      enterWhatsAppWorkspace(workspaceB);
      assert.equal(getWhatsAppRuntimeWorkspaceId(), workspaceB);
      resolve();
    });
  });
});

test("invalid workspace ids never establish tenant context", () => {
  assert.throws(() => runWithWhatsAppWorkspace("not-a-workspace", () => undefined));
  assert.throws(() => enterWhatsAppWorkspace("also-not-a-workspace"));
});
