import assert from "node:assert/strict";
import test from "node:test";
import {
  canWhatsAppRoleManageTeam,
  canWhatsAppRoleSuperviseTeam,
  canWhatsAppRoleViewAllConversations,
  getWhatsAppPresenceLabel,
  isValidWhatsAppTeamEmail,
  isWhatsAppTeamMemberAssignable,
  normalizeWhatsAppTeamAvailability,
  normalizeWhatsAppTeamEmail,
  normalizeWhatsAppTeamMember,
  normalizeWhatsAppTeamRole,
} from "./teamModel";

test("normalizes team emails and validates Google-account style addresses", () => {
  assert.equal(normalizeWhatsAppTeamEmail("  Agent@Example.COM "), "agent@example.com");
  assert.equal(isValidWhatsAppTeamEmail("agent@example.com"), true);
  assert.equal(isValidWhatsAppTeamEmail("not-an-email"), false);
});

test("accepts only supported roles and availability states", () => {
  assert.equal(normalizeWhatsAppTeamRole("owner"), "owner");
  assert.equal(normalizeWhatsAppTeamRole("manager"), "manager");
  assert.equal(normalizeWhatsAppTeamRole("agent"), "agent");
  assert.equal(normalizeWhatsAppTeamRole("superadmin"), null);

  assert.equal(normalizeWhatsAppTeamAvailability("available"), "available");
  assert.equal(normalizeWhatsAppTeamAvailability("busy"), "busy");
  assert.equal(normalizeWhatsAppTeamAvailability("offline"), "offline");
  assert.equal(normalizeWhatsAppTeamAvailability("away"), null);
});

test("normalizes persisted team rows safely", () => {
  const member = normalizeWhatsAppTeamMember({
    id: "member-1",
    google_email: " USER@EXAMPLE.COM ",
    display_name: "  User One ",
    role: "manager",
    availability: "busy",
    active: true,
  });

  assert.deepEqual(member, {
    id: "member-1",
    workspaceId: null,
    userId: null,
    googleEmail: "user@example.com",
    displayName: "User One",
    role: "manager",
    availability: "busy",
    active: true,
    googleUserId: null,
    lastSeenAt: null,
    createdAt: null,
    updatedAt: null,
  });
});

test("team permissions separate ownership, supervision, and agent inbox scope", () => {
  assert.equal(canWhatsAppRoleManageTeam("owner"), true);
  assert.equal(canWhatsAppRoleManageTeam("manager"), false);
  assert.equal(canWhatsAppRoleManageTeam("agent"), false);

  assert.equal(canWhatsAppRoleSuperviseTeam("owner"), true);
  assert.equal(canWhatsAppRoleSuperviseTeam("manager"), true);
  assert.equal(canWhatsAppRoleSuperviseTeam("agent"), false);

  assert.equal(canWhatsAppRoleViewAllConversations("owner"), true);
  assert.equal(canWhatsAppRoleViewAllConversations("manager"), true);
  assert.equal(canWhatsAppRoleViewAllConversations("agent"), false);
});

test("presence labels expose human states while assignment only accepts active online members", () => {
  assert.equal(getWhatsAppPresenceLabel("available"), "Online");
  assert.equal(getWhatsAppPresenceLabel("busy"), "Away");
  assert.equal(getWhatsAppPresenceLabel("offline"), "Offline");

  assert.equal(isWhatsAppTeamMemberAssignable({ active: true, availability: "available" }), true);
  assert.equal(isWhatsAppTeamMemberAssignable({ active: true, availability: "busy" }), false);
  assert.equal(isWhatsAppTeamMemberAssignable({ active: true, availability: "offline" }), false);
  assert.equal(isWhatsAppTeamMemberAssignable({ active: false, availability: "available" }), false);
});
