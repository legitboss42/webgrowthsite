type ConnectionUpdateQuery = {
  eq(column: string, value: string): ConnectionUpdateQuery;
  select(columns: "user_id"): PromiseLike<{ data: Array<{ user_id: string }> | null; error: unknown }>;
};

export type CreatorConnectionUpdateClient = {
  from(table: "tiktok_connections"): {
    update(values: Record<string, unknown>): ConnectionUpdateQuery;
  };
};

export type RefreshedCreatorConnectionInput = {
  userId: string;
  expectedEncryptedTokens: string;
  encryptedTokens: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  scopes: string[];
};

export async function saveRefreshedCreatorConnection(
  client: CreatorConnectionUpdateClient,
  input: RefreshedCreatorConnectionInput,
) {
  const { data, error } = await client.from("tiktok_connections").update({
    encrypted_tokens: input.encryptedTokens,
    access_expires_at: input.accessExpiresAt,
    refresh_expires_at: input.refreshExpiresAt,
    scopes: input.scopes,
  })
    .eq("user_id", input.userId)
    .eq("encrypted_tokens", input.expectedEncryptedTokens)
    .select("user_id");
  return { error: !!error, updatedCount: data?.length ?? 0 };
}
