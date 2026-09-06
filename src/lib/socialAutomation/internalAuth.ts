import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_CLOCK_SKEW_MS = 5 * 60_000;

type SignInput = {
  body: string;
  timestamp: string;
  secret: string;
};

type VerifyInput = SignInput & {
  signature: string;
  nowMs?: number;
};

export function signInternalRequest({ body, timestamp, secret }: SignInput) {
  if (!secret.trim()) throw new Error("Social automation signing secret is missing.");
  return createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex");
}

export function verifyInternalRequest({
  body,
  timestamp,
  signature,
  secret,
  nowMs = Date.now(),
}: VerifyInput) {
  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs)) return false;
  if (Math.abs(nowMs - timestampMs) > MAX_CLOCK_SKEW_MS) return false;
  if (!secret.trim() || !/^[a-f0-9]{64}$/i.test(signature)) return false;

  const expected = signInternalRequest({ body, timestamp, secret });
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
