import { NextResponse } from "next/server";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { getWhatsAppCampaignProcessorSecret, processWhatsAppCampaignQueue, secureCampaignSecretEqual } from "@/lib/whatsapp/campaignRuntime";
import { runWithWhatsAppWorkspace } from "@/lib/whatsapp/workspaceContext";
import { isWhatsAppWorkspaceId } from "@/lib/whatsapp/workspaceModel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supplied = request.headers.get("x-webgrowth-automation-secret")?.trim() || "";
  const expected = await getWhatsAppCampaignProcessorSecret();
  if (!secureCampaignSecretEqual(supplied, expected)) return NextResponse.json({ error: "Invalid campaign processor secret." }, { status: 401 });

  const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_workspaces?status=eq.ACTIVE&select=id&order=created_at.asc", { unscoped: true }) || [];
  const workspaces = rows.map((row) => String(row.id || "")).filter(isWhatsAppWorkspaceId);
  const aggregate: Record<string, number> = { workspacesProcessed: 0 };
  for (const workspaceId of workspaces) {
    const result = await runWithWhatsAppWorkspace(workspaceId, () => processWhatsAppCampaignQueue(25));
    for (const [key, value] of Object.entries(result)) if (typeof value === "number") aggregate[key] = (aggregate[key] || 0) + value;
    aggregate.workspacesProcessed += 1;
  }
  return NextResponse.json({ ok: true, ...aggregate });
}
