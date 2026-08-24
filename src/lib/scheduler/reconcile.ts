import { decryptTikTokTokens } from "./crypto";
import { cleanupSupabaseTerminalStaging } from "./retention";
import { createSchedulerSupabaseClient } from "./supabase";
import { createTikTokSchedulerClient } from "./tiktokClient";
import { mapTikTokPublishStatus } from "./publishStatus";
import { buildTerminalReconciliation, reconciliationWritesSucceeded } from "./retry";

export async function reconcilePublishingAttempts() {
  const supabase = createSchedulerSupabaseClient();
  const { data: attempts, error } = await supabase.from("publish_attempts")
    .select("id,post_id,publish_id,scheduled_posts!inner(user_id)")
    .or("status.eq.PROCESSING,and(status.eq.NEEDS_ATTENTION,error_code.eq.POST_ACCEPTANCE_AMBIGUOUS)")
    .not("publish_id", "is", null)
    .limit(25);
  if (error) throw new Error(`Unable to load TikTok publish attempts (${error.code}).`);
  let completed = 0;
  let failed = 0;

  for (const attempt of attempts || []) {
    const post = attempt.scheduled_posts as unknown as { user_id: string };
    const { data: connection } = await supabase.from("tiktok_connections").select("encrypted_tokens").eq("user_id", post.user_id).single();
    const tokens = connection ? decryptTikTokTokens(connection.encrypted_tokens) : null;
    if (!tokens) continue;
    try {
      const statusPayload = await createTikTokSchedulerClient().fetchPublishStatus(tokens.accessToken, attempt.publish_id!);
      const apiStatus = String(statusPayload.status || "");
      const nextStatus = mapTikTokPublishStatus(apiStatus);
      if (nextStatus === "PROCESSING") continue;
      const completion = new Date().toISOString();
      const terminal = buildTerminalReconciliation(statusPayload, completion);
      const postWrite = await supabase.from("scheduled_posts").update(terminal.post).eq("id", attempt.post_id).select("id");
      if (!reconciliationWritesSucceeded([postWrite])) continue;
      const attemptWrite = await supabase.from("publish_attempts").update(terminal.attempt).eq("id", attempt.id).select("id");
      if (!reconciliationWritesSucceeded([attemptWrite])) continue;
      if (terminal.outcome === "PUBLISHED") completed += 1; else failed += 1;
    } catch {
      // A transient status-read failure is retried on the next cron tick.
    }
  }
  const staging = await cleanupSupabaseTerminalStaging();
  return { checked: attempts?.length || 0, completed, failed, staging };
}

export async function cleanupExpiredStaging(now = new Date()) {
  return cleanupSupabaseTerminalStaging(now);
}
