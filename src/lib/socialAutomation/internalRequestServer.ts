import "server-only";

import { verifyInternalRequest } from "./internalAuth";

export type SignedJsonResult =
  | { ok: true; body: unknown; rawBody: string }
  | { ok: false; status: number; code: string };

export async function readSignedJsonRequest(request: Request): Promise<SignedJsonResult> {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-wg-timestamp") || "";
  const signature = request.headers.get("x-wg-signature") || "";
  const secret = process.env.SOCIAL_AUTOMATION_WEBHOOK_SECRET?.trim() || "";

  if (!secret) return { ok: false, status: 503, code: "AUTOMATION_SECRET_MISSING" };
  if (!verifyInternalRequest({ timestamp, signature, body: rawBody, secret })) {
    return { ok: false, status: 401, code: "INVALID_SIGNATURE" };
  }

  try {
    return { ok: true, body: JSON.parse(rawBody), rawBody };
  } catch {
    return { ok: false, status: 400, code: "INVALID_JSON" };
  }
}
