import fs from "node:fs/promises";
import path from "node:path";
import { createHash, createHmac } from "node:crypto";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import ffprobeStatic from "ffprobe-static";

const slug = String(process.argv[2] || "").trim();
const sourceCommitSha = String(process.argv[3] || process.env.GITHUB_SHA || "").trim();
const baseUrl = String(process.env.SOCIAL_AUTOMATION_BASE_URL || "https://webgrowth.info").replace(/\/+$/, "");
const secret = String(process.env.SOCIAL_AUTOMATION_WEBHOOK_SECRET || "").trim();
const automationVersion = String(process.env.SOCIAL_AUTOMATION_VERSION || "v1").trim();

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid blog slug: ${slug}`);
if (!/^[a-f0-9]{7,64}$/i.test(sourceCommitSha)) throw new Error("A valid source commit SHA is required.");
if (!secret) throw new Error("SOCIAL_AUTOMATION_WEBHOOK_SECRET is required.");

const root = process.cwd();
const socialDir = path.join(root, "out", "social", slug);
const renderScript = path.join(root, "scripts", "render-social-article.mjs");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: options.capture ? ["ignore", "pipe", "inherit"] : "inherit",
      shell: false,
    });
    let stdout = "";
    if (options.capture && child.stdout) child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function signedPost(endpoint, payload) {
  const body = JSON.stringify(payload);
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex");
  const response = await fetch(`${baseUrl}${endpoint}`, {
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
  if (!response.ok && response.status !== 202) {
    const code = data?.code ? ` (${data.code})` : "";
    throw Object.assign(new Error(`${endpoint} failed with HTTP ${response.status}${code}`), {
      status: response.status,
      retryAfter: Number(response.headers.get("retry-after") || 0),
    });
  }
  return { response, data };
}

async function sha256(filePath) {
  const buffer = await fs.readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

async function probeVideo(filePath) {
  const output = await run(ffprobeStatic.path, [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height:format=duration",
    "-of", "json",
    filePath,
  ], { capture: true });
  const parsed = JSON.parse(String(output || "{}"));
  const stream = Array.isArray(parsed.streams) ? parsed.streams[0] || {} : {};
  const durationSeconds = Number(parsed.format?.duration);
  const width = Number(stream.width);
  const height = Number(stream.height);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error(`ffprobe returned invalid metadata for ${filePath}`);
  }
  return { durationSeconds, width, height };
}

async function uploadProfile(jobId, profile) {
  const lower = profile.toLowerCase();
  const filePath = path.join(socialDir, `${lower}.mp4`);
  const stat = await fs.stat(filePath);
  if (!stat.isFile() || stat.size <= 0) throw new Error(`${profile} render is missing or empty.`);

  const [{ data: prepare }, checksum, media] = await Promise.all([
    signedPost("/api/internal/social-automation/assets/", {
      action: "prepare",
      jobId,
      profile,
    }),
    sha256(filePath),
    probeVideo(filePath),
  ]).then(([prepared, checksumValue, mediaValue]) => [prepared, checksumValue, mediaValue]);

  if (!prepare?.ok || !prepare.supabaseUrl || !prepare.publishableKey || !prepare.token) {
    throw new Error(`Signed ${profile} upload target is incomplete.`);
  }

  const supabase = createClient(prepare.supabaseUrl, prepare.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const bytes = await fs.readFile(filePath);
  const { error: uploadError } = await supabase.storage
    .from(prepare.bucket)
    .uploadToSignedUrl(prepare.storagePath, prepare.token, bytes, {
      contentType: "video/mp4",
    });
  if (uploadError) throw new Error(`${profile} signed upload failed: ${uploadError.message}`);

  const { data: registered } = await signedPost("/api/internal/social-automation/assets/", {
    action: "register",
    jobId,
    profile,
    storagePath: prepare.storagePath,
    originalFilename: prepare.filename,
    mimeType: "video/mp4",
    byteSize: stat.size,
    width: media.width,
    height: media.height,
    durationSeconds: media.durationSeconds,
    checksum,
  });
  if (!registered?.ok) throw new Error(`${profile} asset registration failed.`);
  console.log(`[social-automation] ${profile} asset uploaded and registered.`);
}

console.log(`[social-automation] Creating idempotent job for ${slug}`);
const { data: created } = await signedPost("/api/internal/social-automation/jobs/", {
  slug,
  sourceCommitSha,
  automationVersion,
});
const jobId = String(created?.jobId || "");
if (!jobId) throw new Error("Job creation did not return a job ID.");

console.log(`[social-automation] Rendering ${slug}`);
await run(process.execPath, [renderScript, slug]);
await uploadProfile(jobId, "META");
await uploadProfile(jobId, "TIKTOK");

const deadline = Date.now() + 15 * 60_000;
while (true) {
  const { response, data } = await signedPost("/api/internal/social-automation/publish/", { jobId });
  const status = String(data?.status || "");
  console.log(`[social-automation] Job ${jobId}: ${status || response.status}`);

  if (status === "COMPLETE") break;
  if (status === "PARTIALLY_PUBLISHED" || status === "NEEDS_ATTENTION") {
    throw new Error(`Social automation finished with ${status}. Check /admin/content-automation/.`);
  }
  if (Date.now() >= deadline) {
    throw new Error("Social publication did not reach a terminal state within 15 minutes.");
  }

  const retrySeconds = Math.max(
    5,
    Math.min(60, Number(data?.retryAfterSeconds || response.headers.get("retry-after") || 30))
  );
  await sleep(retrySeconds * 1000);
}

console.log(`[social-automation] ${slug} is fully prepared. TikTok remains in its required creator-consent flow.`);
