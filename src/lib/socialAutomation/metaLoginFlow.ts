export function shouldUseMetaRedirectFallback(input: {
  userAgent?: string | null;
  maxTouchPoints?: number | null;
  coarsePointer?: boolean | null;
  viewportWidth?: number | null;
}) {
  const userAgent = input.userAgent || "";
  if (/\b(Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini)\b/i.test(userAgent)) {
    return true;
  }
  if (input.coarsePointer === true) return true;
  if ((input.maxTouchPoints || 0) > 0 && (input.viewportWidth || 0) > 0 && input.viewportWidth! <= 820) {
    return true;
  }
  return false;
}

export function metaFallbackConnectionUrl(returnTo = "/admin/content-automation/") {
  return `/api/admin/content-automation/meta/connect/?returnTo=${encodeURIComponent(returnTo)}`;
}
