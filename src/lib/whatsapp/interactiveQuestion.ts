import { isFreeformReplyAllowed } from "./classify";
import { normalizeWhatsAppRecipient, type SendResult } from "./send";
import type { WhatsAppAutomationQuestionMode, WhatsAppAutomationQuestionOption } from "./automationModel";
import { resolveWhatsAppMetaConfig } from "./workspaceCredentials";

type Options = { env?: Record<string, string | undefined>; workspaceId?: string | null; fetch?: typeof globalThis.fetch; now?: number };
export type WhatsAppInteractiveQuestionInput = { to: string; question: string; mode: WhatsAppAutomationQuestionMode; choices: WhatsAppAutomationQuestionOption[]; customerMessageTimestamp: number; listButtonText?: string };
export function buildWhatsAppInteractiveQuestionPayload(input: WhatsAppInteractiveQuestionInput) {
  const body = input.question.trim();
  if (input.mode === "BUTTONS") return { messaging_product: "whatsapp", recipient_type: "individual", to: input.to, type: "interactive", interactive: { type: "button", body: { text: body }, action: { buttons: input.choices.slice(0, 3).map((choice) => ({ type: "reply", reply: { id: choice.id, title: choice.title } })) } } };
  return { messaging_product: "whatsapp", recipient_type: "individual", to: input.to, type: "interactive", interactive: { type: "list", body: { text: body }, action: { button: input.listButtonText?.trim() || "Choose", sections: [{ rows: input.choices.slice(0, 10).map((choice) => ({ id: choice.id, title: choice.title, ...(choice.description ? { description: choice.description } : {}) })) }] } } };
}
export async function sendWhatsAppInteractiveQuestion(input: WhatsAppInteractiveQuestionInput, options: Options = {}): Promise<SendResult> {
  const meta = await resolveWhatsAppMetaConfig({ workspaceId: options.workspaceId, env: options.env });
  if (!meta) return { sent: false, reason: "NOT_CONFIGURED" };
  if (!isFreeformReplyAllowed(input.customerMessageTimestamp, options.now)) return { sent: false, reason: "SERVICE_WINDOW_CLOSED" };
  const recipient = normalizeWhatsAppRecipient(input.to); if (!recipient) return { sent: false, reason: "INVALID_RECIPIENT" };
  try {
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${meta.apiVersion}/${meta.phoneNumberId}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${meta.token}`, "Content-Type": "application/json" }, body: JSON.stringify(buildWhatsAppInteractiveQuestionPayload({ ...input, to: recipient })),
    });
    const payload = await response.json().catch(() => null) as { messages?: Array<{ id?: string }>; error?: { code?: number } } | null; const messageId = payload?.messages?.[0]?.id;
    if (response.ok && messageId) return { sent: true, messageId };
    const code = payload?.error?.code; const diagnostic = { status: response.status, ...(typeof code === "number" ? { code } : {}) };
    if (code === 190) return { sent: false, reason: "TOKEN_EXPIRED", diagnostic };
    if (response.status === 401 || response.status === 403 || code === 10 || code === 200) return { sent: false, reason: "PERMISSION_DENIED", diagnostic };
    if (response.status >= 500) return { sent: false, reason: "META_SERVICE_ERROR", diagnostic };
    return { sent: false, reason: "API_ERROR", diagnostic };
  } catch { return { sent: false, reason: "API_ERROR" }; }
}
