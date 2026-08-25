import "server-only";
import {
  createWhatsAppSupabaseClient,
  isWhatsAppDatabaseConfigured,
  reportWhatsAppQueryFailure,
} from "./client";
import { isWhatsAppApiConfigured, isWhatsAppWebhookConfigured, loadConnectedPhoneNumber } from "./account";

/**
 * The small amount of data the application shell itself needs: which number is
 * connected, whether the integration is wired up, and how much work is waiting.
 *
 * Deliberately narrow. The shell renders on every route, so anything expensive
 * here is paid for on every page view.
 */

export type ShellSummary = {
  /** Environment readiness, so the shell can be honest about what works. */
  integration: {
    api: boolean;
    database: boolean;
    webhook: boolean;
  };
  number: {
    /** Meta's own formatted number, or null when the API is unreachable. */
    display: string | null;
    verifiedName: string | null;
    /** connected: Meta answered. unknown: configured but Meta did not answer. */
    state: "connected" | "unknown" | "not-configured";
  };
  /** Null when the database is unreachable, which is not the same as zero. */
  needsReview: number | null;
};

export async function loadShellSummary(): Promise<ShellSummary> {
  const database = isWhatsAppDatabaseConfigured();
  const summary: ShellSummary = {
    integration: {
      api: isWhatsAppApiConfigured(),
      database,
      webhook: isWhatsAppWebhookConfigured(),
    },
    number: { display: null, verifiedName: null, state: "not-configured" },
    needsReview: null,
  };

  const [phoneNumber, reviewCount] = await Promise.all([
    loadConnectedPhoneNumber(),
    countConversationsNeedingReview(database),
  ]);

  if (phoneNumber.configured) {
    if (phoneNumber.ok) {
      summary.number = {
        display: phoneNumber.data.displayPhoneNumber,
        verifiedName: phoneNumber.data.verifiedName,
        state: "connected",
      };
    } else {
      summary.number = { display: null, verifiedName: null, state: "unknown" };
    }
  }

  summary.needsReview = reviewCount;
  return summary;
}

async function countConversationsNeedingReview(database: boolean) {
  if (!database) return null;
  try {
    const supabase = createWhatsAppSupabaseClient();
    const { count, error } = await supabase
      .from("whatsapp_conversations")
      .select("id", { count: "exact", head: true })
      .eq("human_review_required", true)
      .neq("status", "closed");
    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    reportWhatsAppQueryFailure("shell review count", error);
    return null;
  }
}
