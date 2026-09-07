import test from "node:test";
import assert from "node:assert/strict";

import { createMetaClient } from "./metaClient";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("resolves a linked Instagram professional account from connected_instagram_account", async () => {
  const client = createMetaClient({
    graphVersion: "v99.0",
    fetcher: async () =>
      jsonResponse({
        data: [
          {
            id: "page-1",
            name: "Web Growth",
            access_token: "page-token",
            tasks: ["CREATE_CONTENT", "MANAGE"],
            connected_instagram_account: {
              id: "ig-1",
              username: "web.growth",
              name: "Web Growth",
            },
          },
        ],
      }),
  });

  const connection = await client.resolveManagedPage({ userAccessToken: "user-token" });
  assert.equal(connection.facebookPageId, "page-1");
  assert.equal(connection.instagramAccountId, "ig-1");
  assert.equal(connection.instagramAccountName, "web.growth");
});

test("falls back to the Page instagram_accounts edge when inline Instagram fields are absent", async () => {
  const calls: string[] = [];
  const client = createMetaClient({
    graphVersion: "v99.0",
    fetcher: async (url) => {
      const value = String(url);
      calls.push(value);
      if (value.includes("/me/accounts")) {
        return jsonResponse({
          data: [
            {
              id: "page-1",
              name: "Web Growth",
              access_token: "page-token",
              tasks: ["CREATE_CONTENT", "MANAGE"],
            },
          ],
        });
      }
      if (value.includes("/page-1/instagram_accounts")) {
        return jsonResponse({
          data: [{ id: "ig-1", username: "web.growth", name: "Web Growth" }],
        });
      }
      return jsonResponse({ error: { message: "unexpected request" } }, 500);
    },
  });

  const connection = await client.resolveManagedPage({ userAccessToken: "user-token" });
  assert.equal(connection.facebookPageId, "page-1");
  assert.equal(connection.instagramAccountId, "ig-1");
  assert.equal(connection.instagramAccountName, "web.growth");
  assert.equal(calls.length, 2);
  assert.match(calls[1], /\/page-1\/instagram_accounts/);
});
