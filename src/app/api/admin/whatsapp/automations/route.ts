import { randomUUID } from "node:crypto";
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
  type WhatsAppAutomationInput,
  type WhatsAppAutomationStatus,
} from "@/lib/whatsapp/automationModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

const TABLE = "whatsapp_automations";
const SELECT = "id,name,description,status,trigger_type,trigger_config,condition_join,conditions,actions,version,created_by_member_id,updated_by_member_id,activated_at,paused_at,created_at,updated_at";
const DUPLICATE_NAME = "An automation with that name already exists.";
const MIGRATION_MESSAGE = "Stage 6 Automation Engine storage has not been applied in Supabase yet.";

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
    {
      error: duplicate ? DUPLICATE_NAME : result.message,
      ...(result.code ? { code: result.code } : {}),
    },
    { status: duplicate ? 409 : result.status },
  );
}

function sameDefinition(existing: WhatsAppAutomation, next: WhatsAppAutomationInput) {
  const current = {
    name: existing.name,
    description: existing.description,
    triggerType: existing.triggerType,
    triggerConfig: existing.triggerConfig,
    conditionJoin: existing.conditionJoin,
    conditions: existing.conditions,
    actions: existing.actions,
  };
  const candidate = {
    name: next.name,
    description: next.description,
    triggerType: next.triggerType,
    triggerConfig: next.triggerConfig,
    conditionJoin: next.conditionJoin,
    conditions: next.conditions,
    actions: next.actions,
  };
  return JSON.stringify(current) === JSON.stringify(candidate);
}

function automationBody(value: WhatsAppAutomationInput, existing?: WhatsAppAutomation) {
  return {
    name: value.name,
    description: value.description,
    status: value.status,
    trigger_type: value.triggerType,
    trigger_config: value.triggerConfig,
    condition_join: value.conditionJoin,
    conditions: value.conditions,
    actions: value.actions,
    ...statusTimestamps(value.status, existing),
  };
}

async function verifyPersistedAutomation(id: string) {
  const verified = await getAutomation(id);
  return verified.ready ? verified.automation : null;
}

export async function POST(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  if (!(await isReady())) return NextResponse.json({ error: MIGRATION_MESSAGE }, { status: 503 });

  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  const checked = validateWhatsAppAutomationInput(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  const id = randomUUID();
  const baseBody = {
    id,
    ...automationBody(checked.value),
    version: 1,
  };
  const actorBody = guarded.access.memberId
    ? {
        ...baseBody,
        created_by_member_id: guarded.access.memberId,
        updated_by_member_id: guarded.access.memberId,
      }
    : baseBody;

  let result = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: TABLE,
    body: actorBody,
  });

  if (!result.ok) {
    const alreadyPersisted = await verifyPersistedAutomation(id);
    if (alreadyPersisted) {
      return NextResponse.json({ ok: true, automation: alreadyPersisted, recovered: true }, { status: 201 });
    }

    if (result.code !== POSTGRES_UNIQUE_VIOLATION && guarded.access.memberId) {
      result = await mutateWhatsAppRest({
        method: "POST",
        pathAndQuery: TABLE,
        body: baseBody,
      });
    }
  }

  if (!result.ok) {
    const alreadyPersisted = await verifyPersistedAutomation(id);
    if (alreadyPersisted) {
      return NextResponse.json({ ok: true, automation: alreadyPersisted, recovered: true }, { status: 201 });
    }
    return mutationError(result);
  }

  const persisted = result.rows[0]
    ? normalizeWhatsAppAutomationRow(result.rows[0])
    : await verifyPersistedAutomation(id);

  if (!persisted) {
    return NextResponse.json(
      { error: "Supabase accepted the workflow write but the saved row could not be verified." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, automation: persisted }, { status: 201 });
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

  if (existing.automation.status === "ACTIVE") {
    if (checked.value.status !== "PAUSED") {
      return NextResponse.json({ error: "Published workflows cannot be edited. Pause this workflow before making changes." }, { status: 409 });
    }
    if (!sameDefinition(existing.automation, checked.value)) {
      return NextResponse.json({ error: "Pause the workflow first, then edit its definition." }, { status: 409 });
    }
  }

  const baseBody = {
    ...automationBody(checked.value, existing.automation),
    version: existing.automation.version + 1,
    updated_at: new Date().toISOString(),
  };
  const actorBody = guarded.access.memberId
    ? { ...baseBody, updated_by_member_id: guarded.access.memberId }
    : baseBody;

  let result = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`,
    body: actorBody,
  });

  if (!result.ok && result.code !== POSTGRES_UNIQUE_VIOLATION && guarded.access.memberId) {
    result = await mutateWhatsAppRest({
      method: "PATCH",
      pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`,
      body: baseBody,
    });
  }

  if (!result.ok) return mutationError(result);

  const persisted = result.rows[0]
    ? normalizeWhatsAppAutomationRow(result.rows[0])
    : await verifyPersistedAutomation(id);

  if (!persisted) {
    return NextResponse.json({ error: "That automation no longer exists." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, automation: persisted });
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
  const waiting = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_automation_runs?automation_id=eq.${encodeURIComponent(id)}&status=eq.WAITING&select=id&limit=1`,
  );
  if (waiting?.length) {
    return NextResponse.json({ error: "Cancel the waiting workflow run before deleting this automation." }, { status: 409 });
  }

  const result = await mutateWhatsAppRest({
    method: "DELETE",
    pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`,
  });
  if (!result.ok) return mutationError(result);
  if (result.rows.length === 0) {
    const afterDelete = await getAutomation(id);
    if (afterDelete.ready && afterDelete.automation) {
      return NextResponse.json({ error: "The automation could not be deleted." }, { status: 502 });
    }
  }
  return NextResponse.json({ ok: true });
}
