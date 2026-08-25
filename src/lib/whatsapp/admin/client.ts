import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase access for the WhatsApp admin platform.
 *
 * The `whatsapp_*` tables have RLS enabled with zero policies, so the service
 * role key is the only way in and every query must run on the server. The
 * `server-only` import above makes an accidental client import a build error
 * rather than a credential leak.
 */

export function isWhatsAppDatabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function createWhatsAppSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("WhatsApp database configuration is missing.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * Logs a failed query without leaking connection strings or keys, then returns a
 * short message safe to show an administrator.
 */
export function reportWhatsAppQueryFailure(scope: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[whatsapp-admin] ${scope} query failed`, { detail });
  return "The WhatsApp database did not answer. Retry in a moment.";
}
