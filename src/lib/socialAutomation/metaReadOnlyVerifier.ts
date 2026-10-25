export type MetaGraphReadResult = {
  ok: boolean;
  httpStatus: number | null;
  reason: "OK" | "INVALID_CONFIGURATION" | "MISSING_CREDENTIAL" |
    "AUTH_OR_PERMISSION_DENIED" | "RATE_LIMITED" | "UPSTREAM_ERROR" |
    "NETWORK_ERROR" | "RESOURCE_MISMATCH";
};

export type MetaGraphVerification = {
  facebook: MetaGraphReadResult;
  instagram: MetaGraphReadResult;
};

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

const failure = (reason: MetaGraphReadResult["reason"], httpStatus: number | null = null):
  MetaGraphReadResult => ({ ok: false, reason, httpStatus });

/**
 * Authenticated read-only Meta Graph calls against one known Page and its
 * linked professional Instagram account. No Graph body, token, user ID or
 * resource identifier is emitted by this function.
 */
export async function verifyMetaPageAndInstagram(input: {
  graphVersion: string;
  pageId: string;
  instagramId: string;
  pageAccessToken: string;
  fetcher?: FetchLike;
}): Promise<MetaGraphVerification> {
  const bad = failure("INVALID_CONFIGURATION");
  const version = input.graphVersion.trim();
  if (!/^v\d{1,3}\.\d{1,2}$/.test(version)
    || !/^\d{4,30}$/.test(input.pageId)
    || !/^\d{4,30}$/.test(input.instagramId)) {
    return { facebook: bad, instagram: bad };
  }
  if (!input.pageAccessToken || input.pageAccessToken.length < 15) {
    const missing = failure("MISSING_CREDENTIAL");
    return { facebook: missing, instagram: missing };
  }

  const transport = input.fetcher || fetch;

  const read = async (
    id: string, fields: "id,name" | "id,username"
  ): Promise<MetaGraphReadResult> => {
    const url = new URL(`https://graph.facebook.com/${version}/${id}`);
    url.searchParams.set("fields", fields);
    try {
      const response = await transport(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${input.pageAccessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) {
        const reason = response.status === 401 || response.status === 403
          ? "AUTH_OR_PERMISSION_DENIED"
          : response.status === 429
            ? "RATE_LIMITED"
            : "UPSTREAM_ERROR";
        return failure(reason, response.status);
      }
      // Small bounded response; no Graph response content is returned to caller.
      const body = await response.text();
      if (body.length > 8192) return failure("UPSTREAM_ERROR", response.status);
      const record: unknown = JSON.parse(body);
      if (!record || typeof record !== "object" || !("id" in record)
        || (record as {id?: unknown}).id !== id) {
        return failure("RESOURCE_MISMATCH", response.status);
      }
      return { ok: true, reason: "OK", httpStatus: response.status };
    } catch {
      return failure("NETWORK_ERROR");
    }
  };

  const facebook = await read(input.pageId, "id,name");
  const instagram = await read(input.instagramId, "id,username");
  return { facebook, instagram };
}
