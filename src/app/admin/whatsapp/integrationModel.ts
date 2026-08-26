/**
 * Pure model behind the connection status half of the WhatsApp Settings page.
 *
 * This file is about the hosting environment: which variables are set, what that
 * enables, and which migrations have been applied. The operator-editable settings
 * that page also writes live in `src/lib/whatsapp/settings.ts` — the two are kept
 * apart because one is read-only environment reporting and the other is a document
 * this console owns.
 *
 * Every function takes the environment as an argument rather than reading
 * `process.env` itself — the same injection `send.ts` and `phoneNumbers.ts` use,
 * and what lets this be tested without a real environment.
 *
 * The rule this file exists to hold: it reports whether a variable is SET, never
 * what it holds. Nothing here returns, masks, truncates, or hashes a credential —
 * a secret only ever becomes a boolean. Identifiers (phone number id, business
 * account id, Supabase project URL) are configuration rather than credentials and
 * are returned in full, matching the Phone Numbers page which already displays
 * phone number ids; on their own they cannot send or read anything.
 *
 * The resolution order in `resolveWhatsAppGraphApiVersion` and
 * `resolveWhatsAppVerifyTokenSource` deliberately mirrors `send.ts` and the
 * webhook route exactly. If those ever diverge, Settings would report a
 * configuration the app is not actually using, which is worse than reporting
 * nothing.
 */

export type WhatsAppEnvRecord = Record<string, string | undefined>;

/**
 * "secret" values are never returned; "identifier" and "option" values are. Making
 * this a property of the row keeps the display rule mechanical instead of a
 * judgement call at each render site.
 */
export type WhatsAppSettingKind = "secret" | "identifier" | "option";

/**
 * - `set` — the canonical variable is present
 * - `missing` — absent
 * - `default` — absent, but a built-in default applies
 * - `legacy` — present, but supplied by a deprecated variable name
 */
export type WhatsAppSettingStatus = "set" | "missing" | "default" | "legacy";

export type WhatsAppSettingRow = {
  /** The environment variable name. Safe to render — it is a name, not a value. */
  name: string;
  label: string;
  purpose: string;
  kind: WhatsAppSettingKind;
  required: boolean;
  status: WhatsAppSettingStatus;
  /** Always null for `secret` rows, with no exception. */
  value: string | null;
  /** The deprecated variable name that supplied the value, when one did. */
  suppliedBy?: string;
};

/** Matches the fallback in `send.ts` and `phoneNumbers.ts`. */
export const WHATSAPP_GRAPH_API_DEFAULT_VERSION = "v26.0";

/** The route handler that receives Meta's webhooks. */
export const WHATSAPP_WEBHOOK_PATH = "/api/whatsapp/webhook/";

/** Tables the console reads. Used to report which migrations have been applied. */
export const WHATSAPP_EXPECTED_TABLES = [
  "whatsapp_contacts",
  "whatsapp_conversations",
  "whatsapp_messages",
  "whatsapp_events",
  "whatsapp_quick_replies",
  "whatsapp_settings",
] as const;

export type WhatsAppExpectedTable = (typeof WHATSAPP_EXPECTED_TABLES)[number];

function readEnv(env: WhatsAppEnvRecord, name: string) {
  return env[name]?.trim() || "";
}

/** Whitespace-only counts as absent, matching every `?.trim()` call in production. */
export function isWhatsAppEnvSet(env: WhatsAppEnvRecord, name: string) {
  return readEnv(env, name).length > 0;
}

export type WhatsAppGraphApiVersionSource =
  | "WHATSAPP_API_VERSION"
  | "WHATSAPP_GRAPH_API_VERSION"
  | "default";

export function resolveWhatsAppGraphApiVersion(env: WhatsAppEnvRecord): {
  version: string;
  source: WhatsAppGraphApiVersionSource;
} {
  const primary = readEnv(env, "WHATSAPP_API_VERSION");
  if (primary) return { version: primary, source: "WHATSAPP_API_VERSION" };

  const legacy = readEnv(env, "WHATSAPP_GRAPH_API_VERSION");
  if (legacy) return { version: legacy, source: "WHATSAPP_GRAPH_API_VERSION" };

  return { version: WHATSAPP_GRAPH_API_DEFAULT_VERSION, source: "default" };
}

export type WhatsAppVerifyTokenSource =
  | "WHATSAPP_WEBHOOK_VERIFY_TOKEN"
  | "WHATSAPP_VERIFY_TOKEN"
  | null;

export function resolveWhatsAppVerifyTokenSource(env: WhatsAppEnvRecord): WhatsAppVerifyTokenSource {
  if (isWhatsAppEnvSet(env, "WHATSAPP_WEBHOOK_VERIFY_TOKEN")) return "WHATSAPP_WEBHOOK_VERIFY_TOKEN";
  if (isWhatsAppEnvSet(env, "WHATSAPP_VERIFY_TOKEN")) return "WHATSAPP_VERIFY_TOKEN";
  return null;
}

/**
 * The configuration checklist, in the order an operator wires it up rather than
 * alphabetically — token first, then who you send as, then how Meta reaches back.
 */
export function buildWhatsAppSettingRows(env: WhatsAppEnvRecord): WhatsAppSettingRow[] {
  const graph = resolveWhatsAppGraphApiVersion(env);
  const verifySource = resolveWhatsAppVerifyTokenSource(env);

  const secret = (name: string, label: string, purpose: string): WhatsAppSettingRow => ({
    name,
    label,
    purpose,
    kind: "secret",
    required: true,
    status: isWhatsAppEnvSet(env, name) ? "set" : "missing",
    // A secret row carries presence only. There is no branch that fills this in.
    value: null,
  });

  const identifier = (name: string, label: string, purpose: string): WhatsAppSettingRow => {
    const raw = readEnv(env, name);
    return {
      name,
      label,
      purpose,
      kind: "identifier",
      required: true,
      status: raw ? "set" : "missing",
      value: raw || null,
    };
  };

  return [
    secret(
      "WHATSAPP_ACCESS_TOKEN",
      "Access token",
      "Authenticates every Graph API call — sending, templates, and phone numbers.",
    ),
    identifier(
      "WHATSAPP_PHONE_NUMBER_ID",
      "Sender phone number ID",
      "The number replies are sent from.",
    ),
    identifier(
      "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "Business account ID",
      "The WABA that Templates and Phone Numbers are read from.",
    ),
    {
      ...secret(
        "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
        "Webhook verify token",
        "Answers Meta's subscription handshake.",
      ),
      status:
        verifySource === "WHATSAPP_WEBHOOK_VERIFY_TOKEN"
          ? "set"
          : verifySource === "WHATSAPP_VERIFY_TOKEN"
            ? "legacy"
            : "missing",
      ...(verifySource === "WHATSAPP_VERIFY_TOKEN" ? { suppliedBy: "WHATSAPP_VERIFY_TOKEN" } : {}),
      value: null,
    },
    secret(
      "META_APP_SECRET",
      "App secret",
      "Verifies the signature on every inbound webhook.",
    ),
    {
      name: "WHATSAPP_API_VERSION",
      label: "Graph API version",
      purpose: "Which Graph API version calls are made against.",
      kind: "option",
      required: false,
      status:
        graph.source === "WHATSAPP_API_VERSION"
          ? "set"
          : graph.source === "WHATSAPP_GRAPH_API_VERSION"
            ? "legacy"
            : "default",
      value: graph.version,
      ...(graph.source === "WHATSAPP_GRAPH_API_VERSION"
        ? { suppliedBy: "WHATSAPP_GRAPH_API_VERSION" }
        : {}),
    },
    identifier(
      "SUPABASE_URL",
      "Supabase project URL",
      "The project conversations and messages are stored in.",
    ),
    secret(
      "SUPABASE_SERVICE_ROLE_KEY",
      "Supabase service role key",
      "Server-side database access. RLS carries no policies, so this is the only way in.",
    ),
  ];
}

export function countMissingRequiredWhatsAppSettings(rows: WhatsAppSettingRow[]) {
  return rows.filter((row) => row.required && row.status === "missing").length;
}

export function describeWhatsAppSettingStatus(status: WhatsAppSettingStatus) {
  if (status === "set") return "Set";
  if (status === "legacy") return "Legacy name";
  if (status === "default") return "Using default";
  return "Missing";
}

export type WhatsAppCapabilityKey =
  | "send"
  | "handshake"
  | "signature"
  | "storage"
  | "templates"
  | "phoneNumbers";

export type WhatsAppCapability = {
  key: WhatsAppCapabilityKey;
  label: string;
  /** What actually stops working while this is unavailable, stated as consequence. */
  consequence: string;
  available: boolean;
  /** Names of the required variables currently absent. Names only, never values. */
  missing: string[];
};

/**
 * Maps missing variables onto the features they break. This is the part worth
 * having: "META_APP_SECRET is missing" means nothing to most operators, whereas
 * "every inbound webhook is rejected" is the symptom they are already looking at.
 */
export function buildWhatsAppCapabilities(env: WhatsAppEnvRecord): WhatsAppCapability[] {
  const missingOf = (names: string[]) => names.filter((name) => !isWhatsAppEnvSet(env, name));

  const build = (
    key: WhatsAppCapabilityKey,
    label: string,
    consequence: string,
    required: string[],
  ): WhatsAppCapability => {
    const missing = missingOf(required);
    return { key, label, consequence, available: missing.length === 0, missing };
  };

  // The handshake accepts either name, so it cannot use the plain all-of rule.
  // When neither is set the canonical name is the one reported as missing.
  const verifySource = resolveWhatsAppVerifyTokenSource(env);

  return [
    build("send", "Sending messages", "Replies sent from the inbox will fail.", [
      "WHATSAPP_ACCESS_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
    ]),
    {
      key: "handshake",
      label: "Webhook handshake",
      consequence: "Meta cannot verify the subscription, so the webhook cannot be re-subscribed.",
      available: verifySource !== null,
      missing: verifySource === null ? ["WHATSAPP_WEBHOOK_VERIFY_TOKEN"] : [],
    },
    build(
      "signature",
      "Receiving messages",
      "Every inbound webhook is rejected as unsigned, so no message arrives.",
      ["META_APP_SECRET"],
    ),
    build(
      "storage",
      "Storing conversations",
      "Nothing can be read or written, and every page falls back to its empty state.",
      ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    ),
    build("templates", "Reading templates", "The Templates page cannot list approved templates.", [
      "WHATSAPP_ACCESS_TOKEN",
      "WHATSAPP_BUSINESS_ACCOUNT_ID",
    ]),
    build(
      "phoneNumbers",
      "Reading phone numbers",
      "Phone Numbers stays empty and the sender's display number is unknown.",
      ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_BUSINESS_ACCOUNT_ID"],
    ),
  ];
}

export function summarizeWhatsAppCapabilities(capabilities: WhatsAppCapability[]) {
  const blocked = capabilities.filter((capability) => !capability.available);
  return { total: capabilities.length, available: capabilities.length - blocked.length, blocked };
}

/**
 * `next.config.mjs` sets `trailingSlash: true`, so the slashed form is the one this
 * deployment serves without a redirect.
 */
export function buildWhatsAppWebhookUrl(siteUrl: string) {
  return `${siteUrl.replace(/\/+$/, "")}${WHATSAPP_WEBHOOK_PATH}`;
}
