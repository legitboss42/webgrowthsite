import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import {
  mutateWhatsAppRest,
  POSTGRES_UNIQUE_VIOLATION,
  probeWhatsAppTable,
  readWhatsAppRows,
} from "@/app/admin/whatsapp/data";
import { buildWhatsAppTeamInvitationEmail } from "@/emails/whatsapp-team-invitation";
import { ADMIN_EMAIL, sendTransactionalEmail } from "@/lib/email";
import { generateWorkspacePasswordSetupLink } from "@/lib/whatsapp/passwordAuth";
import {
  isValidWhatsAppTeamEmail,
  normalizeWhatsAppTeamEmail,
  normalizeWhatsAppTeamMember,
  normalizeWhatsAppTeamRole,
  canWhatsAppRoleManageTeam,
  canWhatsAppRoleSuperviseTeam,
} from "@/lib/whatsapp/teamModel";
import { isSameOriginMutation } from "@/lib/scheduler/policy";

export const runtime = "nodejs";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function getTeamContext() {
  const cookieStore = await cookies();
  const access = await getWhatsAppWorkspaceAccess(cookieStore);
  if (!access || !canWhatsAppRoleSuperviseTeam(access.role)) return null;
  return access;
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
  actorMemberId?: string | null;
  actorEmail: string;
  targetMemberId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_team_activity",
    body: {
      actor_member_id: input.actorMemberId || null,
      actor_email: input.actorEmail,
      target_member_id: input.targetMemberId || null,
      event_type: input.eventType,
      metadata: input.metadata || {},
    },
  });
}

export async function GET() {
  const access = await getTeamContext();
  if (!access) {
    return NextResponse.json({ error: "Manager or Owner access required." }, { status: 403 });
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
    viewerRole: access.role,
    members: rows.map(normalizeWhatsAppTeamMember),
  });
}

export async function POST(request: Request) {
  const access = await getTeamContext();
  if (!access) {
    return NextResponse.json({ error: "Manager or Owner access required." }, { status: 403 });
  }
  if (!canWhatsAppRoleManageTeam(access.role)) {
    return NextResponse.json({ error: "Only the Owner can add team members." }, { status: 403 });
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
      availability: "offline",
      active: true,
      created_by_email: access.email,
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
      actorMemberId: access.memberId,
      actorEmail: access.email,
      targetMemberId: member.id,
      eventType: "team_member_created",
      metadata: { googleEmail: member.googleEmail, role: member.role },
    });
  }

  let invite: {
    sent: boolean;
    reason?: "setup_required" | "delivery_failed" | "member_not_created";
  } = { sent: false, reason: "member_not_created" };

  if (member) {
    let passwordSetupUrl: string | null = null;
    try {
      passwordSetupUrl = await generateWorkspacePasswordSetupLink(member.googleEmail);
    } catch (error) {
      console.error("WhatsApp team password setup link failed", error);
    }

    const invitation = buildWhatsAppTeamInvitationEmail({
      displayName: member.displayName,
      googleEmail: member.googleEmail,
      role: member.role,
      invitedByEmail: access.email,
      passwordSetupUrl,
    });

    try {
      const delivery = await sendTransactionalEmail({
        to: [{ email: member.googleEmail, name: member.displayName }],
        replyTo: { email: ADMIN_EMAIL, name: "Web Growth" },
        subject: invitation.subject,
        text: invitation.text,
        html: invitation.html,
      });

      if (delivery.ok) {
        invite = { sent: true };
        await recordActivity({
          actorMemberId: access.memberId,
          actorEmail: access.email,
          targetMemberId: member.id,
          eventType: "team_invite_sent",
          metadata: {
            googleEmail: member.googleEmail,
            passwordSetupIncluded: Boolean(passwordSetupUrl),
          },
        });
      } else {
        invite = { sent: false, reason: "setup_required" };
        await recordActivity({
          actorMemberId: access.memberId,
          actorEmail: access.email,
          targetMemberId: member.id,
          eventType: "team_invite_failed",
          metadata: { reason: "email_setup_required" },
        });
      }
    } catch (error) {
      console.error("WhatsApp team invitation email failed", error);
      invite = { sent: false, reason: "delivery_failed" };
      await recordActivity({
        actorMemberId: access.memberId,
        actorEmail: access.email,
        targetMemberId: member.id,
        eventType: "team_invite_failed",
        metadata: { reason: "delivery_failed" },
      });
    }
  }

  return NextResponse.json({ ok: true, member, invite }, { status: 201 });
}

export async function PATCH(request: Request) {
  const access = await getTeamContext();
  if (!access) {
    return NextResponse.json({ error: "Manager or Owner access required." }, { status: 403 });
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
  if ("availability" in body) {
    return NextResponse.json(
      { error: "Activity status is self-managed. Each team member changes their own Online, Away, or Offline status." },
      { status: 403 },
    );
  }

  const targetRows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_team_members?id=eq.${encodeURIComponent(id)}&select=id,google_email,display_name,role,availability,active,google_user_id,last_seen_at,created_at,updated_at&limit=1`,
  );
  const target = targetRows?.[0] ? normalizeWhatsAppTeamMember(targetRows[0]) : null;
  if (!target) {
    return NextResponse.json({ error: "Team member was not found." }, { status: 404 });
  }

  if (access.role === "manager") {
    if (target.role !== "agent") {
      return NextResponse.json({ error: "Managers can only supervise Agents." }, { status: 403 });
    }
    if ("role" in body || "displayName" in body) {
      return NextResponse.json({ error: "Only the Owner can change team roles or names." }, { status: 403 });
    }
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
    actorMemberId: access.memberId,
    actorEmail: access.email,
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
