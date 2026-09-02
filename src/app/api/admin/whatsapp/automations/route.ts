import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import {
  POSTGRES_UNIQUE_VIOLATION,
  mutateWhatsAppRest,
  readWhatsAppRows,
} from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  normalizeWhatsAppAutomationRow,
  validateWhatsAppAutomationInput,
  type WhatsAppAutomation,
  type WhatsAppAutomationStatus,
} from "@/lib/whatsapp/automationModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

const TABLE = "whatsapp_automations";
const SELECT = "id,name,description,status,trigger_type,trigger_config,condition_join,conditions,actions,version,created_by_member_id,updated_by_member_id,activated_at,paused_at,created_at,updated_at";
const DUPLICATE_NAME = "An automation with that name already exists.";
const MIGRATION_MESSAGE = "Stage 6A automations are waiting for the additive Supabase migration.";

async function guard(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  if (!canWhatsAppRoleSuperviseTeam(access.role)) {
    return { response: NextResponse.json({ error: "Owner or Manager access is required to manage automations." }, { status: 403 }) } as const;
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) } as const;
  }
  return { access } as const;
}

async function readBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function isReady() {
  return (await readWhatsAppRows<Record<string, unknown>>(`${TABLE}?select=id&limit=1`)) !== null;
}

async function getAutomation(id: string): Promise<{ ready: boolean; automation: WhatsAppAutomation | null }> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `${TABLE}?id=eq.${encodeURIComponent(id)}&select=${SELECT}&limit=1`,
  );
  if (rows === null) return { ready: false, automation: null };
  return { ready: true, automation: rows[0] ? normalizeWhatsAppAutomationRow(rows[0]) : null };
}

function statusTimestamps(status: WhatsAppAutomationStatus, existing?: WhatsAppAutomation) {
  const now = new Date().toISOString();
  return {
    activated_at: status === "ACTIVE" ? existing?.activatedAt || now : existing?.activatedAt || null,
    paused_at: status === "PAUSED" ? now : status === "ACTIVE" ? null : existing?.pausedAt || null,
  };
}

function mutationError(result: { ok: false; status: number; code?: string; message: string }) {
  const duplicate = result.code === POSTGRES_UNIQUE_VIOLATION;
  return NextResponse.json(
    { error: duplicate ? DUPLICATE_NAME : result.message },
    { status: duplicate ? 409 : result.status },
  );
}

export async function POST(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  if (!(await isReady())) return NextResponse.json({ error: MIGRATION_MESSAGE }, { status: 503 });

  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  const checked = validateWhatsAppAutomationInput(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  const timestamps = statusTimestamps(checked.value.status);
  const result = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: TABLE,
    body: {
      name: checked.value.name,
      description: checked.value.description,
      status: checked.value.status,
      trigger_type: checked.value.triggerType,
      trigger_config: checked.value.triggerConfig,
      condition_join: checked.value.conditionJoin,
      conditions: checked.value.conditions,
      actions: checked.value.actions,
      version: 1,
      created_by_member_id: guarded.access.memberId,
      updated_by_member_id: guarded.access.memberId,
      ...timestamps,
    },
  });
  if (!result.ok) return mutationError(result);
  return NextResponse.json({ ok: true, automation: result.rows[0] ? normalizeWhatsAppAutomationRow(result.rows[0]) : null });
}

export async function PATCH(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  const id = readId(body.id);
  if (!id) return NextResponse.json({ error: "Automation ID is required." }, { status: 400 });

  const existing = await getAutomation(id);
  if (!existing.ready) return NextResponse.json({ error: MIGRATION_MESSAGE }, { status: 503 });
  if (!existing.automation) return NextResponse.json({ error: "That automation no longer exists." }, { status: 404 });

  const checked = validateWhatsAppAutomationInput(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const timestamps = statusTimestamps(checked.value.status, existing.automation);
  const result = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`,
    body: {
      name: checked.value.name,
      description: checked.value.description,
      status: checked.value.status,
      trigger_type: checked.value.triggerType,
      trigger_config: checked.value.triggerConfig,
      condition_join: checked.value.conditionJoin,
      conditions: checked.value.conditions,
      actions: checked.value.actions,
      version: existing.automation.version + 1,
      updated_by_member_id: guarded.access.memberId,
      updated_at: new Date().toISOString(),
      ...timestamps,
    },
  });
  if (!result.ok) return mutationError(result);
  if (result.rows.length === 0) return NextResponse.json({ error: "That automation no longer exists." }, { status: 404 });
  return NextResponse.json({ ok: true, automation: normalizeWhatsAppAutomationRow(result.rows[0]) });
}

export async function DELETE(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  const body = await readBody(request);
  const id = readId(body?.id);
  if (!id) return NextResponse.json({ error: "Automation ID is required." }, { status: 400 });

  const existing = await getAutomation(id);
  if (!existing.ready) return NextResponse.json({ error: MIGRATION_MESSAGE }, { status: 503 });
  if (!existing.automation) return NextResponse.json({ error: "That automation no longer exists." }, { status: 404 });
  if (existing.automation.status === "ACTIVE") {
    return NextResponse.json({ error: "Pause this automation before deleting it." }, { status: 409 });
  }

  const result = await mutateWhatsAppRest({
    method: "DELETE",
    pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`,
  });
  if (!result.ok) return mutationError(result);
  if (result.rows.length === 0) return NextResponse.json({ error: "That automation no longer exists." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
