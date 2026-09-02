import { AsyncLocalStorage } from "node:async_hooks";
import { isWhatsAppWorkspaceId } from "./workspaceModel";

type WorkspaceExecutionContext = { workspaceId: string };
const storage = new AsyncLocalStorage<WorkspaceExecutionContext>();

/**
 * Establishes the trusted tenant boundary for webhook/background work that has no
 * browser cookie. Nested server helpers inherit this workspace until the callback ends.
 */
export function runWithWhatsAppWorkspace<T>(workspaceId: string, callback: () => T): T {
  if (!isWhatsAppWorkspaceId(workspaceId)) throw new Error("A valid WhatsApp workspace id is required.");
  return storage.run({ workspaceId }, callback);
}

/**
 * Binds the remainder of the current request's async execution to a workspace.
 * Authentication uses this after resolving membership so first-login requests are
 * tenant-scoped even before the workspace-selection cookie has ever been written.
 */
export function enterWhatsAppWorkspace(workspaceId: string) {
  if (!isWhatsAppWorkspaceId(workspaceId)) throw new Error("A valid WhatsApp workspace id is required.");
  storage.enterWith({ workspaceId });
}

export function getWhatsAppRuntimeWorkspaceId() {
  const workspaceId = storage.getStore()?.workspaceId;
  return isWhatsAppWorkspaceId(workspaceId) ? workspaceId : null;
}
