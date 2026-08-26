import test from "node:test";
import assert from "node:assert/strict";
import {
  WHATSAPP_KNOWN_STATUSES,
  describeWhatsAppMessageStatus,
  getWhatsAppStatusRank,
  getWhatsAppStatusesBelow,
  sanitizeWhatsAppStatusError,
  shouldApplyWhatsAppStatus,
} from "./messageStatus";

test("the delivery ladder ranks in Meta's own order", () => {
  assert.ok(getWhatsAppStatusRank("sent") < getWhatsAppStatusRank("delivered"));
  assert.ok(getWhatsAppStatusRank("delivered") < getWhatsAppStatusRank("read"));
  assert.equal(getWhatsAppStatusRank(null), 0);
  assert.equal(getWhatsAppStatusRank(""), 0);
});

test("our own interim states rank below anything Meta reports", () => {
  for (const interim of ["accepted", "queued", "sending"]) {
    assert.ok(getWhatsAppStatusRank(interim) < getWhatsAppStatusRank("sent"));
    assert.ok(getWhatsAppStatusRank(interim) > getWhatsAppStatusRank(null));
  }
});

test("failed outranks every delivery state, so a late receipt cannot un-fail a message", () => {
  for (const status of ["sent", "delivered", "read", "accepted"]) {
    assert.ok(getWhatsAppStatusRank("failed") > getWhatsAppStatusRank(status));
    assert.equal(shouldApplyWhatsAppStatus("failed", status), false);
  }
});

test("an out-of-order webhook cannot walk a status backwards", () => {
  assert.equal(shouldApplyWhatsAppStatus("delivered", "sent"), false);
  assert.equal(shouldApplyWhatsAppStatus("read", "delivered"), false);
  assert.equal(shouldApplyWhatsAppStatus("read", "read"), false);
  assert.equal(shouldApplyWhatsAppStatus("sent", "delivered"), true);
  assert.equal(shouldApplyWhatsAppStatus(null, "sent"), true);
  assert.equal(shouldApplyWhatsAppStatus("accepted", "sent"), true);
});

test("status comparison ignores case and surrounding whitespace", () => {
  assert.equal(shouldApplyWhatsAppStatus("delivered", " READ "), true);
  assert.equal(shouldApplyWhatsAppStatus(" DELIVERED ", "sent"), false);
});

test("an unrecognised status is recorded but never overwrites a delivery state", () => {
  assert.equal(shouldApplyWhatsAppStatus(null, "warp_speed"), true);
  assert.equal(shouldApplyWhatsAppStatus("sent", "warp_speed"), false);
});

test("the overwritable set for a move is exactly the ranks below it", () => {
  assert.deepEqual(getWhatsAppStatusesBelow("sent"), ["accepted", "queued", "sending"]);
  assert.deepEqual(getWhatsAppStatusesBelow("delivered"), ["accepted", "queued", "sending", "sent"]);
  assert.deepEqual(getWhatsAppStatusesBelow("read"), [
    "accepted",
    "queued",
    "sending",
    "sent",
    "delivered",
  ]);
  // A failure may overwrite anything except an existing failure.
  assert.deepEqual(getWhatsAppStatusesBelow("failed"), [
    "accepted",
    "queued",
    "sending",
    "sent",
    "delivered",
    "read",
  ]);
});

test("the overwritable set never contains the target itself", () => {
  for (const status of WHATSAPP_KNOWN_STATUSES) {
    assert.equal(getWhatsAppStatusesBelow(status).includes(status), false);
  }
});

test("each state gets a distinct glyph, so the difference is not only colour", () => {
  const icons = new Set(
    ["sent", "delivered", "read", "failed", "accepted"].map(
      (status) => describeWhatsAppMessageStatus({ status, direction: "outbound" })?.icon,
    ),
  );

  assert.equal(icons.size, 5);
});

test("every presentation carries a full sentence for a tooltip and screen reader", () => {
  for (const status of WHATSAPP_KNOWN_STATUSES) {
    const presentation = describeWhatsAppMessageStatus({ status, direction: "outbound" });
    assert.ok(presentation);
    assert.ok(presentation.description.length > 10);
    assert.ok(presentation.label.length > 0);
  }
});

test("an unconfirmed outbound message reads as sending, not as sent", () => {
  assert.equal(describeWhatsAppMessageStatus({ direction: "outbound" })?.key, "pending");
  assert.equal(
    describeWhatsAppMessageStatus({ status: null, direction: "outbound" })?.key,
    "pending",
  );
  assert.equal(
    describeWhatsAppMessageStatus({ status: "accepted", direction: "outbound" })?.key,
    "pending",
  );
});

test("stored statuses map to their own presentation", () => {
  assert.equal(describeWhatsAppMessageStatus({ status: "SENT", direction: "outbound" })?.key, "sent");
  assert.equal(
    describeWhatsAppMessageStatus({ status: "delivered", direction: "outbound" })?.key,
    "delivered",
  );
  assert.equal(describeWhatsAppMessageStatus({ status: "read", direction: "outbound" })?.key, "read");
  assert.equal(
    describeWhatsAppMessageStatus({ status: "failed", direction: "outbound" })?.key,
    "failed",
  );
});

test("inbound messages never get a delivery receipt", () => {
  assert.equal(describeWhatsAppMessageStatus({ status: "read", direction: "inbound" }), null);
  assert.equal(describeWhatsAppMessageStatus({ direction: "inbound" }), null);
});

test("known failure codes become plain English", () => {
  const reason = sanitizeWhatsAppStatusError({ code: 131047 });
  assert.ok(reason?.includes("24-hour"));
  assert.ok(reason?.includes("131047"));
});

test("an unknown code records the code alone rather than the provider payload", () => {
  assert.equal(
    sanitizeWhatsAppStatusError({ code: 999999, title: "internal trace 0xdeadbeef" }),
    "WhatsApp rejected the message (code 999999).",
  );
});

test("no sanitized reason ever leaks a trace id or a token", () => {
  const reason = sanitizeWhatsAppStatusError({
    code: 131026,
    title: "fbtrace_id=AbCdEf access_token=EAAG-secret",
  });

  assert.ok(reason);
  assert.equal(reason.includes("fbtrace_id"), false);
  assert.equal(reason.includes("access_token"), false);
});

test("a title is kept only when there is no code, and is clipped", () => {
  assert.equal(sanitizeWhatsAppStatusError({ title: "Message undeliverable" }), "Message undeliverable");
  assert.equal(sanitizeWhatsAppStatusError({ title: "x".repeat(400) })?.length, 120);
  assert.equal(sanitizeWhatsAppStatusError({}), undefined);
  assert.equal(sanitizeWhatsAppStatusError({ title: "   " }), undefined);
});
