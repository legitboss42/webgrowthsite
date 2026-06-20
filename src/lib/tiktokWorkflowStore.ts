import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";

const TIKTOK_WORKFLOW_COOKIE = "wg_tiktok_workflow_jobs";
const MAX_TIKTOK_WORKFLOW_JOBS = 8;

export type TikTokWorkflowJob = {
  articleSlug: string;
  createdAt: string;
  descriptionPreview: string;
  failReason?: string;
  imageCount: number;
  kind: "PHOTO_UPLOAD";
  lastCheckedAt?: string;
  publishId: string;
  status: string;
  title: string;
  updatedAt: string;
};

type TikTokWorkflowPayload = {
  jobs: TikTokWorkflowJob[];
};

function getWorkflowSecret() {
  return (
    process.env.INTERNAL_WORKFLOW_SECRET?.trim() ||
    process.env.TIKTOK_TOKEN_COOKIE_SECRET?.trim() ||
    process.env.TIKTOK_CLIENT_SECRET?.trim() ||
    ""
  );
}

export function getTikTokWorkflowCookieName() {
  return TIKTOK_WORKFLOW_COOKIE;
}

export function readTikTokWorkflowCookie(value: string | undefined) {
  const payload = openCookiePayload<TikTokWorkflowPayload>(value, getWorkflowSecret());
  return Array.isArray(payload?.jobs) ? payload.jobs : [];
}

export function serializeTikTokWorkflowCookie(jobs: TikTokWorkflowJob[]) {
  return sealCookiePayload(
    {
      jobs: jobs
        .slice()
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, MAX_TIKTOK_WORKFLOW_JOBS),
    },
    getWorkflowSecret()
  );
}

export function upsertTikTokWorkflowJob(
  jobs: TikTokWorkflowJob[],
  nextJob: TikTokWorkflowJob
) {
  const remaining = jobs.filter((job) => job.publishId !== nextJob.publishId);
  return [nextJob, ...remaining]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, MAX_TIKTOK_WORKFLOW_JOBS);
}
