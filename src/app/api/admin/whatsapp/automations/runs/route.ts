import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

function cleanId(value: unknown) {
  return typeof value === "string" && /^[0-9a-f-]{20,80}$/i.test(value.trim()) ? value.trim() : "";
}

async function access() {
  const current = await getWhatsAppWorkspaceAccess(await cookies());
  return current && canWhatsAppRoleSuperviseTeam(current.role) ? current : null;
}

export async function GET(request: Request) {
  if (!(await access())) return NextResponse.json({ error: "Owner or Manager access is required." }, { status: 403 });
  const id = cleanId(new URL(request.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "A valid run id is required." }, { status: 400 });
  const [runs, events, jobs] = await Promise.all([
    readWhatsAppRows<Record<string, unknown>>(`whatsapp_automation_runs?id=eq.${encodeURIComponent(id)}&select=*&limit=1`),
    readWhatsAppRows<Record<string, unknown>>(`whatsapp_automation_events?run_id=eq.${encodeURIComponent(id)}&select=id,event_type,action_index,status,detail,error_message,created_at&order=created_at.asc&limit=300`),
    readWhatsAppRows<Record<string, unknown>>(`whatsapp_automation_jobs?run_id=eq.${encodeURIComponent(id)}&select=id,status,due_at,action_index,attempts,max_attempts,last_error,created_at,updated_at&order=created_at.asc&limit=100`),
  ]);
  if (!runs?.[0]) return NextResponse.json({ error: "Run not found." }, { status: 404 });
  return NextResponse.json({ ok: true, run: runs[0], events: events || [], jobs: jobs || [] });
}

export async function POST(request: Request) {
  const current = await access();
  if (!current) return NextResponse.json({ error: "Owner or Manager access is required." }, { status: 403 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
  const id = cleanId(body.id);
  if (!id) return NextResponse.json({ error: "A valid run id is required." }, { status: 400 });
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_automation_runs?id=eq.${encodeURIComponent(id)}&select=id,automation_id,status&limit=1`);
  const run = rows?.[0];
  if (!run) return NextResponse.json({ error: "Run not found." }, { status: 404 });
  const status = typeof run.status === "string" ? run.status : "";
  if (!new Set(["QUEUED", "RUNNING", "WAITING"]).has(status)) {
    return NextResponse.json({ error: "Only queued, running, or waiting runs can be cancelled." }, { status: 409 });
  }
  const now = new Date().toISOString();
  const updated = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_automation_runs?id=eq.${encodeURIComponent(id)}`,
    body: { status: "CANCELLED", completed_at: now, error_code: null, error_message: null, updated_at: now },
  });
  if (!updated.ok) return NextResponse.json({ error: updated.message }, { status: updated.status });
  await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_automation_jobs?run_id=eq.${encodeURIComponent(id)}&status=in.(PENDING,PROCESSING,WAITING_INPUT)`,
    body: { status: "CANCELLED", completed_at: now, updated_at: now },
  });
  await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_automation_events",
    body: {
      run_id: id,
      automation_id: run.automation_id,
      event_type: "run_cancelled",
      status: "INFO",
      detail: { cancelledByMemberId: current.memberId, cancelledByEmail: current.email },
    },
  });
  return NextResponse.json({ ok: true });
}
