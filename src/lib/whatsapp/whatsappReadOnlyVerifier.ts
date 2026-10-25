export type WhatsAppGraphStatus = {
  ok: boolean;
  status: "OK" | "INVALID_CONFIGURATION" | "MISSING_CREDENTIAL" |
    "AUTH_OR_PERMISSION_DENIED" | "RATE_LIMITED" | "UPSTREAM_ERROR" |
    "NETWORK_ERROR" | "RESOURCE_MISMATCH";
  httpStatus: number | null;
};

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

function failure(status: WhatsAppGraphStatus["status"], httpStatus: number | null = null): WhatsAppGraphStatus {
  return { ok: false, status, httpStatus };
}

/** Limited WhatsApp Business Graph identity check: no calls to messaging endpoints. */
export async function verifyWhatsAppBusinessPhone(input: {
  apiVersion: string;
  phoneNumberId: string;
  token: string;
  fetcher?: FetchLike;
}): Promise<WhatsAppGraphStatus> {
  if (!/^v\d{1,3}\.\d{1,2}$/.test(input.apiVersion) ||
      !/^\d{4,30}$/.test(input.phoneNumberId)) {
    return failure("INVALID_CONFIGURATION");
  }
  if (typeof input.token !== "string" || input.token.length < 15) {
    return failure("MISSING_CREDENTIAL");
  }
  // Never include the token in URL/query params or in a returned error.
  const url = new URL(`https://graph.facebook.com/${input.apiVersion}/${input.phoneNumberId}`);
  url.searchParams.set("fields", "id,verified_name");
  try {
    const response = await (input.fetcher || fetch)(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${input.token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      return failure(
        response.status === 401 || response.status === 403
          ? "AUTH_OR_PERMISSION_DENIED"
          : response.status === 429
            ? "RATE_LIMITED"
            : "UPSTREAM_ERROR",
        response.status,
      );
    }
    const body = await response.text();
    if (body.length > 8192) return failure("UPSTREAM_ERROR", response.status);
    const payload: unknown = JSON.parse(body);
    if (!payload || typeof payload !== "object" ||
        !("id" in payload) || (payload as { id?: unknown }).id !== input.phoneNumberId) {
      return failure("RESOURCE_MISMATCH", response.status);
    }
    return { ok: true, status: "OK", httpStatus: response.status };
  } catch {
    return failure("NETWORK_ERROR");
  }
}
