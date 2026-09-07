export function extractMetaSdkRedirectUriFromDialogUrl(dialogUrl: string) {
  try {
    const url = new URL(dialogUrl);
    if (!/^(?:www\.|web\.)?facebook\.com$/.test(url.hostname)) return null;
    if (!/^\/v\d+(?:\.\d+)?\/dialog\/oauth$/.test(url.pathname)) return null;
    return url.searchParams.get("redirect_uri")?.trim() || null;
  } catch {
    return null;
  }
}

export function validateMetaSdkRedirectUri(
  value: string,
  expectedOrigin: string
) {
  const candidate = value.trim();
  if (!candidate || candidate.length > 4096) return null;

  let origin: URL;
  let redirect: URL;
  try {
    origin = new URL(expectedOrigin);
    redirect = new URL(candidate);
  } catch {
    return null;
  }

  if (origin.protocol !== "https:" || redirect.protocol !== "https:") return null;
  if (redirect.hostname !== "staticxx.facebook.com") return null;
  if (redirect.pathname !== "/x/connect/xd_arbiter/") return null;
  if (!/^\d+$/.test(redirect.searchParams.get("version") || "")) return null;

  const fragment = new URLSearchParams(redirect.hash.replace(/^#/, ""));
  if (fragment.get("domain") !== origin.hostname) return null;
  if (fragment.get("is_canvas") !== "false") return null;
  if (fragment.get("relation") !== "opener") return null;

  const sdkOrigin = fragment.get("origin");
  if (!sdkOrigin) return null;
  try {
    const parsedSdkOrigin = new URL(sdkOrigin);
    if (parsedSdkOrigin.origin !== origin.origin) return null;
  } catch {
    return null;
  }

  return candidate;
}
