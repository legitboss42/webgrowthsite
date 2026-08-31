import assert from "node:assert/strict";
import test from "node:test";
import {
  createGoogleAuthSessionValue,
  getDefaultAdminGoogleEmail,
  getGoogleAuthCookieName,
  getGoogleClientId,
  isGoogleAuthConfigured,
  isAllowedGoogleAdminEmail,
  readGoogleAuthSession,
  sanitizeGoogleAuthNext,
  verifyGoogleIdToken,
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

test("Google auth configuration requires only the Google client id and session secret", () => {
  const originalClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const originalSessionSecret = process.env.GOOGLE_AUTH_SESSION_SECRET;

  process.env.GOOGLE_OAUTH_CLIENT_ID = "";
  process.env.GOOGLE_AUTH_SESSION_SECRET = "session-secret";
  assert.equal(isGoogleAuthConfigured(), false);

  process.env.GOOGLE_OAUTH_CLIENT_ID = "client-id.apps.googleusercontent.com";
  assert.equal(isGoogleAuthConfigured(), true);

  process.env.GOOGLE_OAUTH_CLIENT_ID = originalClientId;
  process.env.GOOGLE_AUTH_SESSION_SECRET = originalSessionSecret;
});

test("Google client id is read from environment", () => {
  const originalClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;

  process.env.GOOGLE_OAUTH_CLIENT_ID = "713484310009-example.apps.googleusercontent.com";

  assert.equal(getGoogleClientId(), "713484310009-example.apps.googleusercontent.com");

  process.env.GOOGLE_OAUTH_CLIENT_ID = originalClientId;
});

test("verifyGoogleIdToken accepts a verified Google identity token for the configured client", async () => {
  const originalClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;

  process.env.GOOGLE_OAUTH_CLIENT_ID = "client-id.apps.googleusercontent.com";

  const identity = await verifyGoogleIdToken("credential-token", {
    fetch: (async (input) => {
      assert.equal(String(input), "https://oauth2.googleapis.com/tokeninfo?id_token=credential-token");
      return new Response(
        JSON.stringify({
          sub: "google-user-1",
          email: "vickysaintbrown02@gmail.com",
          email_verified: "true",
          aud: "client-id.apps.googleusercontent.com",
          name: "Victor Chinukwue",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }) as typeof globalThis.fetch,
  });

  assert.deepEqual(identity, {
    userId: "google-user-1",
    email: "vickysaintbrown02@gmail.com",
    fullName: "Victor Chinukwue",
  });

  process.env.GOOGLE_OAUTH_CLIENT_ID = originalClientId;
});

test("verifyGoogleIdToken rejects tokens minted for a different client", async () => {
  const originalClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;

  process.env.GOOGLE_OAUTH_CLIENT_ID = "client-id.apps.googleusercontent.com";

  await assert.rejects(
    () =>
      verifyGoogleIdToken("credential-token", {
        fetch: (async () =>
          new Response(
            JSON.stringify({
              sub: "google-user-1",
              email: "vickysaintbrown02@gmail.com",
              email_verified: "true",
              aud: "different-client.apps.googleusercontent.com",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          )) as typeof globalThis.fetch,
      }),
    /Google did not return a verified email address\./,
  );

  process.env.GOOGLE_OAUTH_CLIENT_ID = originalClientId;
});
