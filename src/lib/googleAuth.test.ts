import assert from "node:assert/strict";
import test from "node:test";
import {
  createGoogleAuthSessionValue,
  getDefaultAdminGoogleEmail,
  getGoogleAuthCookieName,
  isAllowedGoogleAdminEmail,
  readGoogleAuthSession,
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
