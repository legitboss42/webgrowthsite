import { summarizeJobPublicationStatus } from "./publicationState";
import type { SocialPublicationStatus } from "./store";
import type { SocialPlatform } from "./types";

const ARTICLE_WAIT_LIMIT_MS = 15 * 60 * 1000;
const DEFAULT_RETRY_SECONDS = 30;

type RunnerPublication = {
  status: SocialPublicationStatus;
  caption: string;
  externalPublicationId?: string | null;
  providerState?: Record<string, unknown> | null;
};

type RunnerState = {
  job: {
    id: string;
    startedAt: string;
    article: {
      slug: string;
      title: string;
      canonicalUrl: string;
    };
  };
  settings: {
    enabled: boolean;
    instagram: boolean;
    facebook: boolean;
    tiktok: boolean;
    retentionDays: number;
  };
  assets: {
    meta: { id: string; storagePath: string };
    tiktok: {
      id: string;
      storagePath: string;
      checksum: string;
      byteSize: number;
      durationSeconds: number;
    };
  };
  publications: Record<SocialPlatform, RunnerPublication>;
};

type MetaConnection = {
  pageAccessToken: string;
  instagramAccountId: string;
};

type RunnerDeps = {
  nowMs(): number;
  isArticleLive(url: string): Promise<boolean>;
  getMetaVideoUrl(storagePath: string): Promise<string>;
  getMetaConnection(): Promise<MetaConnection | null>;
  createInstagramReel(input: {
    accessToken: string;
    igUserId: string;
    videoUrl: string;
    caption: string;
  }): Promise<string>;
  readInstagramContainer(input: {
    accessToken: string;
    containerId: string;
  }): Promise<"FINISHED" | "IN_PROGRESS" | "ERROR" | "EXPIRED" | "PUBLISHED">;
  publishInstagramContainer(input: {
    accessToken: string;
    igUserId: string;
    containerId: string;
  }): Promise<string>;
  startFacebookReel(input: { pageAccessToken: string }): Promise<{ videoId: string; uploadUrl: string }>;
  uploadFacebookReel(input: {
    pageAccessToken: string;
    uploadUrl: string;
    videoUrl: string;
  }): Promise<unknown>;
  finishFacebookReel(input: {
    pageAccessToken: string;
    videoId: string;
    description: string;
    title: string;
  }): Promise<string>;
  prepareTikTok(input: {
    articleSlug: string;
    storagePath: string;
    caption: string;
    checksum: string;
    byteSize: number;
    durationSeconds: number;
    title: string;
  }): Promise<{ postId: string }>;
  savePublication(platform: SocialPlatform, patch: Record<string, unknown>): Promise<void>;
  saveJob(patch: Record<string, unknown>): Promise<void>;
  setAssetRetention(retainedUntil: string): Promise<void>;
};

type PlatformStatuses = Record<SocialPlatform, SocialPublicationStatus>;

function isRetryable(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "retryable" in error &&
      (error as { retryable?: unknown }).retryable === true
  );
}

function safeMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 500);
  return "Social provider request failed.";
}

function currentStatuses(state: RunnerState): PlatformStatuses {
  return {
    INSTAGRAM: state.publications.INSTAGRAM.status,
    FACEBOOK: state.publications.FACEBOOK.status,
    TIKTOK: state.publications.TIKTOK.status,
  };
}

async function skipPlatform(
  platform: SocialPlatform,
  publication: RunnerPublication,
  deps: RunnerDeps
): Promise<SocialPublicationStatus> {
  if (publication.status === "PUBLISHED" || publication.status === "NEEDS_APPROVAL") {
    return publication.status;
  }
  if (publication.status !== "SKIPPED") {
    await deps.savePublication(platform, { status: "SKIPPED", nextRetryAt: null });
  }
  return "SKIPPED";
}

async function failPlatform(
  platform: SocialPlatform,
  error: unknown,
  deps: RunnerDeps,
  extra: Record<string, unknown> = {}
): Promise<SocialPublicationStatus> {
  const status: SocialPublicationStatus = isRetryable(error) ? "FAILED_RETRYABLE" : "NEEDS_ATTENTION";
  await deps.savePublication(platform, {
    ...extra,
    status,
    lastErrorMessage: safeMessage(error),
    nextRetryAt: status === "FAILED_RETRYABLE" ? new Date(deps.nowMs() + DEFAULT_RETRY_SECONDS * 1000).toISOString() : null,
  });
  return status;
}

async function runInstagram(
  state: RunnerState,
  deps: RunnerDeps,
  connection: MetaConnection | null,
  metaVideoUrl: string | null
): Promise<SocialPublicationStatus> {
  const publication = state.publications.INSTAGRAM;
  if (!state.settings.enabled || !state.settings.instagram) {
    return skipPlatform("INSTAGRAM", publication, deps);
  }
  if (publication.status === "PUBLISHED" || publication.status === "NEEDS_ATTENTION") {
    return publication.status;
  }
  if (!connection || !metaVideoUrl) {
    return failPlatform(
      "INSTAGRAM",
      Object.assign(new Error("Meta connection or media is unavailable."), { retryable: false }),
      deps
    );
  }

  let containerId = publication.externalPublicationId?.trim() || "";
  try {
    if (!containerId) {
      containerId = await deps.createInstagramReel({
        accessToken: connection.pageAccessToken,
        igUserId: connection.instagramAccountId,
        videoUrl: metaVideoUrl,
        caption: publication.caption,
      });
      await deps.savePublication("INSTAGRAM", {
        status: "PROCESSING",
        externalPublicationId: containerId,
        lastErrorMessage: null,
        nextRetryAt: new Date(deps.nowMs() + DEFAULT_RETRY_SECONDS * 1000).toISOString(),
      });
    }

    const containerStatus = await deps.readInstagramContainer({
      accessToken: connection.pageAccessToken,
      containerId,
    });
    if (containerStatus === "IN_PROGRESS") {
      await deps.savePublication("INSTAGRAM", {
        status: "PROCESSING",
        externalPublicationId: containerId,
        nextRetryAt: new Date(deps.nowMs() + DEFAULT_RETRY_SECONDS * 1000).toISOString(),
      });
      return "PROCESSING";
    }
    if (containerStatus === "ERROR" || containerStatus === "EXPIRED") {
      throw Object.assign(new Error(`Instagram container entered ${containerStatus}.`), { retryable: false });
    }
    if (containerStatus === "PUBLISHED") {
      await deps.savePublication("INSTAGRAM", {
        status: "PUBLISHED",
        externalPublicationId: containerId,
        nextRetryAt: null,
        publishedAt: new Date(deps.nowMs()).toISOString(),
      });
      return "PUBLISHED";
    }

    const mediaId = await deps.publishInstagramContainer({
      accessToken: connection.pageAccessToken,
      igUserId: connection.instagramAccountId,
      containerId,
    });
    await deps.savePublication("INSTAGRAM", {
      status: "PUBLISHED",
      externalPublicationId: mediaId,
      providerState: { containerId },
      nextRetryAt: null,
      lastErrorMessage: null,
      publishedAt: new Date(deps.nowMs()).toISOString(),
    });
    return "PUBLISHED";
  } catch (error) {
    return failPlatform("INSTAGRAM", error, deps, {
      externalPublicationId: containerId || null,
    });
  }
}

function facebookState(publication: RunnerPublication) {
  const raw = publication.providerState && typeof publication.providerState === "object"
    ? publication.providerState
    : {};
  return {
    videoId: typeof raw.videoId === "string" ? raw.videoId : "",
    uploadUrl: typeof raw.uploadUrl === "string" ? raw.uploadUrl : "",
    uploaded: raw.uploaded === true,
    finished: raw.finished === true,
  };
}

async function runFacebook(
  state: RunnerState,
  deps: RunnerDeps,
  connection: MetaConnection | null,
  metaVideoUrl: string | null
): Promise<SocialPublicationStatus> {
  const publication = state.publications.FACEBOOK;
  if (!state.settings.enabled || !state.settings.facebook) {
    return skipPlatform("FACEBOOK", publication, deps);
  }
  if (publication.status === "PUBLISHED" || publication.status === "NEEDS_ATTENTION") {
    return publication.status;
  }
  if (!connection || !metaVideoUrl) {
    return failPlatform(
      "FACEBOOK",
      Object.assign(new Error("Meta connection or media is unavailable."), { retryable: false }),
      deps
    );
  }

  const provider = facebookState(publication);
  try {
    if (!provider.videoId || !provider.uploadUrl) {
      const session = await deps.startFacebookReel({ pageAccessToken: connection.pageAccessToken });
      provider.videoId = session.videoId;
      provider.uploadUrl = session.uploadUrl;
      provider.uploaded = false;
      provider.finished = false;
      await deps.savePublication("FACEBOOK", {
        status: "PROCESSING",
        providerState: { ...provider },
        externalPublicationId: provider.videoId,
        lastErrorMessage: null,
      });
    }

    if (!provider.uploaded) {
      await deps.uploadFacebookReel({
        pageAccessToken: connection.pageAccessToken,
        uploadUrl: provider.uploadUrl,
        videoUrl: metaVideoUrl,
      });
      provider.uploaded = true;
      await deps.savePublication("FACEBOOK", {
        status: "PROCESSING",
        providerState: { ...provider },
        externalPublicationId: provider.videoId,
      });
    }

    if (!provider.finished) {
      await deps.finishFacebookReel({
        pageAccessToken: connection.pageAccessToken,
        videoId: provider.videoId,
        description: publication.caption,
        title: state.job.article.title,
      });
      provider.finished = true;
    }

    await deps.savePublication("FACEBOOK", {
      status: "PUBLISHED",
      providerState: { ...provider },
      externalPublicationId: provider.videoId,
      nextRetryAt: null,
      lastErrorMessage: null,
      publishedAt: new Date(deps.nowMs()).toISOString(),
    });
    return "PUBLISHED";
  } catch (error) {
    return failPlatform("FACEBOOK", error, deps, {
      providerState: { ...provider },
      externalPublicationId: provider.videoId || null,
    });
  }
}

async function runTikTok(state: RunnerState, deps: RunnerDeps): Promise<SocialPublicationStatus> {
  const publication = state.publications.TIKTOK;
  if (!state.settings.enabled || !state.settings.tiktok) {
    return skipPlatform("TIKTOK", publication, deps);
  }
  if (
    publication.status === "NEEDS_APPROVAL" ||
    publication.status === "PUBLISHED" ||
    publication.status === "NEEDS_ATTENTION"
  ) {
    return publication.status;
  }

  try {
    const draft = await deps.prepareTikTok({
      articleSlug: state.job.article.slug,
      storagePath: state.assets.tiktok.storagePath,
      caption: publication.caption,
      checksum: state.assets.tiktok.checksum,
      byteSize: state.assets.tiktok.byteSize,
      durationSeconds: state.assets.tiktok.durationSeconds,
      title: state.job.article.title,
    });
    await deps.savePublication("TIKTOK", {
      status: "NEEDS_APPROVAL",
      externalPublicationId: draft.postId,
      nextRetryAt: null,
      lastErrorMessage: null,
    });
    return "NEEDS_APPROVAL";
  } catch (error) {
    return failPlatform("TIKTOK", error, deps);
  }
}

export async function runSocialPublication(state: RunnerState, deps: RunnerDeps) {
  const articleLive = await deps.isArticleLive(state.job.article.canonicalUrl);
  if (!articleLive) {
    const started = Date.parse(state.job.startedAt);
    const expired = !Number.isFinite(started) || deps.nowMs() - started >= ARTICLE_WAIT_LIMIT_MS;
    if (expired) {
      await deps.saveJob({ status: "NEEDS_ATTENTION", lastErrorCode: "ARTICLE_NOT_LIVE" });
      return {
        status: "NEEDS_ATTENTION" as const,
        platforms: currentStatuses(state),
      };
    }
    await deps.saveJob({ status: "WAITING_FOR_ARTICLE" });
    return {
      status: "WAITING_FOR_ARTICLE" as const,
      retryAfterSeconds: DEFAULT_RETRY_SECONDS,
      platforms: currentStatuses(state),
    };
  }

  let connection: MetaConnection | null = null;
  let metaVideoUrl: string | null = null;
  if (state.settings.enabled && (state.settings.instagram || state.settings.facebook)) {
    [connection, metaVideoUrl] = await Promise.all([
      deps.getMetaConnection(),
      deps.getMetaVideoUrl(state.assets.meta.storagePath),
    ]);
  }

  await deps.saveJob({ status: "PUBLISHING" });

  const [instagram, facebook, tiktok] = await Promise.all([
    runInstagram(state, deps, connection, metaVideoUrl),
    runFacebook(state, deps, connection, metaVideoUrl),
    runTikTok(state, deps),
  ]);
  const platforms: PlatformStatuses = {
    INSTAGRAM: instagram,
    FACEBOOK: facebook,
    TIKTOK: tiktok,
  };
  const status = summarizeJobPublicationStatus([instagram, facebook, tiktok]);
  const terminal = status === "COMPLETE" || status === "PARTIALLY_PUBLISHED" || status === "NEEDS_ATTENTION";

  if (terminal) {
    const retentionDays = Math.max(1, Math.min(30, Math.trunc(state.settings.retentionDays || 7)));
    const retainedUntil = new Date(deps.nowMs() + retentionDays * 24 * 60 * 60 * 1000).toISOString();
    await deps.setAssetRetention(retainedUntil);
    await deps.saveJob({
      status,
      completedAt: new Date(deps.nowMs()).toISOString(),
    });
  } else {
    await deps.saveJob({ status });
  }

  return {
    status,
    ...(status === "PUBLISHING" ? { retryAfterSeconds: DEFAULT_RETRY_SECONDS } : {}),
    platforms,
  };
}
