import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import {
  WHATSAPP_INBOX_ACTIVITY_LIMIT,
  buildWhatsAppInboxActivity,
} from "@/lib/whatsapp/notifications";

export const runtime = "nodejs";

/**
 * The inbox's change feed.
 *
 * One small request answers both questions the console polls for: is there a new
 * inbound message worth alerting about, and has anything in the recent thread moved
 * (a reply stored, a delivery receipt applied). The browser refreshes the page only
 * when the fingerprint changes, so an idle inbox costs one tiny read per interval
 * instead of a full re-render of the conversation list.
 */
async function readRecentActivity() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return { ok: false as const, status: 503, error: "WhatsApp storage is not configured." };

  const response = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/whatsapp_messages?select=whatsapp_message_id,message_text,message_timestamp,direction,delivery_status,whatsapp_conversations(whatsapp_contacts(display_name,wa_id))&order=message_timestamp.desc&limit=${WHATSAPP_INBOX_ACTIVITY_LIMIT}`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    },
  );

  if (!response.ok) return { ok: false as const, status: 502, error: "Unable to check WhatsApp notifications." };
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return { ok: true as const, activity: buildWhatsAppInboxActivity(rows) };
}

export async function GET() {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const result = await readRecentActivity();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({
      latest: result.activity.latest,
      fingerprint: result.activity.fingerprint,
    });
  } catch (error) {
    console.error("Unable to load WhatsApp notification state", error);
    return NextResponse.json({ error: "Unable to check WhatsApp notifications." }, { status: 502 });
  }
}
