import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";

const SESSION_TTL_SECONDS = 12 * 60 * 60;
export const WEB_GROWTH_SESSION_COOKIE = "wg_webgrowth_session";

export type WebGrowthIdentityProvider = "google" | "password" | "tiktok";
export type WebGrowthWorkspaceRole = "owner" | "manager" | "agent";

export type WebGrowthSession = {
  version: 1;
  provider: WebGrowthIdentityProvider;
  userId: string;
  email: string | null;
  fullName: string | null;
  workspaceId: string | null;
  workspaceRole: WebGrowthWorkspaceRole | null;
  schedulerUserId: string | null;
  tiktokOpenId: string | null;
  issuedAt: number;
  expiresAt: number;
};

export type CreateWebGrowthSessionInput = {
  provider: WebGrowthIdentityProvider;
  userId: string;
  email?: string | null;
  fullName?: string | null;
  workspaceId?: string | null;
  workspaceRole?: WebGrowthWorkspaceRole | null;
  schedulerUserId?: string | null;
  tiktokOpenId?: string | null;
};

type CookieStoreLike = { get(name: string): { value?: string } | undefined };

type SchedulerIdentity = { userId: string; openId: string } | null | undefined;

function secret() {
  const value =
    process.env.WEB_GROWTH_SESSION_SECRET?.trim() ||
    process.env.GOOGLE_AUTH_SESSION_SECRET?.trim() ||
    process.env.INTERNAL_TOOL_SESSION_SECRET?.trim() ||
    process.env.SCHEDULER_SESSION_SECRET?.trim() ||
    "";
  if (!value) throw new Error("Web Growth session secret is missing.");
  return value;
}

function text(value: string | null | undefined) {
  return value?.trim() || null;
}

function email(value: string | null | undefined) {
  return text(value)?.toLowerCase() || null;
}

function validProvider(value: unknown): value is WebGrowthIdentityProvider {
  return value === "google" || value === "password" || value === "tiktok";
}

function validRole(value: unknown): value is WebGrowthWorkspaceRole | null {
  return value == null || value === "owner" || value === "manager" || value === "agent";
}

function validSchedulerPair(session: Pick<WebGrowthSession, "schedulerUserId" | "tiktokOpenId">) {
  return Boolean(session.schedulerUserId) === Boolean(session.tiktokOpenId);
}

function schedulerFields(scheduler: SchedulerIdentity) {
  return {
    schedulerUserId: scheduler?.userId?.trim() || null,
    tiktokOpenId: scheduler?.openId?.trim() || null,
  };
}

export function getWebGrowthSessionTtlSeconds() {
  return SESSION_TTL_SECONDS;
}

export function createWebGrowthSessionValue(
  input: CreateWebGrowthSessionInput,
  issuedAt = Date.now(),
  ttlSeconds = SESSION_TTL_SECONDS,
) {
  const userId = input.userId.trim();
  if (!userId) throw new Error("Web Growth session user id is missing.");
  if (!validProvider(input.provider)) throw new Error("Web Growth session provider is invalid.");
  if (!validRole(input.workspaceRole)) throw new Error("Web Growth workspace role is invalid.");

  const session: WebGrowthSession = {
    version: 1,
    provider: input.provider,
    userId,
    email: email(input.email),
    fullName: text(input.fullName),
    workspaceId: text(input.workspaceId),
    workspaceRole: input.workspaceRole ?? null,
    schedulerUserId: text(input.schedulerUserId),
    tiktokOpenId: text(input.tiktokOpenId),
    issuedAt,
    expiresAt: issuedAt + Math.max(1, ttlSeconds) * 1000,
  };

  if (!validSchedulerPair(session)) throw new Error("Web Growth scheduler identity is incomplete.");
  if ((session.provider === "google" || session.provider === "password") && !session.email) {
    throw new Error("Web Growth account email is missing.");
  }
  if (session.provider === "tiktok" && !session.schedulerUserId) {
    throw new Error("TikTok session requires scheduler identity.");
  }

  return sealCookiePayload(session, secret());
}

export function createWebGrowthGoogleSessionValue(
  identity: { userId: string; email: string; fullName?: string | null },
  scheduler?: SchedulerIdentity,
  workspace?: { workspaceId?: string | null; workspaceRole?: WebGrowthWorkspaceRole | null },
) {
  return createWebGrowthSessionValue({
    provider: "google",
    userId: identity.userId,
    email: identity.email,
    fullName: identity.fullName,
    workspaceId: workspace?.workspaceId,
    workspaceRole: workspace?.workspaceRole,
    ...schedulerFields(scheduler),
  });
}

export function createWebGrowthPasswordSessionValue(
  identity: {
    userId: string;
    email: string;
    fullName?: string | null;
    workspaceId?: string | null;
    workspaceRole?: WebGrowthWorkspaceRole | null;
  },
  scheduler?: SchedulerIdentity,
) {
  return createWebGrowthSessionValue({
    provider: "password",
    ...identity,
    ...schedulerFields(scheduler),
  });
}

export function createWebGrowthTikTokSessionValue(userId: string, openId: string) {
  return createWebGrowthSessionValue({
    provider: "tiktok",
    userId,
    ...schedulerFields({ userId, openId }),
  });
}

export function createWebGrowthSessionValueFromSession(session: WebGrowthSession) {
  return createWebGrowthSessionValue({
    provider: session.provider,
    userId: session.userId,
    email: session.email,
    fullName: session.fullName,
    workspaceId: session.workspaceId,
    workspaceRole: session.workspaceRole,
    schedulerUserId: session.schedulerUserId,
    tiktokOpenId: session.tiktokOpenId,
  });
}

export function readWebGrowthSession(value: string | undefined, now = Date.now()) {
  let payload: WebGrowthSession | null = null;
  try {
    payload = openCookiePayload<WebGrowthSession>(value, secret());
  } catch {
    return null;
  }
  if (!payload || payload.version !== 1 || !validProvider(payload.provider)) return null;
  if (!payload.userId?.trim() || now >= payload.expiresAt || payload.issuedAt > payload.expiresAt) return null;
  if (!validRole(payload.workspaceRole) || !validSchedulerPair(payload)) return null;
  if ((payload.provider === "google" || payload.provider === "password") && !payload.email?.trim()) return null;
  if (payload.provider === "tiktok" && (!payload.schedulerUserId?.trim() || !payload.tiktokOpenId?.trim())) return null;
  return {
    ...payload,
    userId: payload.userId.trim(),
    email: email(payload.email),
    fullName: text(payload.fullName),
    workspaceId: text(payload.workspaceId),
    workspaceRole: payload.workspaceRole ?? null,
    schedulerUserId: text(payload.schedulerUserId),
    tiktokOpenId: text(payload.tiktokOpenId),
  } satisfies WebGrowthSession;
}

export function readWebGrowthSessionFromCookieStore(cookieStore: CookieStoreLike, now = Date.now()) {
  return readWebGrowthSession(cookieStore.get(WEB_GROWTH_SESSION_COOKIE)?.value, now);
}

export function mergeWebGrowthSchedulerIdentity(
  session: WebGrowthSession,
  scheduler: { userId: string; openId: string },
): WebGrowthSession {
  const schedulerUserId = scheduler.userId.trim();
  const tiktokOpenId = scheduler.openId.trim();
  if (!schedulerUserId || !tiktokOpenId) throw new Error("Web Growth scheduler identity is incomplete.");
  return { ...session, schedulerUserId, tiktokOpenId };
}
