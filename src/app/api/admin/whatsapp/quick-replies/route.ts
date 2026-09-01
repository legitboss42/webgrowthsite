import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getWhatsAppWorkspaceAccess,
  type WhatsAppWorkspaceAccess,
} from "@/app/admin/whatsapp/auth";
import {
  POSTGRES_UNIQUE_VIOLATION,
  mutateWhatsAppRest,
  readWhatsAppRows,
} from "@/app/admin/whatsapp/data";
import {
  normalizeWhatsAppQuickReplyRow,
  validateWhatsAppQuickReplyInput,
  type WhatsAppQuickReply,
} from "@/app/admin/whatsapp/quickRepliesModel";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { deleteWhatsAppSavedReplyMedia } from "@/lib/whatsapp/savedReplyMedia";

export const runtime = "nodejs";

const TABLE = "whatsapp_quick_replies";
const STAGE4_SELECT = "id,shortcut,title,body,scope,category,owner_member_id,created_by_member_id,created_at,updated_at";
const DUPLICATE_MESSAGE = "That shortcut already exists in this saved-reply scope.";

async function guard(request: Request): Promise<
  | { access: WhatsAppWorkspaceAccess; response?: never }
  | { access?: never; response: NextResponse }
> {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) };
  }
  return { access };
}

async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function isStage4Ready() {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `${TABLE}?select=id,scope,category,owner_member_id&limit=1`,
  );
  return rows !== null;
}

async function getReply(id: string): Promise<{ ready: boolean; reply: WhatsAppQuickReply | null }> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `${TABLE}?id=eq.${encodeURIComponent(id)}&select=${STAGE4_SELECT}&limit=1`,
  );
  if (rows === null) return { ready: false, reply: null };
  return { ready: true, reply: rows[0] ? normalizeWhatsAppQuickReplyRow(rows[0]) : null };
}

async function getOptionalMediaPath(id: string) {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `${TABLE}?id=eq.${encodeURIComponent(id)}&select=media_path&limit=1`,
  );
  if (rows === null) return undefined;
  return typeof rows[0]?.media_path === "string" ? rows[0].media_path : undefined;
}

function canEditReply(access: WhatsAppWorkspaceAccess, reply: WhatsAppQuickReply) {
  if (reply.scope === "TEAM") return canWhatsAppRoleSuperviseTeam(access.role);
  return Boolean(access.memberId && reply.owner_member_id === access.memberId);
}

function permissionForTargetScope(access: WhatsAppWorkspaceAccess, scope: "TEAM" | "PERSONAL") {
  if (scope === "TEAM") {
    return canWhatsAppRoleSuperviseTeam(access.role)
      ? null
      : NextResponse.json({ error: "Only an Owner or Manager can manage Team saved replies." }, { status: 403 });
  }
  if (!access.memberId) {
    return NextResponse.json({ error: "Your team profile is required for Personal saved replies." }, { status: 409 });
  }
  return null;
}

export async function POST(request: Request) {
  const guarded = await guard(request);
  if (guarded.response) return guarded.response;
  const { access } = guarded;

  if (!(await isStage4Ready())) {
    return NextResponse.json({ error: "Stage 4 saved replies are waiting for the additive Supabase migration." }, { status: 503 });
  }

  const body = await readJsonBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  const validation = validateWhatsAppQuickReplyInput(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const scopeBlocked = permissionForTargetScope(access, validation.value.scope);
  if (scopeBlocked) return scopeBlocked;

  const result = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: TABLE,
    body: {
      shortcut: validation.value.shortcut,
      title: validation.value.title,
      body: validation.value.body,
      scope: validation.value.scope,
      category: validation.value.category,
      owner_member_id: validation.value.scope === "PERSONAL" ? access.memberId : null,
      created_by_member_id: access.memberId,
    },
  });

  if (!result.ok) {
    const duplicate = result.code === POSTGRES_UNIQUE_VIOLATION;
    return NextResponse.json(
      { error: duplicate ? DUPLICATE_MESSAGE : result.message },
      { status: duplicate ? 409 : result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    quickReply: result.rows[0] ? normalizeWhatsAppQuickReplyRow(result.rows[0]) : null,
  });
}

export async function PATCH(request: Request) {
  const guarded = await guard(request);
  if (guarded.response) return guarded.response;
  const { access } = guarded;

  const body = await readJsonBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  const id = readId(body.id);
  if (!id) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });

  const existing = await getReply(id);
  if (!existing.ready) {
    return NextResponse.json({ error: "Stage 4 saved replies are waiting for the additive Supabase migration." }, { status: 503 });
  }
  if (!existing.reply) return NextResponse.json({ error: "That saved reply no longer exists." }, { status: 404 });
  if (!canEditReply(access, existing.reply)) {
    return NextResponse.json({ error: "You do not have permission to edit that saved reply." }, { status: 403 });
  }

  const validation = validateWhatsAppQuickReplyInput(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const scopeBlocked = permissionForTargetScope(access, validation.value.scope);
  if (scopeBlocked) return scopeBlocked;

  const result = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`,
    body: {
      shortcut: validation.value.shortcut,
      title: validation.value.title,
      body: validation.value.body,
      scope: validation.value.scope,
      category: validation.value.category,
      owner_member_id: validation.value.scope === "PERSONAL" ? access.memberId : null,
      updated_at: new Date().toISOString(),
    },
  });

  if (!result.ok) {
    const duplicate = result.code === POSTGRES_UNIQUE_VIOLATION;
    return NextResponse.json(
      { error: duplicate ? DUPLICATE_MESSAGE : result.message },
      { status: duplicate ? 409 : result.status },
    );
  }
  if (result.rows.length === 0) return NextResponse.json({ error: "That saved reply no longer exists." }, { status: 404 });
  return NextResponse.json({ ok: true, quickReply: normalizeWhatsAppQuickReplyRow(result.rows[0]) });
}

export async function DELETE(request: Request) {
  const guarded = await guard(request);
  if (guarded.response) return guarded.response;
  const { access } = guarded;

  const body = await readJsonBody(request);
  const id = readId(body?.id);
  if (!id) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });

  const existing = await getReply(id);
  if (!existing.ready) {
    return NextResponse.json({ error: "Stage 4 saved replies are waiting for the additive Supabase migration." }, { status: 503 });
  }
  if (!existing.reply) return NextResponse.json({ error: "That saved reply no longer exists." }, { status: 404 });
  if (!canEditReply(access, existing.reply)) {
    return NextResponse.json({ error: "You do not have permission to delete that saved reply." }, { status: 403 });
  }

  const mediaPath = await getOptionalMediaPath(id);
  const result = await mutateWhatsAppRest({
    method: "DELETE",
    pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`,
  });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
  if (result.rows.length === 0) return NextResponse.json({ error: "That saved reply no longer exists." }, { status: 404 });

  if (mediaPath) await deleteWhatsAppSavedReplyMedia(mediaPath);
  return NextResponse.json({ ok: true });
}
