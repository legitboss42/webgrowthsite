import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import {
  WHATSAPP_INBOX_ACTIVITY_LIMIT,
  buildWhatsAppInboxActivity,
} from "@/lib/whatsapp/notifications";
import { loadWhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";
import { canWhatsAppRoleViewAllConversations } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

function assignedMemberId(row: Record<string, unknown>) {
  const conversation = row.whatsapp_conversations;
  if (!conversation || typeof conversation !== "object" || Array.isArray(conversation)) return null;
  const value = (conversation as Record<string, unknown>).assigned_member_id;
  return typeof value === "string" ? value : null;
}

async function readRecentActivity(input: { memberId: string | null; canViewAll: boolean }) {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return { ok: false as const, status: 503, error: "WhatsApp storage is not configured." };

  const response = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/whatsapp_messages?select=whatsapp_message_id,message_text,message_timestamp,direction,delivery_status,whatsapp_conversations(assigned_member_id,whatsapp_contacts(display_name,wa_id))&order=message_timestamp.desc&limit=${WHATSAPP_INBOX_ACTIVITY_LIMIT}`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    },
  );

  if (!response.ok) return { ok: false as const, status: 502, error: "Unable to check WhatsApp notifications." };
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  const accessibleRows = input.canViewAll
    ? rows
    : rows.filter((row) => {
        const assigned = assignedMemberId(row);
        return !assigned || (input.memberId !== null && assigned === input.memberId);
      });

  const activity = buildWhatsAppInboxActivity(accessibleRows);
  if (!input.canViewAll && activity.latest) {
    const latestRow = accessibleRows.find(
      (row) => row.whatsapp_message_id === activity.latest?.id,
    );
    // Unassigned messages are included in the fingerprint so an Agent's Unassigned
    // view refreshes promptly, but they do not produce personal alerts until claimed.
    if (!latestRow || !assignedMemberId(latestRow)) {
      return { ok: true as const, activity: { ...activity, latest: null } };
    }
  }

  return { ok: true as const, activity };
}

export async function GET() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const [result, quickSettings] = await Promise.all([
      readRecentActivity({
        memberId: access.memberId,
        canViewAll: canWhatsAppRoleViewAllConversations(access.role),
      }),
      loadWhatsAppQuickSettings(),
    ]);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({
      latest: quickSettings.newMessageAlertsEnabled ? result.activity.latest : null,
      fingerprint: result.activity.fingerprint,
      alertsEnabled: quickSettings.newMessageAlertsEnabled,
    });
  } catch (error) {
    console.error("Unable to load WhatsApp notification state", error);
    return NextResponse.json({ error: "Unable to check WhatsApp notifications." }, { status: 502 });
  }
}
