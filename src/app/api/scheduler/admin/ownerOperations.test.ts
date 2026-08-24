import assert from "node:assert/strict";
import test from "node:test";
import { createSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createRestoreUserHandler } from "./restore-user/route";
import { createSuspendUserHandler } from "./suspend-user/route";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ROOT_URL = "https://webgrowth.info/api/scheduler/admin";

function formRequest(path: string, values: Record<string, string>, origin: string | null = "https://webgrowth.info") {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  return new Request(`${ROOT_URL}/${path}/`, { method: "POST", headers, body: form });
}

function cookieJar(cookieValue: string | undefined) {
  return async () => ({
    get(name: string) {
      return name === SCHEDULER_SESSION_COOKIE && cookieValue ? { value: cookieValue } : undefined;
    },
  });
}

function ownerCookie(openId = "owner-open-id") {
  return createSchedulerSession("owner-user", openId);
}

test("suspend route rejects missing or invalid scheduler sessions through its handler", async () => {
  process.env.SCHEDULER_SESSION_SECRET = "route-test-secret";
  process.env.OWNER_TIKTOK_OPEN_IDS = "owner-open-id";
  for (const cookie of [undefined, "not-a-valid-cookie"]) {
    let mutations = 0;
    const handler = createSuspendUserHandler({
      cookies: cookieJar(cookie),
      suspendUser: async () => { mutations += 1; return true; },
    });
    const response = await handler(formRequest("suspend-user", { userId: USER_ID, reason: "abuse" }));
    assert.equal(response.status, 401);
    assert.equal(mutations, 0);
  }
});

test("suspend route requires an exact owner and a same-origin request", async () => {
  process.env.SCHEDULER_SESSION_SECRET = "route-test-secret";
  process.env.OWNER_TIKTOK_OPEN_IDS = "owner-open-id";
  const nonOwner = createSuspendUserHandler({ cookies: cookieJar(ownerCookie("owner-open")), suspendUser: async () => true });
  assert.equal((await nonOwner(formRequest("suspend-user", { userId: USER_ID, reason: "abuse" }))).status, 403);
  const owner = createSuspendUserHandler({ cookies: cookieJar(ownerCookie()), suspendUser: async () => true });
  assert.equal((await owner(formRequest("suspend-user", { userId: USER_ID, reason: "abuse" }, null))).status, 403);
  assert.equal((await owner(formRequest("suspend-user", { userId: USER_ID, reason: "abuse" }, "https://attacker.example"))).status, 403);
});

test("suspend route rejects malformed input and surfaces a database refusal without mutating twice", async () => {
  process.env.SCHEDULER_SESSION_SECRET = "route-test-secret";
  process.env.OWNER_TIKTOK_OPEN_IDS = "owner-open-id";
  let mutations = 0;
  const handler = createSuspendUserHandler({ cookies: cookieJar(ownerCookie()), suspendUser: async () => { mutations += 1; return false; } });
  assert.equal((await handler(formRequest("suspend-user", { userId: "bad-id", reason: "" }))).status, 400);
  assert.equal(mutations, 0);
  assert.equal((await handler(formRequest("suspend-user", { userId: USER_ID, reason: "abuse" }))).status, 404);
  assert.equal(mutations, 1);
});

test("restore route rejects missing or invalid sessions, non-owners, and foreign origins", async () => {
  process.env.SCHEDULER_SESSION_SECRET = "route-test-secret";
  process.env.OWNER_TIKTOK_OPEN_IDS = "owner-open-id";
  for (const [cookie, expectedStatus] of [[undefined, 401], ["not-a-valid-cookie", 401], [ownerCookie("not-owner"), 403]] as const) {
    const handler = createRestoreUserHandler({ cookies: cookieJar(cookie), restoreUser: async () => true });
    assert.equal((await handler(formRequest("restore-user", { userId: USER_ID }))).status, expectedStatus);
  }
  const owner = createRestoreUserHandler({ cookies: cookieJar(ownerCookie()), restoreUser: async () => true });
  assert.equal((await owner(formRequest("restore-user", { userId: USER_ID }, null))).status, 403);
  assert.equal((await owner(formRequest("restore-user", { userId: USER_ID }, "https://attacker.example"))).status, 403);
});

test("restore route rejects malformed input and returns a safe refusal from its handler", async () => {
  process.env.SCHEDULER_SESSION_SECRET = "route-test-secret";
  process.env.OWNER_TIKTOK_OPEN_IDS = "owner-open-id";
  let mutations = 0;
  const handler = createRestoreUserHandler({ cookies: cookieJar(ownerCookie()), restoreUser: async () => { mutations += 1; return false; } });
  assert.equal((await handler(formRequest("restore-user", { userId: "bad-id" }))).status, 400);
  assert.equal(mutations, 0);
  assert.equal((await handler(formRequest("restore-user", { userId: USER_ID }))).status, 404);
  assert.equal(mutations, 1);
});
