import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const signInButtonPath = new URL("./GoogleSignInButton.tsx", import.meta.url);
const adminPromptPath = new URL("./GoogleAdminPrompt.tsx", import.meta.url);
const waitlistGatePath = new URL("./GoogleWaitlistGate.tsx", import.meta.url);

test("Google sign-in button pins the browser client to PKCE code flow", () => {
  const source = readFileSync(signInButtonPath, "utf8");

  assert.match(source, /flowType:\s*"pkce"/);
  assert.match(source, /detectSessionInUrl:\s*false/);
});

test("admin gate copy presents Google as the primary path instead of a passphrase fallback", () => {
  const source = readFileSync(adminPromptPath, "utf8");

  assert.doesNotMatch(source, /passphrase still works as a fallback/i);
  assert.doesNotMatch(source, /while the setup is being finished/i);
});

test("waitlist gate copy describes a real Google-backed waitlist flow", () => {
  const source = readFileSync(waitlistGatePath, "utf8");

  assert.match(source, /real email account/i);
  assert.match(source, /Continue with Google/);
});
