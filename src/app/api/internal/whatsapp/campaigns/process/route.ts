import { NextResponse } from "next/server";
import { processWhatsAppCampaignQueue, secureCampaignSecretEqual } from "@/lib/whatsapp/campaignRuntime";
import { getCachedActiveWhatsAppWorkspaceIds, getCachedWhatsAppProcessorSecret } from "@/lib/whatsapp/processorConfig";
import { runWithWhatsAppWorkspace } from "@/lib/whatsapp/workspaceContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supplied = request.headers.get("x-webgrowth-automation-secret")?.trim() || "";
  const expected = await getCachedWhatsAppProcessorSecret();
  if (!secureCampaignSecretEqual(supplied, expected)) return NextResponse.json({ error: "Invalid campaign processor secret." }, { status: 401 });

  const workspaces = await getCachedActiveWhatsAppWorkspaceIds();
  const aggregate: Record<string, number> = { workspacesProcessed: 0 };
  for (const workspaceId of workspaces) {
    const result = await runWithWhatsAppWorkspace(workspaceId, () => processWhatsAppCampaignQueue(25));
    for (const [key, value] of Object.entries(result)) if (typeof value === "number") aggregate[key] = (aggregate[key] || 0) + value;
    aggregate.workspacesProcessed += 1;
  }
  return NextResponse.json({ ok: true, ...aggregate });
}
