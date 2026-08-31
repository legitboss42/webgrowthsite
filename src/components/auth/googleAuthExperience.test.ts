import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const signInButtonPath = new URL("./GoogleSignInButton.tsx", import.meta.url);
const adminPromptPath = new URL("./GoogleAdminPrompt.tsx", import.meta.url);
const waitlistGatePath = new URL("./GoogleWaitlistGate.tsx", import.meta.url);

test("Google sign-in button posts the Google credential to the website session endpoint", () => {
  const source = readFileSync(signInButtonPath, "utf8");

  assert.match(source, /\/api\/auth\/google\/session\//);
  assert.match(source, /google\.accounts\.id/);
  assert.doesNotMatch(source, /\/api\/auth\/google\/start\//);
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
