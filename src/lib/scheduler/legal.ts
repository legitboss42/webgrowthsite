import type { SchedulerLaunchState } from "./launch";
import { CURRENT_SCHEDULER_PRIVACY_VERSION, CURRENT_SCHEDULER_TERMS_VERSION } from "./legalVersions";

export { CURRENT_SCHEDULER_PRIVACY_VERSION, CURRENT_SCHEDULER_TERMS_VERSION } from "./legalVersions";

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

export function shouldPersistSchedulerConnection(user: SchedulerAccountState): boolean {
  return isActiveSchedulerUser(user);
}

function configuredSandboxOpenIds() {
  return (process.env.SCHEDULER_SANDBOX_TIKTOK_OPEN_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function canStartSchedulerOAuth(
  launch: Pick<SchedulerLaunchState, "publicEnrollment">,
  openId: string | null,
  account: SchedulerAccountState | null,
): boolean {
  if (!openId) return launch.publicEnrollment;
  if (!account || !isActiveSchedulerUser(account)) return false;
  return launch.publicEnrollment || configuredSandboxOpenIds().includes(openId);
}
