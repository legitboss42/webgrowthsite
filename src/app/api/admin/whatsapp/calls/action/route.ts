import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { getWhatsAppSupabaseConfig } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";

export const runtime = "nodejs";

type CallAction = "pre_accept" | "accept" | "reject" | "terminate";
const ALLOWED_ACTIONS = new Set<CallAction>(["pre_accept", "accept", "reject", "terminate"]);

async function updateStoredCall(callId: string, action: CallAction) {
  const config = getWhatsAppSupabaseConfig();
  if (!config) return;
  const now = new Date().toISOString();
  const body: Record<string, unknown> = { updated_at: now, last_event_at: now };
  if (action === "accept") {
    body.status = "accepted";
    body.answered_at = now;
  } else if (action === "reject") {
    body.status = "rejected";
    body.ended_at = now;
  } else if (action === "terminate") {
    body.status = "terminated";
    body.ended_at = now;
  }

  if (!body.status) return;
  await fetch(`${config.url}/rest/v1/whatsapp_calls?call_id=eq.${encodeURIComponent(callId)}`, {
    method: "PATCH",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  }).catch(() => undefined);
}

export async function POST(request: Request) {
  if (!(await getWhatsAppWorkspaceAccess(await cookies()))) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0";
  if (!token || !phoneNumberId) {
    return NextResponse.json({ error: "WhatsApp Calling API is not configured." }, { status: 503 });
  }

  const input = (await request.json().catch(() => null)) as {
    callId?: unknown;
    action?: unknown;
    sdp?: unknown;
  } | null;
  const callId = typeof input?.callId === "string" ? input.callId.trim() : "";
  const action = typeof input?.action === "string" ? input.action.trim() as CallAction : ("" as CallAction);
  const sdp = typeof input?.sdp === "string" ? input.sdp : "";

  if (!callId || !ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Invalid call action." }, { status: 400 });
  }
  if ((action === "pre_accept" || action === "accept") && !sdp.trim()) {
    return NextResponse.json({ error: "An SDP answer is required to answer this call." }, { status: 400 });
  }

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    call_id: callId,
    action,
  };
  if (action === "pre_accept" || action === "accept") {
    body.session = { sdp_type: "answer", sdp };
  }

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/calls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const metaError = payload?.error && typeof payload.error === "object" ? payload.error as Record<string, unknown> : null;
    const message = typeof metaError?.message === "string" ? metaError.message : "Meta rejected the call action.";
    console.error("WhatsApp call action failed", { action, status: response.status, code: metaError?.code, message });
    return NextResponse.json({ error: message }, { status: response.status >= 400 && response.status < 600 ? response.status : 502 });
  }

  await updateStoredCall(callId, action);
  return NextResponse.json({ ok: true, action, meta: payload });
}
