import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import {
  mutateWhatsAppRest,
  POSTGRES_UNIQUE_VIOLATION,
  probeWhatsAppTable,
  readWhatsAppRows,
} from "@/app/admin/whatsapp/data";
import {
  getDefaultAdminGoogleEmail,
  readGoogleAuthSessionFromCookieStore,
} from "@/lib/googleAuth";
import {
  isValidWhatsAppTeamEmail,
  normalizeWhatsAppTeamAvailability,
  normalizeWhatsAppTeamEmail,
  normalizeWhatsAppTeamMember,
  normalizeWhatsAppTeamRole,
} from "@/lib/whatsapp/teamModel";
import { isSameOriginMutation } from "@/lib/scheduler/policy";

export const runtime = "nodejs";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function getOwnerContext() {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) return null;
  const session = readGoogleAuthSessionFromCookieStore(cookieStore);
  return {
    actorEmail: session?.email || getDefaultAdminGoogleEmail(),
  };
}

async function ensureTeamStorage() {
  const status = await probeWhatsAppTable("whatsapp_team_members");
  if (status === "ok") return null;
  return NextResponse.json(
    {
      error:
        status === "missing"
          ? "Stage 2 team storage has not been created yet. Apply the WhatsApp team migration in Supabase."
          : "WhatsApp team storage is unavailable.",
      migrationRequired: status === "missing",
    },
    { status: 503 },
  );
}

async function recordActivity(input: {
  actorEmail: string;
  targetMemberId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_team_activity",
    body: {
      actor_email: input.actorEmail,
      target_member_id: input.targetMemberId || null,
      event_type: input.eventType,
      metadata: input.metadata || {},
    },
  });
}

export async function GET() {
  const owner = await getOwnerContext();
  if (!owner) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const storageError = await ensureTeamStorage();
  if (storageError) return storageError;

  const rows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_team_members?select=id,google_email,display_name,role,availability,active,google_user_id,last_seen_at,created_at,updated_at&order=active.desc,display_name.asc",
  );
  if (!rows) {
    return NextResponse.json({ error: "Team members could not be loaded." }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    members: rows.map(normalizeWhatsAppTeamMember),
  });
}

export async function POST(request: Request) {
  const owner = await getOwnerContext();
  if (!owner) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const storageError = await ensureTeamStorage();
  if (storageError) return storageError;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const displayName = cleanText(body.displayName, 120);
  const googleEmail = normalizeWhatsAppTeamEmail(body.googleEmail);
  const role = normalizeWhatsAppTeamRole(body.role) || "agent";

  if (displayName.length < 2) {
    return NextResponse.json({ error: "Enter the team member's name." }, { status: 400 });
  }
  if (!isValidWhatsAppTeamEmail(googleEmail)) {
    return NextResponse.json({ error: "Enter a valid Google email address." }, { status: 400 });
  }

  const created = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_team_members",
    body: {
      display_name: displayName,
      google_email: googleEmail,
      role,
      availability: "available",
      active: true,
      created_by_email: owner.actorEmail,
      updated_at: new Date().toISOString(),
    },
  });

  if (!created.ok) {
    if (created.code === POSTGRES_UNIQUE_VIOLATION) {
      return NextResponse.json({ error: "That Google account is already on the team." }, { status: 409 });
    }
    return NextResponse.json({ error: created.message }, { status: created.status });
  }

  const member = created.rows[0] ? normalizeWhatsAppTeamMember(created.rows[0]) : null;
  if (member) {
    await recordActivity({
      actorEmail: owner.actorEmail,
      targetMemberId: member.id,
      eventType: "team_member_created",
      metadata: { googleEmail: member.googleEmail, role: member.role },
    });
  }

  return NextResponse.json({ ok: true, member }, { status: 201 });
}

export async function PATCH(request: Request) {
  const owner = await getOwnerContext();
  if (!owner) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const storageError = await ensureTeamStorage();
  if (storageError) return storageError;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const id = cleanText(body.id, 80);
  if (!id) {
    return NextResponse.json({ error: "Team member id is required." }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ("displayName" in body) {
    const displayName = cleanText(body.displayName, 120);
    if (displayName.length < 2) {
      return NextResponse.json({ error: "Enter the team member's name." }, { status: 400 });
    }
    patch.display_name = displayName;
  }

  if ("role" in body) {
    const role = normalizeWhatsAppTeamRole(body.role);
    if (!role) return NextResponse.json({ error: "Invalid team role." }, { status: 400 });
    patch.role = role;
  }

  if ("availability" in body) {
    const availability = normalizeWhatsAppTeamAvailability(body.availability);
    if (!availability) {
      return NextResponse.json({ error: "Invalid availability state." }, { status: 400 });
    }
    patch.availability = availability;
  }

  if ("active" in body) {
    if (typeof body.active !== "boolean") {
      return NextResponse.json({ error: "Invalid active state." }, { status: 400 });
    }
    patch.active = body.active;
    if (body.active === false) patch.availability = "offline";
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "No changes were provided." }, { status: 400 });
  }

  const updated = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_team_members?id=eq.${encodeURIComponent(id)}`,
    body: patch,
  });

  if (!updated.ok) {
    return NextResponse.json({ error: updated.message }, { status: updated.status });
  }
  if (!updated.rows[0]) {
    return NextResponse.json({ error: "Team member was not found." }, { status: 404 });
  }

  const member = normalizeWhatsAppTeamMember(updated.rows[0]);
  await recordActivity({
    actorEmail: owner.actorEmail,
    targetMemberId: member.id,
    eventType: member.active ? "team_member_updated" : "team_member_deactivated",
    metadata: {
      role: member.role,
      availability: member.availability,
      active: member.active,
    },
  });

  return NextResponse.json({ ok: true, member });
}
