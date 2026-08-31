import {
  normalizeWhatsAppTeamEmail,
  normalizeWhatsAppTeamMember,
  type WhatsAppTeamMember,
} from "./teamModel";

type SupabaseConfig = {
  url: string;
  key: string;
};

function getConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function headers(config: SupabaseConfig, extra: Record<string, string> = {}) {
  return {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    ...extra,
  };
}

export async function findWhatsAppTeamMemberByEmail(
  email: string | null | undefined,
  options: { activeOnly?: boolean } = {},
): Promise<WhatsAppTeamMember | null> {
  const config = getConfig();
  const normalizedEmail = normalizeWhatsAppTeamEmail(email);
  if (!config || !normalizedEmail) return null;

  const query = new URLSearchParams({
    select:
      "id,google_email,display_name,role,availability,active,google_user_id,last_seen_at,created_at,updated_at",
    google_email: `eq.${normalizedEmail}`,
    limit: "1",
  });
  if (options.activeOnly !== false) query.set("active", "eq.true");

  try {
    const response = await fetch(
      `${config.url}/rest/v1/whatsapp_team_members?${query.toString()}`,
      {
        headers: headers(config),
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as Array<Record<string, unknown>>;
    return rows[0] ? normalizeWhatsAppTeamMember(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function isWhatsAppTeamEmailAllowed(email: string | null | undefined) {
  return Boolean(await findWhatsAppTeamMemberByEmail(email, { activeOnly: true }));
}

export async function bindWhatsAppTeamGoogleIdentity(input: {
  email: string;
  googleUserId: string;
}) {
  const config = getConfig();
  const email = normalizeWhatsAppTeamEmail(input.email);
  if (!config || !email || !input.googleUserId.trim()) return false;

  try {
    const response = await fetch(
      `${config.url}/rest/v1/whatsapp_team_members?google_email=eq.${encodeURIComponent(email)}&active=eq.true`,
      {
        method: "PATCH",
        headers: headers(config, {
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        }),
        body: JSON.stringify({
          google_user_id: input.googleUserId.trim(),
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        cache: "no-store",
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function ensureWhatsAppOwnerTeamMember(input: {
  email: string;
  displayName?: string | null;
}): Promise<WhatsAppTeamMember | null> {
  const config = getConfig();
  const email = normalizeWhatsAppTeamEmail(input.email);
  if (!config || !email) return null;

  const existing = await findWhatsAppTeamMemberByEmail(email, { activeOnly: false });
  const now = new Date().toISOString();

  try {
    if (existing) {
      if (existing.active && existing.role === "owner") return existing;
      const response = await fetch(
        `${config.url}/rest/v1/whatsapp_team_members?id=eq.${encodeURIComponent(existing.id)}`,
        {
          method: "PATCH",
          headers: headers(config, {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          }),
          body: JSON.stringify({ role: "owner", active: true, updated_at: now }),
          cache: "no-store",
        },
      );
      if (!response.ok) return null;
      const rows = (await response.json()) as Array<Record<string, unknown>>;
      return rows[0] ? normalizeWhatsAppTeamMember(rows[0]) : null;
    }

    const response = await fetch(`${config.url}/rest/v1/whatsapp_team_members`, {
      method: "POST",
      headers: headers(config, {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify({
        google_email: email,
        display_name: input.displayName?.trim() || "Web Growth Owner",
        role: "owner",
        availability: "available",
        active: true,
        created_by_email: email,
        updated_at: now,
      }),
      cache: "no-store",
    });
    if (!response.ok) return findWhatsAppTeamMemberByEmail(email, { activeOnly: true });
    const rows = (await response.json()) as Array<Record<string, unknown>>;
    return rows[0] ? normalizeWhatsAppTeamMember(rows[0]) : null;
  } catch {
    return null;
  }
}
