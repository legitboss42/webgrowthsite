import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasContentAutomationAdminAccess } from "@/app/admin/content-automation/auth";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";
import { verifyMetaPageAndInstagram } from "@/lib/socialAutomation/metaReadOnlyVerifier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Explicit admin-triggered connection verification only.
 * OAuth tokens never leave the Web Growth server, appear in URLs,
 * or enter a browser response, GitHub, logs, or agent prompts.
 *
 * The only write is a non-secret event in our internal audit ledger.
 */
export async function GET() {
  const noStore = { "Cache-Control": "no-store, max-age=0" };
  const cookieStore = await cookies();
  if (!(await hasContentAutomationAdminAccess(cookieStore))) {
    return NextResponse.json(
      { ok: false, status: "ADMIN_AUTH_REQUIRED" },
      { status: 401, headers: noStore }
    );
  }

  const store = createSocialAutomationStore();
  try {
    const connection = await store.getMetaConnectionWithTokens();
    if (!connection) {
      return NextResponse.json(
        { ok: false, status: "META_CONNECTION_NOT_AVAILABLE" },
        { status: 409, headers: noStore }
      );
    }

    if (connection.summary.reconnectRequired) {
      return NextResponse.json(
        { ok: false, status: "META_RECONNECT_REQUIRED" },
        { status: 409, headers: noStore }
      );
    }

    const result = await verifyMetaPageAndInstagram({
      graphVersion: process.env.META_GRAPH_VERSION || "",
      pageId: connection.summary.facebookPageId || "",
      instagramId: connection.summary.instagramAccountId || "",
      pageAccessToken: connection.tokens.pageAccessToken || "",
    });

    const configuredAppId = process.env.META_APP_ID?.trim() || "";
    const appIdentifier =
      configuredAppId === "1084580837629536"
        ? "mr_web_social"
        : configuredAppId === "1402137781802305"
          ? "web_growth_messaging"
          : configuredAppId
            ? "other_meta_app"
            : "unconfigured";

    const checkedAt = new Date().toISOString();
    const response = {
      ok: result.facebook.ok && result.instagram.ok,
      status: result.facebook.ok && result.instagram.ok
        ? "GRAPH_READ_VERIFIED"
        : "GRAPH_READ_NOT_VERIFIED",
      checkedAt,
      appIdentifier,
      facebook: result.facebook,
      instagram: result.instagram,
    };

    // This is internal operational metadata only. No Meta IDs, token values,
    // Graph response content or personal information are persisted.
    try {
      await store.audit({
        eventType: "META_READONLY_GRAPH_CHECK",
        actor: "ADMIN",
        metadata: response,
      });
    } catch {
      // The diagnostic is still useful when the audit table is unavailable.
      console.warn("[meta-readonly-verify] Audit write unavailable.");
    }

    return NextResponse.json(response, { headers: noStore });
  } catch {
    // Errors may originate from credential access; never serialize them.
    return NextResponse.json(
      { ok: false, status: "META_VERIFICATION_UNAVAILABLE" },
      { status: 503, headers: noStore }
    );
  }
}
