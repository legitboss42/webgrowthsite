import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalContentAutomationAccess,
  canonicalWhatsAppIdentity,
} from "./unifiedAuthorization";
import type { WebGrowthSession } from "./webGrowthSession";

function session(patch: Partial<WebGrowthSession> = {}): WebGrowthSession {
  return {
    version: 1,
    subject: "user-1",
    provider: "google",
    email: "owner@example.com",
    fullName: "Owner",
    schedulerUserId: null,
    tiktokOpenId: null,
    issuedAt: 1,
    expiresAt: 9999999999999,
    ...patch,
  };
}

test("content automation canonical access remains admin-email restricted", () => {
  process.env.GOOGLE_ADMIN_EMAILS = "admin@example.com";
  assert.equal(canonicalContentAutomationAccess(session({ email: "admin@example.com" })), true);
  assert.equal(canonicalContentAutomationAccess(session({ email: "member@example.com" })), false);
});

test("canonical Google and password identities retain their WhatsApp identity source", () => {
  assert.deepEqual(canonicalWhatsAppIdentity(session({ provider: "google", email: "agent@example.com", fullName: "Agent" })), {
    email: "agent@example.com", displayName: "Agent", source: "google", configuredPlatformAdmin: false,
  });
  process.env.GOOGLE_ADMIN_EMAILS = "owner@example.com";
  assert.deepEqual(canonicalWhatsAppIdentity(session({ provider: "password", email: "owner@example.com", fullName: null })), {
    email: "owner@example.com", displayName: "owner@example.com", source: "password", configuredPlatformAdmin: true,
  });
});

test("TikTok-only canonical identity maps to WhatsApp only for the configured scheduler owner", () => {
  process.env.OWNER_TIKTOK_OPEN_IDS = "owner-open-id";
  process.env.GOOGLE_ADMIN_EMAILS = "vickysaintbrown02@gmail.com";
  assert.equal(canonicalWhatsAppIdentity(session({ provider: "tiktok", email: null, tiktokOpenId: "other" })), null);
  assert.deepEqual(canonicalWhatsAppIdentity(session({ provider: "tiktok", email: null, fullName: null, tiktokOpenId: "owner-open-id" })), {
    email: "vickysaintbrown02@gmail.com", displayName: "Web Growth Owner", source: "scheduler", configuredPlatformAdmin: true,
  });
});
