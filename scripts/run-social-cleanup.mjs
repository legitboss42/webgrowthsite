import { createHmac } from "node:crypto";

const baseUrl = String(process.env.SOCIAL_AUTOMATION_BASE_URL || "https://webgrowth.info").replace(/\/+$/, "");
const secret = String(process.env.SOCIAL_AUTOMATION_WEBHOOK_SECRET || "").trim();
const limit = Math.max(1, Math.min(100, Number(process.env.SOCIAL_AUTOMATION_CLEANUP_LIMIT || 100)));

if (!secret) throw new Error("SOCIAL_AUTOMATION_WEBHOOK_SECRET is required.");

const body = JSON.stringify({ limit });
const timestamp = String(Date.now());
const signature = createHmac("sha256", secret)
  .update(`${timestamp}.${body}`, "utf8")
  .digest("hex");

const response = await fetch(`${baseUrl}/api/internal/social-automation/cleanup/`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-wg-timestamp": timestamp,
    "x-wg-signature": signature,
  },
  body,
  signal: AbortSignal.timeout(60_000),
});

const data = await response.json().catch(() => ({}));
if (!response.ok || data?.ok === false) {
  const code = data?.code ? ` (${data.code})` : "";
  throw new Error(`Social cleanup failed with HTTP ${response.status}${code}`);
}

console.log(
  `[social-cleanup] scanned=${Number(data?.scanned || 0)} deleted=${Number(data?.deleted || 0)} protected=${Number(data?.protected || 0)} failed=${Number(data?.failed || 0)}`
);
