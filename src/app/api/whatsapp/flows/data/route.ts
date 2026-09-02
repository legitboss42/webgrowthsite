import { NextResponse } from "next/server";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { decryptWhatsAppFlowRequest, encryptWhatsAppFlowResponse, isWhatsAppFlowEncryptionConfigured, type WhatsAppFlowEncryptedRequest } from "@/lib/whatsapp/flowCrypto";
import { WHATSAPP_FLOW_DATA_API_VERSION } from "@/lib/whatsapp/flowModel";
import { completeWhatsAppFlowSubmission, loadFlowForToken } from "@/lib/whatsapp/flowRuntime";
import { runWithWhatsAppWorkspace } from "@/lib/whatsapp/workspaceContext";
import { isWhatsAppWorkspaceId } from "@/lib/whatsapp/workspaceModel";
import { getWhatsAppWorkspaceById } from "@/lib/whatsapp/workspaces";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function encryptedResponse(data: Record<string, unknown>, aesKey: Buffer, iv: Buffer, status = 200) {
  return new Response(encryptWhatsAppFlowResponse(data, aesKey, iv), { status, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } });
}
function metaScreens(flowJson: Record<string, unknown>) {
  return Array.isArray(flowJson.screens) ? flowJson.screens.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item))) : [];
}
async function workspaceForFlowToken(flowToken: string) {
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_flow_submissions?flow_token=eq.${encodeURIComponent(flowToken)}&select=workspace_id&limit=1`, { unscoped: true });
  const workspaceId = String(rows?.[0]?.workspace_id || "");
  if (!isWhatsAppWorkspaceId(workspaceId)) return null;
  const workspace = await getWhatsAppWorkspaceById(workspaceId);
  return workspace?.status === "ACTIVE" ? workspace : null;
}

export async function GET() {
  return NextResponse.json({ ok: true, dataApiVersion: WHATSAPP_FLOW_DATA_API_VERSION, encryptionConfigured: isWhatsAppFlowEncryptionConfigured() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isWhatsAppFlowEncryptionConfigured()) return NextResponse.json({ error: "WhatsApp Flow encryption is not configured." }, { status: 503 });
  let encrypted: WhatsAppFlowEncryptedRequest;
  try {
    const body = await request.json() as Partial<WhatsAppFlowEncryptedRequest>;
    if (!body.encrypted_aes_key || !body.encrypted_flow_data || !body.initial_vector) return NextResponse.json({ error: "Encrypted Flow request is incomplete." }, { status: 400 });
    encrypted = body as WhatsAppFlowEncryptedRequest;
  } catch {
    return NextResponse.json({ error: "Malformed Flow request." }, { status: 400 });
  }

  try {
    const { data: incoming, aesKey, iv } = decryptWhatsAppFlowRequest(encrypted);
    const action = text(incoming.action).toUpperCase();
    if (action === "PING") return encryptedResponse({ version: WHATSAPP_FLOW_DATA_API_VERSION, data: { status: "active" } }, aesKey, iv);

    const flowToken = text(incoming.flow_token);
    if (!flowToken) return encryptedResponse({ version: WHATSAPP_FLOW_DATA_API_VERSION, data: { error_message: "This Flow session is missing its token. Please reopen the Flow." } }, aesKey, iv);
    const workspace = await workspaceForFlowToken(flowToken);
    if (!workspace) return encryptedResponse({ version: WHATSAPP_FLOW_DATA_API_VERSION, data: { error_message: "This Flow session could not be found. Please reopen the Flow." } }, aesKey, iv);

    return await runWithWhatsAppWorkspace(workspace.id, async () => {
      const loaded = await loadFlowForToken(flowToken);
      if (!loaded) return encryptedResponse({ version: WHATSAPP_FLOW_DATA_API_VERSION, data: { error_message: "This Flow session could not be found. Please reopen the Flow." } }, aesKey, iv);
      const screens = metaScreens(loaded.flow.flowJson);
      if (!screens.length) return encryptedResponse({ version: WHATSAPP_FLOW_DATA_API_VERSION, data: { error_message: "This Flow has no published screens." } }, aesKey, iv);

      const existing = object(loaded.submission.response_json);
      const submitted = object(incoming.data);
      const merged = { ...existing, ...submitted };
      if (action === "INIT") return encryptedResponse({ version: WHATSAPP_FLOW_DATA_API_VERSION, screen: text(screens[0].id), data: merged }, aesKey, iv);

      const currentId = text(incoming.screen);
      const currentIndex = Math.max(0, screens.findIndex((screen) => text(screen.id) === currentId));
      const terminal = currentIndex >= screens.length - 1;
      if (action === "DATA_EXCHANGE" || action === "DATA_EXCHANGE_REQUEST" || action === "SUBMIT") {
        if (terminal) {
          const completed = await completeWhatsAppFlowSubmission({ flowToken, response: merged, source: "DATA_API" });
          if (!completed.ok) return encryptedResponse({ version: WHATSAPP_FLOW_DATA_API_VERSION, data: { error_message: completed.error } }, aesKey, iv);
          return encryptedResponse({
            version: WHATSAPP_FLOW_DATA_API_VERSION,
            screen: "SUCCESS",
            data: { extension_message_response: { params: { flow_token: flowToken, ...merged } } },
          }, aesKey, iv);
        }
        await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_flow_submissions?id=eq.${encodeURIComponent(String(loaded.submission.id))}`, body: { response_json: merged, updated_at: new Date().toISOString() } });
        const next = screens[currentIndex + 1];
        return encryptedResponse({ version: WHATSAPP_FLOW_DATA_API_VERSION, screen: text(next.id), data: merged }, aesKey, iv);
      }
      if (action === "BACK") {
        const previous = screens[Math.max(0, currentIndex - 1)];
        return encryptedResponse({ version: WHATSAPP_FLOW_DATA_API_VERSION, screen: text(previous.id), data: merged }, aesKey, iv);
      }
      return encryptedResponse({ version: WHATSAPP_FLOW_DATA_API_VERSION, data: merged }, aesKey, iv);
    });
  } catch (error) {
    console.error("WhatsApp Flow Data API failed", error);
    return NextResponse.json({ error: "Flow request could not be decrypted or processed." }, { status: 421 });
  }
}
