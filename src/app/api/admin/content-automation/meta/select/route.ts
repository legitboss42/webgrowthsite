import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasContentAutomationAdminAccess } from "@/app/admin/content-automation/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { encryptMetaTokens } from "@/lib/socialAutomation/crypto";
import { createMetaClient, type MetaManagedPage } from "@/lib/socialAutomation/metaClient";
import {
  META_PENDING_CONNECTION_COOKIE,
  META_PUBLISH_SCOPES,
  readMetaPendingConnection,
} from "@/lib/socialAutomation/metaOAuth";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";

export const runtime = "nodejs";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function clearPendingCookie(response: NextResponse) {
  response.cookies.set(META_PENDING_CONNECTION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/content-automation/meta/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function saveConnection(input: {
  page: MetaManagedPage;
  userAccessToken: string;
  expiresAt: string | null;
}) {
  const connectedAt = new Date().toISOString();
  const encryptedTokens = encryptMetaTokens({
    userAccessToken: input.userAccessToken,
    pageAccessToken: input.page.pageAccessToken,
    connectedAt,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
  });
  const store = createSocialAutomationStore();
  await store.saveMetaConnection({
    encryptedTokens,
    facebookPageId: input.page.facebookPageId,
    facebookPageName: input.page.facebookPageName,
    instagramAccountId: input.page.instagramAccountId,
    instagramAccountName: input.page.instagramAccountName,
    scopes: [...META_PUBLISH_SCOPES],
    accessExpiresAt: input.expiresAt,
  });
  await store.audit({
    eventType: "META_CONNECTED",
    actor: "ADMIN",
    metadata: {
      facebookPageId: input.page.facebookPageId,
      instagramAccountId: input.page.instagramAccountId,
      source: "DASHBOARD_SELECTION",
    },
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!(await hasContentAutomationAdminAccess(cookieStore))) {
    return NextResponse.json({ ok: false, code: "ADMIN_AUTH_REQUIRED" }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ ok: false, code: "INVALID_ORIGIN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const facebookPageId =
    body &&
    typeof body === "object" &&
    typeof (body as { facebookPageId?: unknown }).facebookPageId === "string"
      ? (body as { facebookPageId: string }).facebookPageId.trim()
      : "";
  if (!facebookPageId || facebookPageId.length > 128) {
    return NextResponse.json({ ok: false, code: "META_PAGE_REQUIRED" }, { status: 400 });
  }

  try {
    const pendingSecret = required("META_TOKEN_ENCRYPTION_KEY");
    const pending = readMetaPendingConnection(
      cookieStore.get(META_PENDING_CONNECTION_COOKIE)?.value,
      pendingSecret
    );
    if (!pending) {
      return clearPendingCookie(
        NextResponse.json(
          { ok: false, code: "META_SELECTION_EXPIRED" },
          { status: 410 }
        )
      );
    }

    const graphVersion = required("META_GRAPH_VERSION");
    const client = createMetaClient({ graphVersion });
    const candidates = await client.listManagedPages({
      userAccessToken: pending.userAccessToken,
    });
    const selected = candidates.find(
      (page) => page.facebookPageId === facebookPageId
    );
    if (!selected) {
      return NextResponse.json(
        { ok: false, code: "META_PAGE_UNAVAILABLE" },
        { status: 422, headers: { "Cache-Control": "no-store" } }
      );
    }

    await saveConnection({
      page: selected,
      userAccessToken: pending.userAccessToken,
      expiresAt: pending.expiresAt,
    });

    return clearPendingCookie(
      NextResponse.json({ ok: true, status: "connected" })
    );
  } catch (error) {
    console.error("[social-automation] Meta dashboard Page selection failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return NextResponse.json(
      { ok: false, code: "META_SELECTION_FAILED" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
