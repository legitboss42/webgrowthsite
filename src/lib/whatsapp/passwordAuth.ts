import { createClient } from "@supabase/supabase-js";
import { absoluteUrl } from "@/lib/site";
import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";
import { normalizeWhatsAppTeamEmail } from "./teamModel";

const WORKSPACE_PASSWORD_COOKIE = "wg_workspace_auth";
const WORKSPACE_PASSWORD_TTL_SECONDS = 12 * 60 * 60;
const PASSWORD_SETUP_PATH = "/whatsapp/set-password/";

export type WorkspacePasswordSession = {
  version: 1;
  provider: "password";
  userId: string;
  email: string;
  fullName: string | null;
  issuedAt: number;
  expiresAt: number;
};

function getSessionSecret() {
  return (
    process.env.GOOGLE_AUTH_SESSION_SECRET?.trim() ||
    process.env.INTERNAL_TOOL_SESSION_SECRET?.trim() ||
    ""
  );
}

function getSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
}

export function getWorkspacePasswordCookieName() {
  return WORKSPACE_PASSWORD_COOKIE;
}

export function getWorkspacePasswordTtlSeconds() {
  return WORKSPACE_PASSWORD_TTL_SECONDS;
}

export function getWorkspacePasswordPublicConfig() {
  return {
    url: getSupabaseUrl(),
    anonKey: getSupabaseAnonKey(),
  };
}

export function isWorkspacePasswordAuthConfigured() {
  return Boolean(getSessionSecret() && getSupabaseUrl() && getSupabaseAnonKey());
}

export function createWorkspacePasswordSessionValue(
  input: { userId: string; email: string; fullName?: string | null },
  issuedAt = Date.now(),
  ttlSeconds = WORKSPACE_PASSWORD_TTL_SECONDS,
) {
  const email = normalizeWhatsAppTeamEmail(input.email);
  if (!email) throw new Error("Workspace email is missing.");

  return sealCookiePayload(
    {
      version: 1,
      provider: "password",
      userId: input.userId.trim(),
      email,
      fullName: input.fullName?.trim() || null,
      issuedAt,
      expiresAt: issuedAt + ttlSeconds * 1000,
    } satisfies WorkspacePasswordSession,
    getSessionSecret(),
  );
}

export function readWorkspacePasswordSession(value: string | undefined, now = Date.now()) {
  const payload = openCookiePayload<WorkspacePasswordSession>(value, getSessionSecret());
  if (!payload || payload.version !== 1 || payload.provider !== "password") return null;
  if (!payload.userId?.trim() || !payload.email?.trim() || now >= payload.expiresAt) return null;
  return payload;
}

export function readWorkspacePasswordSessionFromCookieStore(cookieStore: {
  get(name: string): { value?: string } | undefined;
}) {
  return readWorkspacePasswordSession(cookieStore.get(WORKSPACE_PASSWORD_COOKIE)?.value);
}

export function createWorkspaceSupabaseClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function createWorkspaceSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function signInWorkspaceWithPassword(email: string, password: string) {
  const client = createWorkspaceSupabaseClient();
  if (!client) return { ok: false as const, reason: "not_configured" as const };

  const normalizedEmail = normalizeWhatsAppTeamEmail(email);
  if (!normalizedEmail || !password) return { ok: false as const, reason: "invalid_credentials" as const };

  const { data, error } = await client.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  const userEmail = normalizeWhatsAppTeamEmail(data.user?.email);
  if (error || !data.user?.id || !userEmail) {
    return { ok: false as const, reason: "invalid_credentials" as const };
  }

  return {
    ok: true as const,
    user: {
      id: data.user.id,
      email: userEmail,
      fullName:
        typeof data.user.user_metadata?.full_name === "string"
          ? data.user.user_metadata.full_name.trim() || null
          : null,
    },
  };
}

async function generatePasswordActionLink(email: string, preferredType: "invite" | "recovery") {
  const admin = createWorkspaceSupabaseAdminClient();
  const normalizedEmail = normalizeWhatsAppTeamEmail(email);
  if (!admin || !normalizedEmail) return null;

  const redirectTo = absoluteUrl(PASSWORD_SETUP_PATH);
  const attempts: Array<"invite" | "recovery"> =
    preferredType === "invite" ? ["invite", "recovery"] : ["recovery", "invite"];

  for (const type of attempts) {
    const { data, error } = await admin.auth.admin.generateLink({
      type,
      email: normalizedEmail,
      options: { redirectTo },
    });
    if (!error && data.properties?.action_link) return data.properties.action_link;
  }

  return null;
}

export function generateWorkspacePasswordSetupLink(email: string) {
  return generatePasswordActionLink(email, "invite");
}

export function generateWorkspacePasswordResetLink(email: string) {
  return generatePasswordActionLink(email, "recovery");
}
