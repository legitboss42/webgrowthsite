import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasContentAutomationAdminAccess } from "@/app/admin/content-automation/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { encryptMetaTokens } from "@/lib/socialAutomation/crypto";
import { createMetaClient, type MetaManagedPage } from "@/lib/socialAutomation/metaClient";
import {
  createMetaPendingConnection,
  META_PENDING_CONNECTION_COOKIE,
  META_PENDING_CONNECTION_MAX_AGE_SECONDS,
  META_PUBLISH_SCOPES,
} from "@/lib/socialAutomation/metaOAuth";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";

export const runtime = "nodejs";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function candidate(page: MetaManagedPage) {
  return {
    facebookPageId: page.facebookPageId,
    facebookPageName: page.facebookPageName,
    instagramAccountId: page.instagramAccountId,
    instagramAccountName: page.instagramAccountName,
  };
}

function setPendingCookie(response: NextResponse, value: string) {
  response.cookies.set(META_PENDING_CONNECTION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/content-automation/meta/",
    maxAge: META_PENDING_CONNECTION_MAX_AGE_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
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
  expiresAt?: string;
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
    accessExpiresAt: input.expiresAt ?? null,
  });
  await store.audit({
    eventType: "META_CONNECTED",
    actor: "ADMIN",
    metadata: {
      facebookPageId: input.page.facebookPageId,
      instagramAccountId: input.page.instagramAccountId,
      source: "DASHBOARD_SDK",
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
  const code =
    body && typeof body === "object" && typeof (body as { code?: unknown }).code === "string"
      ? (body as { code: string }).code.trim()
      : "";
  if (!code || code.length > 4096) {
    return NextResponse.json({ ok: false, code: "META_CODE_REQUIRED" }, { status: 400 });
  }

  try {
    const appId = required("META_APP_ID");
    const appSecret = required("META_APP_SECRET");
    const graphVersion = required("META_GRAPH_VERSION");
    const pendingSecret = required("META_TOKEN_ENCRYPTION_KEY");
    const client = createMetaClient({ graphVersion });

    const shortLived = await client.exchangeCode({ appId, appSecret, code });
    const longLived = await client.exchangeLongLivedUserToken({
      appId,
      appSecret,
      shortLivedUserAccessToken: shortLived.userAccessToken,
    });
    const candidates = await client.listManagedPages({
      userAccessToken: longLived.userAccessToken,
    });

    if (candidates.length === 0) {
      return clearPendingCookie(
        NextResponse.json(
          { ok: false, code: "META_NO_ELIGIBLE_PAGE" },
          { status: 422 }
        )
      );
    }

    if (candidates.length === 1) {
      await saveConnection({
        page: candidates[0],
        userAccessToken: longLived.userAccessToken,
        expiresAt: longLived.expiresAt,
      });
      return clearPendingCookie(
        NextResponse.json({ ok: true, status: "connected" })
      );
    }

    const pending = createMetaPendingConnection(
      pendingSecret,
      {
        userAccessToken: longLived.userAccessToken,
        expiresAt: longLived.expiresAt ?? null,
      }
    );
    return setPendingCookie(
      NextResponse.json({
        ok: true,
        status: "selection-required",
        candidates: candidates.map(candidate),
      }),
      pending.cookieValue
    );
  } catch (error) {
    console.error("[social-automation] Meta dashboard code exchange failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return NextResponse.json(
      { ok: false, code: "META_EXCHANGE_FAILED" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
