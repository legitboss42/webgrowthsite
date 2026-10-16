import { NextResponse } from "next/server";
import { processWhatsAppAutomationQueue, secureAutomationSecretEqual } from "@/lib/whatsapp/automationRuntime";
import { closeInactiveWhatsAppConversations } from "@/lib/whatsapp/conversationLifecycle";
import { getCachedActiveWhatsAppWorkspaceIds, getCachedWhatsAppProcessorSecret } from "@/lib/whatsapp/processorConfig";
import { runWithWhatsAppWorkspace } from "@/lib/whatsapp/workspaceContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supplied = request.headers.get("x-webgrowth-automation-secret")?.trim() || "";
  const expected = await getCachedWhatsAppProcessorSecret();
  if (!secureAutomationSecretEqual(supplied, expected)) return NextResponse.json({ error: "Invalid automation processor secret." }, { status: 401 });

  const workspaces = await getCachedActiveWhatsAppWorkspaceIds();
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

  return NextResponse.json({ ok: true, ...total });
}
