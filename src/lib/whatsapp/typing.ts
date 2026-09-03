/** Client-safe typing-indicator throttle. No server credentials belong in this module. */
export const WHATSAPP_TYPING_REFRESH_MS = 8_000;

export function shouldSendWhatsAppTypingSignal(input: {
  hasDraft: boolean;
  lastSentAt?: number;
  now: number;
  refreshMs?: number;
}): boolean {
  if (!input.hasDraft) return false;
  if (input.lastSentAt === undefined) return true;
  return input.now - input.lastSentAt >= (input.refreshMs ?? WHATSAPP_TYPING_REFRESH_MS);
}
