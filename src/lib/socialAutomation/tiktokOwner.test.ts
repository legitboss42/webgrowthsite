import test from "node:test";
import assert from "node:assert/strict";

import { parseOwnerOpenIds, selectOwnerSchedulerUser } from "./tiktokOwner";

test("owner open ids are trimmed, deduplicated, and empty values removed", () => {
  assert.deepEqual(parseOwnerOpenIds(" open-1, open-2,open-1, ,"), ["open-1", "open-2"]);
});

test("selectOwnerSchedulerUser requires exactly one active configured owner", () => {
  const owners = ["open-1", "open-2"];
  assert.deepEqual(
    selectOwnerSchedulerUser(
      [
        { id: "user-1", tiktok_open_id: "open-1", status: "ACTIVE" },
        { id: "user-2", tiktok_open_id: "someone-else", status: "ACTIVE" },
      ],
      owners
    ),
    { id: "user-1", tiktok_open_id: "open-1", status: "ACTIVE" }
  );
  assert.equal(
    selectOwnerSchedulerUser(
      [
        { id: "user-1", tiktok_open_id: "open-1", status: "ACTIVE" },
        { id: "user-2", tiktok_open_id: "open-2", status: "ACTIVE" },
      ],
      owners
    ),
    null
  );
});
