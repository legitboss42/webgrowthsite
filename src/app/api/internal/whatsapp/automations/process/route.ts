import { NextResponse } from "next/server";
import { mutateWhatsAppRest } from "@/app/admin/whatsapp/data";
import { getWhatsAppAutomationProcessorSecret, processWhatsAppAutomationQueue, secureAutomationSecretEqual } from "@/lib/whatsapp/automationRuntime";
import { closeInactiveWhatsAppConversations } from "@/lib/whatsapp/conversationLifecycle";
import { whatsappServerCache } from "@/lib/whatsapp/serverCache";
import { getActiveWhatsAppWorkspaceIds } from "@/lib/whatsapp/workspaces";
import { runWithWhatsAppWorkspace } from "@/lib/whatsapp/workspaceContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supplied = request.headers.get("x-webgrowth-automation-secret")?.trim() || "";
  const expected = await whatsappServerCache.get("runtime:whatsapp-processor-secret", 300_000, getWhatsAppAutomationProcessorSecret);
  if (!secureAutomationSecretEqual(supplied, expected)) return NextResponse.json({ error: "Invalid automation processor secret." }, { status: 401 });

  const workspaces = await getActiveWhatsAppWorkspaceIds();
  const total = { jobsProcessed: 0, jobsFailed: 0, timedRunsStarted: 0, businessHoursRunsStarted: 0, conversations: 0, workspacesProcessed: 0 };

  for (const workspaceId of workspaces) {
    const result = await runWithWhatsAppWorkspace(workspaceId, async () => {
      const queue = await processWhatsAppAutomationQueue(25);
      const conversations = await closeInactiveWhatsAppConversations();
      return { queue, conversations };
    });
    total.jobsProcessed += result.queue.jobsProcessed;
    total.jobsFailed += result.queue.jobsFailed;
    total.timedRunsStarted += result.queue.timedRunsStarted;
    total.businessHoursRunsStarted += result.queue.businessHoursRunsStarted;
    total.conversations += typeof result.conversations === "number" ? result.conversations : Number((result.conversations as { closed?: unknown })?.closed || 0);
    total.workspacesProcessed += 1;
  }

  const workCount = total.jobsProcessed + total.jobsFailed + total.timedRunsStarted + total.businessHoursRunsStarted + total.conversations;
  const backoff = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "rpc/record_whatsapp_worker_result",
    body: { p_worker_name: "automation", p_work_count: workCount },
    unscoped: true,
  });
  if (!backoff.ok) console.error("Unable to record WhatsApp automation worker backoff", { status: backoff.status });

  return NextResponse.json({ ok: true, ...total, workCount });
}
