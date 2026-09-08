import { getDefaultAdminGoogleEmail, isAllowedGoogleAdminEmail } from "@/lib/googleAuth";
import { isOwnerOpenId } from "@/lib/scheduler/config";
import type { WebGrowthSession } from "@/lib/webGrowthSession";

export type CanonicalWhatsAppIdentity = {
  email: string;
  displayName: string;
  source: "google" | "password" | "scheduler";
  configuredPlatformAdmin: boolean;
};

export function canonicalContentAutomationAccess(session: WebGrowthSession | null | undefined) {
  return Boolean(session?.email && isAllowedGoogleAdminEmail(session.email));
}

export function canonicalWhatsAppIdentity(session: WebGrowthSession | null | undefined): CanonicalWhatsAppIdentity | null {
  if (!session) return null;
  const email = session.email?.trim().toLowerCase() || "";
  if (email) {
    return {
      email,
      displayName: session.fullName?.trim() || email,
      source: session.provider === "password" ? "password" : "google",
      configuredPlatformAdmin: isAllowedGoogleAdminEmail(email),
    };
  }
  if (session.tiktokOpenId && isOwnerOpenId(session.tiktokOpenId)) {
    return {
      email: getDefaultAdminGoogleEmail(),
      displayName: "Web Growth Owner",
      source: "scheduler",
      configuredPlatformAdmin: true,
    };
  }
  return null;
}
