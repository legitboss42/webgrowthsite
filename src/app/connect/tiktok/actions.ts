"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPost, isPublicBlogSlug } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";
import {
  createInternalWorkflowCookieValue,
  getInternalWorkflowCookieName,
  getInternalWorkflowTtlSeconds,
  isInternalWorkflowConfigured,
  readInternalWorkflowCookie,
  verifyInternalWorkflowPassphrase,
} from "@/lib/internalWorkflowAuth";
import {
  createTikTokPhotoDraft,
  fetchTikTokPublishStatus,
  getTikTokConnectionCookieName,
  getTikTokConnectionMaxAgeSeconds,
  getTikTokTokenCookieName,
  isTikTokTokenExpiringSoon,
  readTikTokConnectionCookie,
  readTikTokTokenCookie,
  refreshTikTokTokens,
  serializeTikTokConnectionCookie,
  serializeTikTokTokenCookie,
  type TikTokConnectionRecord,
} from "@/lib/tiktok";
import { buildTikTokPhotoDraftContent } from "@/lib/tiktokPublishing";
import {
  getTikTokWorkflowCookieName,
  readTikTokWorkflowCookie,
  serializeTikTokWorkflowCookie,
  upsertTikTokWorkflowJob,
  type TikTokWorkflowJob,
} from "@/lib/tiktokWorkflowStore";

const CONNECT_PATH = "/connect/tiktok/";

function secureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

function encodeMessage(message: string) {
  return encodeURIComponent(message.slice(0, 240));
}

function redirectToConnect(searchParams: URLSearchParams): never {
  const query = searchParams.toString();
  redirect(query ? `${CONNECT_PATH}?${query}` : CONNECT_PATH);
}

async function ensureUnlockedWorkflow() {
  const cookieStore = await cookies();
  const workflowSession = readInternalWorkflowCookie(
    cookieStore.get(getInternalWorkflowCookieName())?.value
  );

  if (!workflowSession) {
    redirectToConnect(new URLSearchParams({ workflow: "locked" }));
  }

  return cookieStore;
}

async function resolveTikTokRecord(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const tokenRecord = readTikTokTokenCookie(
    cookieStore.get(getTikTokTokenCookieName())?.value
  );
  const connectionSummary = readTikTokConnectionCookie(
    cookieStore.get(getTikTokConnectionCookieName())?.value
  );

  if (!tokenRecord) {
    redirectToConnect(
      new URLSearchParams({
        status: "error",
        message: encodeMessage(
          "No TikTok token payload is saved in this browser yet. Run the TikTok authorization flow again."
        ),
      })
    );
  }

  const activeRecord: TikTokConnectionRecord = tokenRecord;

  if (!isTikTokTokenExpiringSoon(activeRecord)) {
    return activeRecord;
  }

  const refreshed = await refreshTikTokTokens(activeRecord);
  if (!refreshed.ok) {
    const params = new URLSearchParams({
      status: "error",
      message: encodeMessage(refreshed.message),
    });
    if (refreshed.needsReconnect) {
      params.set("mode", "publishing");
    }
    redirectToConnect(params);
  }

  const refreshedRecord = refreshed.record;
  const refreshedSummary = refreshed.summary;

  const maxAge = getTikTokConnectionMaxAgeSeconds(refreshedRecord.refreshExpiresIn);
  cookieStore.set({
    name: getTikTokTokenCookieName(),
    value: serializeTikTokTokenCookie(refreshedRecord),
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookieFlag(),
    path: "/",
    maxAge,
  });
  cookieStore.set({
    name: getTikTokConnectionCookieName(),
    value: serializeTikTokConnectionCookie(
      connectionSummary
        ? {
            ...connectionSummary,
            scope: refreshedSummary.scope,
            expiresIn: refreshedSummary.expiresIn,
            refreshExpiresIn: refreshedSummary.refreshExpiresIn,
          }
        : refreshedSummary
    ),
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookieFlag(),
    path: "/",
    maxAge,
  });

  return refreshedRecord;
}

function buildSlideImageUrls(articleSlug: string) {
  return [0, 1, 2, 3].map((index) =>
    absoluteUrl(`/api/tiktok/slides/${articleSlug}/?index=${index}`)
  );
}

function saveWorkflowJobs(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  nextJob: TikTokWorkflowJob
) {
  const jobs = readTikTokWorkflowCookie(
    cookieStore.get(getTikTokWorkflowCookieName())?.value
  );
  cookieStore.set({
    name: getTikTokWorkflowCookieName(),
    value: serializeTikTokWorkflowCookie(upsertTikTokWorkflowJob(jobs, nextJob)),
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookieFlag(),
    path: "/",
    maxAge: getInternalWorkflowTtlSeconds(),
  });
}

export async function unlockInternalWorkflow(formData: FormData) {
  const passphrase = String(formData.get("passphrase") || "");

  if (!isInternalWorkflowConfigured()) {
    redirectToConnect(new URLSearchParams({ workflow: "config-missing" }));
  }

  if (!verifyInternalWorkflowPassphrase(passphrase)) {
    redirectToConnect(new URLSearchParams({ workflow: "invalid" }));
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: getInternalWorkflowCookieName(),
    value: createInternalWorkflowCookieValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookieFlag(),
    path: "/",
    maxAge: getInternalWorkflowTtlSeconds(),
  });

  redirectToConnect(new URLSearchParams({ workflow: "ready" }));
}

export async function lockInternalWorkflow() {
  const cookieStore = await cookies();
  cookieStore.delete(getInternalWorkflowCookieName());
  redirectToConnect(new URLSearchParams({ workflow: "locked" }));
}

export async function clearTikTokConnection() {
  const cookieStore = await cookies();
  cookieStore.delete(getTikTokConnectionCookieName());
  cookieStore.delete(getTikTokTokenCookieName());
  cookieStore.delete(getTikTokWorkflowCookieName());
  redirectToConnect(new URLSearchParams({ status: "cleared" }));
}

export async function createTikTokArticleDraft(formData: FormData) {
  const articleSlug = String(formData.get("articleSlug") || "").trim();
  const cookieStore = await ensureUnlockedWorkflow();

  if (!articleSlug || !isPublicBlogSlug(articleSlug)) {
    redirectToConnect(
      new URLSearchParams({
        workflow: "ready",
        message: encodeMessage("Choose an approved article before creating a draft."),
      })
    );
  }

  const post = getPost(articleSlug);
  if (!post) {
    redirectToConnect(
      new URLSearchParams({
        workflow: "ready",
        message: encodeMessage("The selected article could not be found."),
      })
    );
  }
  const selectedPost = post;

  const record = await resolveTikTokRecord(cookieStore);
  const draftContent = buildTikTokPhotoDraftContent(selectedPost);
  const photoImages = buildSlideImageUrls(selectedPost.slug);
  const draftResult = await createTikTokPhotoDraft({
    accessToken: record.accessToken,
    description: draftContent.description,
    photoCoverIndex: 0,
    photoImages,
    title: draftContent.title,
  });

  if (!draftResult.ok) {
    redirectToConnect(
      new URLSearchParams({
        article: post.slug,
        status: "error",
        workflow: "ready",
        message: encodeMessage(draftResult.message),
      })
    );
  }
  const publishId = draftResult.publishId;

  const now = new Date().toISOString();
  saveWorkflowJobs(cookieStore, {
    articleSlug: selectedPost.slug,
    createdAt: now,
    descriptionPreview: draftContent.description,
    imageCount: photoImages.length,
    kind: "PHOTO_UPLOAD",
    publishId,
    status: "SUBMITTED",
    title: draftContent.title,
    updatedAt: now,
  });

  redirectToConnect(
    new URLSearchParams({
      article: selectedPost.slug,
      workflow: "ready",
      message: encodeMessage(
        "TikTok photo draft submitted. Check the recent drafts section and your TikTok inbox."
      ),
    })
  );
}

export async function refreshTikTokDraftStatusAction(formData: FormData) {
  const articleSlug = String(formData.get("articleSlug") || "").trim();
  const publishId = String(formData.get("publishId") || "").trim();
  const cookieStore = await ensureUnlockedWorkflow();

  if (!publishId) {
    redirectToConnect(
      new URLSearchParams({
        article: articleSlug,
        workflow: "ready",
        message: encodeMessage("No publish ID was provided for the status check."),
      })
    );
  }

  const record = await resolveTikTokRecord(cookieStore);
  const statusResult = await fetchTikTokPublishStatus({
    accessToken: record.accessToken,
    publishId,
  });

  if (!statusResult.ok) {
    redirectToConnect(
      new URLSearchParams({
        article: articleSlug,
        status: "error",
        workflow: "ready",
        message: encodeMessage(statusResult.message),
      })
    );
  }
  const publishStatus = statusResult.status;

  const jobs = readTikTokWorkflowCookie(
    cookieStore.get(getTikTokWorkflowCookieName())?.value
  );
  const currentJob =
    jobs.find((job) => job.publishId === publishId) ||
    ({
      articleSlug,
      createdAt: new Date().toISOString(),
      descriptionPreview: "",
      imageCount: 0,
      kind: "PHOTO_UPLOAD",
      publishId,
      status: statusResult.status.status,
      title: articleSlug,
      updatedAt: new Date().toISOString(),
    } satisfies TikTokWorkflowJob);
  const now = new Date().toISOString();

  saveWorkflowJobs(cookieStore, {
    ...currentJob,
    failReason: publishStatus.failReason || undefined,
    lastCheckedAt: now,
    status: publishStatus.status,
    updatedAt: now,
  });

  redirectToConnect(
    new URLSearchParams({
      article: articleSlug,
      workflow: "ready",
      message: encodeMessage(`TikTok status updated: ${publishStatus.status}`),
    })
  );
}
