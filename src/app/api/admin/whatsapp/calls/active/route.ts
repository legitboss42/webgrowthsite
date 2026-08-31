import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";

export const runtime = "nodejs";

type StoredCall = {
  call_id: string;
  customer_wa_id: string | null;
  customer_name: string | null;
  status: string;
  started_at: string | null;
  raw: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getOfferSdp(raw: unknown) {
  const record = asRecord(raw);
  const session = asRecord(record?.session);
  return typeof session?.sdp === "string" ? session.sdp : null;
}

export async function GET(request: Request) {
  if (!(await getWhatsAppWorkspaceAccess(await cookies()))) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const callId = url.searchParams.get("callId")?.trim();
  const query = [
    "select=call_id,customer_wa_id,customer_name,status,started_at,raw",
    "direction=eq.inbound",
    "ended_at=is.null",
    "order=last_event_at.desc",
    "limit=1",
  ];
  if (callId) query.push(`call_id=eq.${encodeURIComponent(callId)}`);
  else query.push("status=eq.ringing");

  const rows = await readWhatsAppRows<StoredCall>(`whatsapp_calls?${query.join("&")}`);
  const call = rows?.[0];
  if (!call) return NextResponse.json({ call: null });

  const offerSdp = getOfferSdp(call.raw);
  if (!offerSdp) {
    return NextResponse.json({ error: "The incoming call does not contain a usable SDP offer." }, { status: 409 });
  }

  return NextResponse.json({
    call: {
      callId: call.call_id,
      customerWaId: call.customer_wa_id,
      customerName: call.customer_name,
      status: call.status,
      startedAt: call.started_at,
      offerSdp,
    },
  });
}
