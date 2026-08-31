import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  normalizeWhatsAppTeamAvailability,
  normalizeWhatsAppTeamMember,
} from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

export async function GET() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const rows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_team_members?active=eq.true&select=id,google_email,display_name,role,availability,active,google_user_id,last_seen_at,created_at,updated_at&order=role.asc,display_name.asc",
  );
  if (!rows) {
    return NextResponse.json({ error: "Team presence could not be loaded." }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    viewerMemberId: access.memberId,
    members: rows.map(normalizeWhatsAppTeamMember),
  });
}

export async function PATCH(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!access.memberId) {
    return NextResponse.json({ error: "Your team profile is not ready yet." }, { status: 409 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: { availability?: unknown };
  try {
    body = (await request.json()) as { availability?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const availability = normalizeWhatsAppTeamAvailability(body.availability);
  if (!availability) {
    return NextResponse.json({ error: "Invalid presence state." }, { status: 400 });
  }

  const currentRows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_team_members?id=eq.${encodeURIComponent(access.memberId)}&active=eq.true&select=id,google_email,display_name,role,availability,active,google_user_id,last_seen_at,created_at,updated_at&limit=1`,
  );
  const current = currentRows?.[0] ? normalizeWhatsAppTeamMember(currentRows[0]) : null;
  if (!current) {
    return NextResponse.json({ error: "Your active team profile was not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updated = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_team_members?id=eq.${encodeURIComponent(access.memberId)}&active=eq.true`,
    body: {
      availability,
      last_seen_at: now,
      updated_at: now,
    },
  });
  if (!updated.ok || !updated.rows[0]) {
    return NextResponse.json(
      { error: updated.ok ? "Presence could not be saved." : updated.message },
      { status: updated.ok ? 503 : updated.status },
    );
  }

  const member = normalizeWhatsAppTeamMember(updated.rows[0]);
  if (current.availability !== member.availability) {
    await mutateWhatsAppRest({
      method: "POST",
      pathAndQuery: "whatsapp_team_activity",
      body: {
        actor_member_id: access.memberId,
        actor_email: access.email,
        target_member_id: access.memberId,
        event_type: "availability_changed",
        metadata: {
          previousAvailability: current.availability,
          availability: member.availability,
        },
      },
    });
  }

  return NextResponse.json({ ok: true, member });
}
