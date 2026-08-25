import "server-only";
import { createClient } from "@supabase/supabase-js";
import { WAITLIST_SOURCE, type WaitlistSubmission } from "@/lib/waitlist/schema";

/**
 * Server-only data access for public.automation_waitlist.
 *
 * Uses the service role key, which bypasses RLS. The table has RLS enabled with
 * no policies, so this module is the only way the waitlist can be read or
 * written. Never import it from a client component.
 */

const TABLE = "automation_waitlist";

export type ConfirmationEmailStatus = "pending" | "sent" | "failed" | "skipped";

export type WaitlistRecord = {
  id: string;
  full_name: string;
  email: string;
  business_name: string | null;
  interest: string;
  use_case: string | null;
  business_size: string | null;
  status: string;
  confirmation_email_status: string;
  created_at: string;
};

function createWaitlistClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Waitlist database configuration is missing.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function isWaitlistStorageConfigured() {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/**
 * Insert a signup, or update the existing row for that email.
 *
 * Deliberately omits created_at, consent_at, consent_source, source and status
 * from the payload. On a fresh insert those take their column defaults; on
 * conflict they are absent from the generated UPDATE SET clause and so keep
 * their original values. The result is that resubmitting refreshes someone's
 * stated interest without rewriting when they first signed up or consented, and
 * without resetting an invited/activated status back to waitlisted.
 */
export async function saveWaitlistSignup(submission: WaitlistSubmission) {
  const supabase = createWaitlistClient();

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        full_name: submission.fullName,
        email: submission.email,
        business_name: submission.businessName,
        interest: submission.interest,
        use_case: submission.useCase,
        business_size: submission.businessSize,
        confirmation_email_status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Waitlist upsert failed: ${error?.message || "no row returned"}`);
  }

  return { id: String(data.id) };
}

/**
 * Record the outcome of the confirmation email attempt. Never throws, because the
 * signup is already saved and a bookkeeping failure must not fail the request.
 * Returns false if the write-back did not land, so the caller can log it.
 */
export async function recordConfirmationEmailResult(
  id: string,
  status: ConfirmationEmailStatus
): Promise<boolean> {
  try {
    const supabase = createWaitlistClient();
    const { error } = await supabase
      .from(TABLE)
      .update({
        confirmation_email_status: status,
        ...(status === "sent" ? { confirmation_email_sent_at: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return !error;
  } catch {
    return false;
  }
}

/** Admin dashboard read. Returns newest first; never exposed to public routes. */
export async function listWaitlistSignups(limit = 500): Promise<WaitlistRecord[]> {
  const supabase = createWaitlistClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "id, full_name, email, business_name, interest, use_case, business_size, status, confirmation_email_status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Waitlist read failed: ${error.message}`);
  }

  return (data || []) as WaitlistRecord[];
}

export { WAITLIST_SOURCE };
