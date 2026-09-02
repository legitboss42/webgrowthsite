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

export function getWhatsAppRuntimeWorkspaceId() {
  const workspaceId = storage.getStore()?.workspaceId;
  return isWhatsAppWorkspaceId(workspaceId) ? workspaceId : null;
}
