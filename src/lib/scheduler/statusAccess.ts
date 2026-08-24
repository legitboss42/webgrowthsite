export type OwnedStatusQuery = {
  select(columns: string): OwnedStatusQuery;
  eq(column: string, value: string): OwnedStatusQuery;
  maybeSingle(): PromiseLike<{ data: Record<string, unknown> | null; error: unknown }>;
};

export type OwnedStatusClient = {
  from(table: "scheduled_posts"): OwnedStatusQuery;
};

export function readOwnedPostStatus(client: OwnedStatusClient, postId: string, userId: string) {
  return client.from("scheduled_posts")
    .select("status,terminal_at,user_failure_code,retry_eligible,next_retry_at")
    .eq("id", postId)
    .eq("user_id", userId)
    .maybeSingle();
}
