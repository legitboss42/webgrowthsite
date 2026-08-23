type RefreshRpcResult = {
  data: boolean | null;
  error: unknown;
};

export type CreatorConnectionUpdateClient = {
  rpc(
    name: "refresh_active_tiktok_connection",
    parameters: Record<string, unknown>,
  ): PromiseLike<RefreshRpcResult>;
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
  const { data, error } = await client.rpc("refresh_active_tiktok_connection", {
    p_user_id: input.userId,
    p_expected_encrypted_tokens: input.expectedEncryptedTokens,
    p_encrypted_tokens: input.encryptedTokens,
    p_scopes: input.scopes,
    p_access_expires_at: input.accessExpiresAt,
    p_refresh_expires_at: input.refreshExpiresAt,
  });
  return { error: !!error, updatedCount: !error && data === true ? 1 : 0 };
}
