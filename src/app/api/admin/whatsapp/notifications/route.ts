import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { buildWhatsAppInboxNotification } from "@/lib/whatsapp/notifications";

export const runtime = "nodejs";

async function readLatestInboundMessage() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return { ok: false as const, status: 503, error: "WhatsApp storage is not configured." };

  const response = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/whatsapp_messages?direction=eq.inbound&select=whatsapp_message_id,message_text,message_timestamp,whatsapp_conversations(whatsapp_contacts(display_name,wa_id))&order=message_timestamp.desc&limit=1`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    },
  );

  if (!response.ok) return { ok: false as const, status: 502, error: "Unable to check WhatsApp notifications." };
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return { ok: true as const, latest: rows[0] ? buildWhatsAppInboxNotification(rows[0]) : null };
}

export async function GET() {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const result = await readLatestInboundMessage();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ latest: result.latest });
  } catch (error) {
    console.error("Unable to load WhatsApp notification state", error);
    return NextResponse.json({ error: "Unable to check WhatsApp notifications." }, { status: 502 });
  }
}
