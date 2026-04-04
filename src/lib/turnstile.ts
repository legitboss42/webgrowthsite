type TurnstileSiteVerifyResponse = {
  success: boolean;
  action?: string;
  hostname?: string;
  ["error-codes"]?: string[];
};

type VerifyTurnstileOptions = {
  token: string;
  ip?: string;
  expectedAction?: string;
};

type VerifyTurnstileResult =
  | { ok: true }
  | { ok: false; error: string; errorCodes?: string[] };

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileConfigured() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstileToken({
  token,
  ip,
  expectedAction,
}: VerifyTurnstileOptions): Promise<VerifyTurnstileResult> {
  if (!token) {
    return { ok: false, error: "Please complete the spam check." };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (!isProduction) {
      return { ok: true };
    }

    return {
      ok: false,
      error: "Form protection is not configured. Please try again shortly.",
    };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (ip && ip !== "unknown") {
    body.set("remoteip", ip);
  }

  let response: Response;

  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return {
      ok: false,
      error: "Could not verify the spam check. Please try again.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: "Could not verify the spam check. Please try again.",
    };
  }

  const result = (await response.json()) as TurnstileSiteVerifyResponse;

  if (!result.success) {
    return {
      ok: false,
      error: "Spam check failed. Please try again.",
      errorCodes: result["error-codes"],
    };
  }

  if (expectedAction && result.action && result.action !== expectedAction) {
    return {
      ok: false,
      error: "Spam check expired. Please try again.",
    };
  }

  return { ok: true };
}
