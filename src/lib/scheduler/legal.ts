import type { SchedulerLaunchState } from "./launch";

export const CURRENT_SCHEDULER_TERMS_VERSION = "2026-08-23";
export const CURRENT_SCHEDULER_PRIVACY_VERSION = "2026-08-23";

type LegalAcceptanceUser = {
  termsVersion: string | null;
  privacyVersion: string | null;
};

export type SchedulerAccountState = {
  status: string | null;
  suspendedAt: string | null;
  deletionRequestedAt: string | null;
};

export function hasCurrentLegalAcceptance(user: LegalAcceptanceUser): boolean {
  return user.termsVersion === CURRENT_SCHEDULER_TERMS_VERSION
    && user.privacyVersion === CURRENT_SCHEDULER_PRIVACY_VERSION;
}

export function isActiveSchedulerUser(user: SchedulerAccountState): boolean {
  return user.status === "ACTIVE" && !user.suspendedAt && !user.deletionRequestedAt;
}

function configuredSandboxOpenIds() {
  return (process.env.SCHEDULER_SANDBOX_TIKTOK_OPEN_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function canStartSchedulerOAuth(launch: Pick<SchedulerLaunchState, "publicEnrollment">, openId: string | null): boolean {
  return launch.publicEnrollment || (!!openId && configuredSandboxOpenIds().includes(openId));
}
