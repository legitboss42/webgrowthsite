import { NextResponse } from "next/server";
import {
  createWhatsAppAutomationEventId,
  dispatchWhatsAppAutomationEvent,
  hashWhatsAppAutomationPayload,
} from "@/lib/whatsapp/automationRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanKey(value: string) {
  const key = value.trim();
  return /^[a-z0-9_-]{8,80}$/i.test(key) ? key : "";
}

function cleanId(value: unknown) {
  return typeof value === "string" && /^[0-9a-f-]{20,100}$/i.test(value.trim()) ? value.trim() : undefined;
}

function cleanWaId(value: unknown) {
  return typeof value === "string" && /^\+?[0-9]{8,20}$/.test(value.trim()) ? value.trim().replace(/^\+/, "") : undefined;
}

export async function POST(request: Request, context: { params: Promise<{ key: string }> }) {
  const { key: rawKey } = await context.params;
  const key = cleanKey(rawKey);
  if (!key) return NextResponse.json({ error: "Invalid automation webhook key." }, { status: 404 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 128 * 1024) return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });

  let body: Record<string, unknown> = {};
  const raw = await request.text();
  if (raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : { value: parsed };
    } catch {
      return NextResponse.json({ error: "Webhook payload must be valid JSON." }, { status: 400 });
    }
  }

  const explicitEventId = typeof body.eventId === "string" && body.eventId.trim() ? body.eventId.trim().slice(0, 180) : request.headers.get("x-webgrowth-event-id")?.trim().slice(0, 180);
  const eventId = explicitEventId || `${Date.now()}:${hashWhatsAppAutomationPayload(body).slice(0, 24)}:${createWhatsAppAutomationEventId().slice(0, 8)}`;
  const result = await dispatchWhatsAppAutomationEvent({
    type: "WEBHOOK",
    eventKey: `webhook:${key}:${eventId}`,
    triggerValue: key,
    contactId: cleanId(body.contactId),
    conversationId: cleanId(body.conversationId),
    waId: cleanWaId(body.waId),
    payload: body,
  });

  return NextResponse.json({ ok: true, eventId, ...result });
}
