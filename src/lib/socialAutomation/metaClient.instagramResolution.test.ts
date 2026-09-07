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
