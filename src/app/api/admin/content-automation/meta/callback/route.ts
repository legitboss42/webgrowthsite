import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasContentAutomationAdminAccess } from "@/app/admin/content-automation/auth";
import { encryptMetaTokens } from "@/lib/socialAutomation/crypto";
import { createMetaClient } from "@/lib/socialAutomation/metaClient";
import {
  META_OAUTH_STATE_COOKIE,
  META_PUBLISH_SCOPES,
  readMetaOAuthState,
} from "@/lib/socialAutomation/metaOAuth";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";

export const runtime = "nodejs";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function resultRedirect(request: Request, returnTo: string, value: string) {
  const url = new URL(returnTo, request.url);
  url.searchParams.set("meta", value);
  return NextResponse.redirect(url);
}

function clearStateCookie(response: NextResponse) {
  response.cookies.set(META_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/content-automation/meta/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  if (!(await hasContentAutomationAdminAccess(cookieStore))) {
    return NextResponse.json({ ok: false, code: "ADMIN_AUTH_REQUIRED" }, { status: 401 });
  }

  const requestUrl = new URL(request.url);
  const stateSecret = process.env.META_OAUTH_STATE_SECRET?.trim();
  const sealedState = cookieStore.get(META_OAUTH_STATE_COOKIE)?.value;
  const oauthState = stateSecret ? readMetaOAuthState(sealedState, stateSecret) : null;
  const returnedState = requestUrl.searchParams.get("state") || "";

  if (!oauthState || !returnedState || returnedState !== oauthState.state) {
    return clearStateCookie(resultRedirect(request, "/admin/content-automation/", "invalid-state"));
  }

  if (requestUrl.searchParams.get("error")) {
    return clearStateCookie(resultRedirect(request, oauthState.returnTo, "cancelled"));
  }

  const code = requestUrl.searchParams.get("code") || "";
  if (!code) {
    return clearStateCookie(resultRedirect(request, oauthState.returnTo, "missing-code"));
  }

  try {
    const appId = required("META_APP_ID");
    const appSecret = required("META_APP_SECRET");
    const graphVersion = required("META_GRAPH_VERSION");
    const redirectUri =
      process.env.META_REDIRECT_URI?.trim() ||
      new URL("/api/admin/content-automation/meta/callback/", request.url).toString();
    const preferredPageId = process.env.META_PAGE_ID?.trim() || undefined;
    const client = createMetaClient({ graphVersion });

    const shortLived = await client.exchangeCode({
      appId,
      appSecret,
      code,
      redirectUri,
    });
    const longLived = await client.exchangeLongLivedUserToken({
      appId,
      appSecret,
      shortLivedUserAccessToken: shortLived.userAccessToken,
    });
    const page = await client.resolveManagedPage({
      userAccessToken: longLived.userAccessToken,
      preferredPageId,
    });

    const connectedAt = new Date().toISOString();
    const encryptedTokens = encryptMetaTokens({
      userAccessToken: longLived.userAccessToken,
      pageAccessToken: page.pageAccessToken,
      connectedAt,
      expiresAt: longLived.expiresAt,
    });
    const store = createSocialAutomationStore();
    await store.saveMetaConnection({
      encryptedTokens,
      facebookPageId: page.facebookPageId,
      facebookPageName: page.facebookPageName,
      instagramAccountId: page.instagramAccountId,
      instagramAccountName: page.instagramAccountName,
      scopes: [...META_PUBLISH_SCOPES],
      accessExpiresAt: longLived.expiresAt ?? null,
    });
    await store.audit({
      eventType: "META_CONNECTED",
      actor: "ADMIN",
      metadata: {
        facebookPageId: page.facebookPageId,
        instagramAccountId: page.instagramAccountId,
      },
    });

    return clearStateCookie(resultRedirect(request, oauthState.returnTo, "connected"));
  } catch (error) {
    console.error("[social-automation] Meta OAuth callback failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return clearStateCookie(resultRedirect(request, oauthState.returnTo, "error"));
  }
}
