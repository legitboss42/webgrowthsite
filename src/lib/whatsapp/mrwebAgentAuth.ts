/**
 * Narrow, authenticated server-to-server bridge for Mr Web's EXISTING Hermes
 * M7 business/resource-grant system. Read-only. No WhatsApp Cloud API keys,
 * browser cookies or agent-claimed permissions are accepted.
 *
 * The key is provisioned independently in both servers' secret managers at
 * one owner-approved combined release. No production behavior is enabled by
 * adding this source.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { isWhatsAppWorkspaceId } from "./workspaceModel";

const NONCE = /^[a-f0-9]{32}$/;
const HEX = /^[a-f0-9]{64}$/;
export type AgentInboxQuery =
  | { operation: "conversations.list"; business: "webgrowth"; workspaceId: string; limit?: number }
  | { operation: "messages.list"; business: "webgrowth"; workspaceId: string; conversationId: string; limit?: number };

export function requireAgentInboxQuery(value: unknown, expectedWorkspace: string): AgentInboxQuery {
  if (!isWhatsAppWorkspaceId(expectedWorkspace)) throw new Error("WHATSAPP_BRIDGE_WORKSPACE_UNCONFIGURED");
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("WHATSAPP_BRIDGE_PAYLOAD_DENIED");
  const input = value as Record<string, unknown>;
  const operation = input.operation;
  if (operation !== "conversations.list" && operation !== "messages.list") throw new Error("WHATSAPP_BRIDGE_OPERATION_DENIED");
  const allowed = operation === "messages.list"
    ? ["operation", "business", "workspaceId", "conversationId", "limit"]
    : ["operation", "business", "workspaceId", "limit"];
  if (Object.keys(input).some(k => !allowed.includes(k)) || input.business !== "webgrowth" ||
      input.workspaceId !== expectedWorkspace) throw new Error("WHATSAPP_BRIDGE_SCOPE_DENIED");
  const limit = input.limit === undefined ? 20 : input.limit;
  if (!Number.isInteger(limit) || (limit as number) < 1 || (limit as number) > 50) throw new Error("WHATSAPP_BRIDGE_LIMIT_DENIED");
  if (operation === "messages.list") {
    if (!isWhatsAppWorkspaceId(input.conversationId)) throw new Error("WHATSAPP_BRIDGE_CONVERSATION_DENIED");
    return { operation, business: "webgrowth", workspaceId: expectedWorkspace,
      conversationId: input.conversationId as string, limit: limit as number };
  }
  return { operation, business: "webgrowth", workspaceId: expectedWorkspace, limit: limit as number };
}
export function verifyMrWebAgentSignature(input: {
  body: string; timestamp: string | null; nonce: string | null; signature: string | null;
  secret: string | undefined; nowSeconds?: number;
}) {
  const {body,timestamp,nonce,signature,secret} = input;
  if (!secret || secret.length < 32 || body.length > 4000 || !timestamp || !/^\d{10}$/.test(timestamp) ||
      !nonce || !NONCE.test(nonce) || !signature?.startsWith("sha256=") ||
      !HEX.test(signature.slice(7))) return false;
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 60) return false;
  const material = "v1\n" + timestamp + "\n" + nonce + "\n" + body;
  const expected = createHmac("sha256",secret).update(material).digest();
  const supplied = Buffer.from(signature.slice(7),"hex");
  return supplied.length === expected.length && timingSafeEqual(expected,supplied);
}
