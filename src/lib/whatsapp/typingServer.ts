import { resolveWhatsAppMetaConfig } from "./workspaceCredentials";

export type WhatsAppTypingResult =
  | { sent: true }
  | {
      sent: false;
      reason:
        | "NOT_CONFIGURED"
        | "INVALID_MESSAGE_ID"
        | "TOKEN_EXPIRED"
        | "PERMISSION_DENIED"
        | "META_SERVICE_ERROR"
        | "API_ERROR";
    };

type TypingOptions = {
  env?: Record<string, string | undefined>;
  workspaceId?: string | null;
  fetch?: typeof globalThis.fetch;
};

function classifyTypingFailure(
  status: number,
  payload: unknown,
): Extract<WhatsAppTypingResult, { sent: false }> {
  const error = (payload as { error?: { code?: number } } | null)?.error;
  const code = typeof error?.code === "number" ? error.code : undefined;
  if (code === 190) return { sent: false, reason: "TOKEN_EXPIRED" };
  if (status === 401 || status === 403 || code === 10 || code === 200) {
    return { sent: false, reason: "PERMISSION_DENIED" };
  }
  if (code === 131009 || code === 100) return { sent: false, reason: "INVALID_MESSAGE_ID" };
  if (status >= 500) return { sent: false, reason: "META_SERVICE_ERROR" };
  return { sent: false, reason: "API_ERROR" };
}

/** Server-only Meta call. Keep credentials and Node-only workspace resolution out of client bundles. */
export async function sendWhatsAppTypingIndicator(
  input: { messageId: string },
  options: TypingOptions = {},
): Promise<WhatsAppTypingResult> {
  const meta = await resolveWhatsAppMetaConfig({
    workspaceId: options.workspaceId,
    env: options.env,
  });
  if (!meta) return { sent: false, reason: "NOT_CONFIGURED" };

  const messageId = input.messageId.trim();
  if (!messageId) return { sent: false, reason: "INVALID_MESSAGE_ID" };

  try {
    const response = await (options.fetch || globalThis.fetch)(
      `https://graph.facebook.com/${meta.apiVersion}/${meta.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${meta.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
          typing_indicator: { type: "text" },
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      console.warn(
        "WhatsApp typing indicator refused",
        response.status,
        meta.workspaceId || "test",
      );
      return classifyTypingFailure(response.status, payload);
    }
    return { sent: true };
  } catch (error) {
    console.warn("Unable to reach Meta for the WhatsApp typing indicator", error);
    return { sent: false, reason: "API_ERROR" };
  }
}
