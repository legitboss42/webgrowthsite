import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { resolveWhatsAppMetaConfig } from "@/lib/whatsapp/workspaceCredentials";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";
import { verifyWhatsAppBusinessPhone } from "@/lib/whatsapp/whatsappReadOnlyVerifier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const headers = { "Cache-Control": "no-store, max-age=0" };
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ ok: false, status: "ADMIN_AUTH_REQUIRED" }, { status: 401, headers });
  }
  // Workspace membership by itself is not sufficient for platform-wide verification.
  if (!access.platformAdmin || access.workspaceSlug !== "web-growth" ||
      access.workspaceStatus !== "ACTIVE") {
    return NextResponse.json({ ok: false, status: "WORKSPACE_AUTH_REQUIRED" }, { status: 403, headers });
  }
  try {
    const config = await resolveWhatsAppMetaConfig({ workspaceId: access.workspaceId });
    if (!config || config.workspaceId !== access.workspaceId) {
      return NextResponse.json(
        { ok: false, status: "WHATSAPP_CREDENTIAL_NOT_CONFIGURED" },
        { status: 409, headers },
      );
    }
    const phone = await verifyWhatsAppBusinessPhone({
      apiVersion: config.apiVersion,
      phoneNumberId: config.phoneNumberId,
      token: config.token,
    });
    const response = {
      ok: phone.ok,
      status: phone.ok ? "WHATSAPP_GRAPH_READ_VERIFIED" : "WHATSAPP_GRAPH_READ_NOT_VERIFIED",
      checkedAt: new Date().toISOString(),
      workspace: "web-growth",
      phone,
    };
    try {
      await createSocialAutomationStore().audit({
        eventType: "WHATSAPP_READONLY_GRAPH_CHECK",
        actor: "ADMIN",
        metadata: response,
      });
    } catch {
      console.warn("[whatsapp-readonly-verify] Sanitized audit write unavailable");
    }
    return NextResponse.json(response, { headers });
  } catch {
    return NextResponse.json(
      { ok: false, status: "WHATSAPP_VERIFICATION_UNAVAILABLE" },
      { status: 503, headers },
    );
  }
}
