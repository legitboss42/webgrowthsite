import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGoogleAuthStartPath,
  buildGoogleAuthorizationUrl,
  createGoogleAuthSessionValue,
  createGoogleOAuthStateValue,
  getDefaultAdminGoogleEmail,
  getGoogleAuthCookieName,
  getGoogleOAuthStateCookieName,
  isGoogleAuthConfigured,
  isAllowedGoogleAdminEmail,
  readGoogleAuthSession,
  readGoogleOAuthState,
  sanitizeGoogleAuthNext,
} from "./googleAuth";

test("default admin Google email matches the requested owner account", () => {
  assert.equal(getDefaultAdminGoogleEmail(), "vickysaintbrown02@gmail.com");
});

test("allowed admin emails are matched case-insensitively", () => {
  const original = process.env.GOOGLE_ADMIN_EMAILS;

  process.env.GOOGLE_ADMIN_EMAILS = "Vickysaintbrown02@gmail.com, owner@example.com";

  assert.equal(isAllowedGoogleAdminEmail("vickysaintbrown02@gmail.com"), true);
  assert.equal(isAllowedGoogleAdminEmail("OWNER@example.com"), true);
  assert.equal(isAllowedGoogleAdminEmail("someone@example.com"), false);

  process.env.GOOGLE_ADMIN_EMAILS = original;
});

test("Google auth sessions seal and open a verified Google identity", () => {
  const original = process.env.GOOGLE_AUTH_SESSION_SECRET;

  process.env.GOOGLE_AUTH_SESSION_SECRET = "google-auth-test-secret";

  const value = createGoogleAuthSessionValue({
    userId: "user-1",
    email: "person@example.com",
    fullName: "Person Example",
  });
  const opened = readGoogleAuthSession(value);

  assert.equal(opened?.userId, "user-1");
  assert.equal(opened?.email, "person@example.com");
  assert.equal(opened?.fullName, "Person Example");
  assert.equal(opened?.provider, "google");

  process.env.GOOGLE_AUTH_SESSION_SECRET = original;
});

test("Google auth sessions fail closed when the secret changes", () => {
  const original = process.env.GOOGLE_AUTH_SESSION_SECRET;

  process.env.GOOGLE_AUTH_SESSION_SECRET = "first-secret";
  const value = createGoogleAuthSessionValue({
    userId: "user-1",
    email: "person@example.com",
    fullName: "Person Example",
  });
  process.env.GOOGLE_AUTH_SESSION_SECRET = "rotated-secret";

  assert.equal(readGoogleAuthSession(value), null);

  process.env.GOOGLE_AUTH_SESSION_SECRET = original;
});

test("sanitizeGoogleAuthNext keeps only safe relative paths", () => {
  assert.equal(sanitizeGoogleAuthNext("/admin/waitlist/"), "/admin/waitlist/");
  assert.equal(sanitizeGoogleAuthNext("/automation/?joined=true"), "/automation/?joined=true");
  assert.equal(sanitizeGoogleAuthNext("https://evil.example.com"), "/");
  assert.equal(sanitizeGoogleAuthNext("//evil.example.com"), "/");
  assert.equal(sanitizeGoogleAuthNext("admin/waitlist"), "/");
});

test("cookie name stays stable for route guards", () => {
  assert.equal(getGoogleAuthCookieName(), "wg_google_auth");
});

test("Google OAuth state seals the return path and hint for the website-owned flow", () => {
  const original = process.env.GOOGLE_AUTH_SESSION_SECRET;

  process.env.GOOGLE_AUTH_SESSION_SECRET = "google-oauth-state-secret";

  const value = createGoogleOAuthStateValue({
    state: "state-123",
    next: "/admin/whatsapp/",
    loginHint: "vickysaintbrown02@gmail.com",
  });
  const opened = readGoogleOAuthState(value);

  assert.deepEqual(opened, {
    version: 1,
    state: "state-123",
    next: "/admin/whatsapp/",
    loginHint: "vickysaintbrown02@gmail.com",
    issuedAt: opened?.issuedAt,
    expiresAt: opened?.expiresAt,
  });
  assert.equal(typeof opened?.issuedAt, "number");
  assert.equal(typeof opened?.expiresAt, "number");

  process.env.GOOGLE_AUTH_SESSION_SECRET = original;
});

test("Google OAuth state fails closed when the secret changes", () => {
  const original = process.env.GOOGLE_AUTH_SESSION_SECRET;

  process.env.GOOGLE_AUTH_SESSION_SECRET = "first-state-secret";
  const value = createGoogleOAuthStateValue({
    state: "state-123",
    next: "/automation/#waitlist",
  });
  process.env.GOOGLE_AUTH_SESSION_SECRET = "rotated-state-secret";

  assert.equal(readGoogleOAuthState(value), null);

  process.env.GOOGLE_AUTH_SESSION_SECRET = original;
});

test("Google auth start path stays on this site and keeps only safe next paths", () => {
  assert.equal(
    buildGoogleAuthStartPath("/admin/whatsapp/", "vickysaintbrown02@gmail.com"),
    "/api/auth/google/start/?next=%2Fadmin%2Fwhatsapp%2F&login_hint=vickysaintbrown02%40gmail.com",
  );
  assert.equal(
    buildGoogleAuthStartPath("https://evil.example.com"),
    "/api/auth/google/start/?next=%2F",
  );
});

test("Google authorization URL points back to the website callback and requests basic identity scopes", () => {
  const originalClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const originalClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const originalSessionSecret = process.env.GOOGLE_AUTH_SESSION_SECRET;

  process.env.GOOGLE_OAUTH_CLIENT_ID = "client-id.apps.googleusercontent.com";
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "client-secret";
  process.env.GOOGLE_AUTH_SESSION_SECRET = "session-secret";

  const url = new URL(
    buildGoogleAuthorizationUrl({
      state: "state-123",
      next: "/admin/waitlist/",
      loginHint: "vickysaintbrown02@gmail.com",
    }),
  );

  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.pathname, "/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("client_id"), "client-id.apps.googleusercontent.com");
  assert.equal(url.searchParams.get("redirect_uri"), "https://webgrowth.info/api/auth/google/callback/");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("scope"), "openid email profile");
  assert.equal(url.searchParams.get("state"), "state-123");
  assert.equal(url.searchParams.get("login_hint"), "vickysaintbrown02@gmail.com");
  assert.equal(url.searchParams.get("prompt"), "select_account");

  process.env.GOOGLE_OAUTH_CLIENT_ID = originalClientId;
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = originalClientSecret;
  process.env.GOOGLE_AUTH_SESSION_SECRET = originalSessionSecret;
});

test("Google auth configuration requires the website OAuth client credentials", () => {
  const originalClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const originalClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const originalSessionSecret = process.env.GOOGLE_AUTH_SESSION_SECRET;

  process.env.GOOGLE_OAUTH_CLIENT_ID = "";
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "";
  process.env.GOOGLE_AUTH_SESSION_SECRET = "session-secret";
  assert.equal(isGoogleAuthConfigured(), false);

  process.env.GOOGLE_OAUTH_CLIENT_ID = "client-id.apps.googleusercontent.com";
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "client-secret";
  assert.equal(isGoogleAuthConfigured(), true);

  process.env.GOOGLE_OAUTH_CLIENT_ID = originalClientId;
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = originalClientSecret;
  process.env.GOOGLE_AUTH_SESSION_SECRET = originalSessionSecret;
});

test("Google OAuth state cookie name stays stable for callback verification", () => {
  assert.equal(getGoogleOAuthStateCookieName(), "wg_google_oauth_state");
});
