import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { resolveWhatsAppAnalyticsRange } from "@/app/admin/whatsapp/analyticsModel";

export const runtime = "nodejs";

const ROW_LIMIT = 20000;

type CallRow = {
  direction?: string;
  status?: string;
  started_at?: string | null;
  answered_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
};

function isAnswered(call: CallRow) {
  const status = call.status?.toLowerCase() || "";
  return Boolean(call.answered_at) || status === "accepted" || status === "connected" || status === "completed";
}

function isActive(call: CallRow) {
  if (call.ended_at) return false;
  const status = call.status?.toLowerCase() || "";
  return status === "ringing" || status === "connecting" || status === "accepted" || status === "connected";
}

function isMissedIncoming(call: CallRow) {
  if (call.direction !== "inbound" || isAnswered(call)) return false;
  const status = call.status?.toLowerCase() || "";
  return Boolean(call.ended_at) || ["missed", "rejected", "failed", "terminate", "terminated"].includes(status);
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const range = resolveWhatsAppAnalyticsRange(url.searchParams.get("days") || undefined);
  const sinceIso = new Date(Date.now() - (range - 1) * 24 * 60 * 60 * 1000).toISOString();

  const rows = await readWhatsAppRows<CallRow>(
    `whatsapp_calls?select=direction,status,started_at,answered_at,ended_at,duration_seconds&started_at=gte.${encodeURIComponent(
      sinceIso,
    )}&order=started_at.desc&limit=${ROW_LIMIT}`,
  );

  if (!rows) {
    return NextResponse.json(
      { error: "Call analytics could not be read from WhatsApp call history." },
      { status: 503 },
    );
  }

  let incoming = 0;
  let outgoing = 0;
  let answered = 0;
  let answeredIncoming = 0;
  let missed = 0;
  let active = 0;
  let totalTalkSeconds = 0;
  let durationSamples = 0;

  for (const call of rows) {
    const direction = call.direction === "outbound" ? "outbound" : "inbound";
    if (direction === "outbound") outgoing += 1;
    else incoming += 1;

    const answeredCall = isAnswered(call);
    if (answeredCall) {
      answered += 1;
      if (direction === "inbound") answeredIncoming += 1;
    }
    if (isMissedIncoming({ ...call, direction })) missed += 1;
    if (isActive(call)) active += 1;

    const duration = typeof call.duration_seconds === "number" && Number.isFinite(call.duration_seconds)
      ? Math.max(0, call.duration_seconds)
      : 0;
    if (duration > 0) {
      totalTalkSeconds += duration;
      durationSamples += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    analytics: {
      range,
      total: rows.length,
      incoming,
      outgoing,
      answered,
      missed,
      active,
      answerRate: incoming > 0 ? answeredIncoming / incoming : null,
      averageDurationSeconds: durationSamples > 0 ? totalTalkSeconds / durationSamples : null,
      totalTalkSeconds,
    },
  });
}
