type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type MetaClientOptions = {
  graphVersion: string;
  fetcher?: Fetcher;
};

type ErrorEnvelope = {
  error?: {
    code?: number;
    error_subcode?: number;
    type?: string;
    message?: string;
  };
};

export type MetaOAuthToken = {
  userAccessToken: string;
  expiresAt?: string;
};

export type MetaManagedPage = {
  facebookPageId: string;
  facebookPageName: string;
  pageAccessToken: string;
  instagramAccountId: string;
  instagramAccountName: string | null;
  tasks: string[];
};

export type FacebookReelUploadSession = {
  videoId: string;
  uploadUrl: string;
};

export class MetaApiError extends Error {
  readonly retryable: boolean;
  readonly status: number;
  readonly providerCode?: number;

  constructor(message: string, options: { retryable: boolean; status: number; providerCode?: number }) {
    super(message);
    this.name = "MetaApiError";
    this.retryable = options.retryable;
    this.status = options.status;
    this.providerCode = options.providerCode;
  }
}

function cleanVersion(value: string) {
  const version = value.trim();
  if (!/^v\d+(?:\.\d+)?$/.test(version)) {
    throw new Error("Invalid Meta Graph API version.");
  }
  return version;
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function retryableStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

async function readJson(response: Response) {
  return (await response.json().catch(() => ({}))) as Record<string, unknown> & ErrorEnvelope;
}

async function requestJson(fetcher: Fetcher, url: string, init?: RequestInit) {
  const response = await fetcher(url, init);
  const body = await readJson(response);
  if (!response.ok || body.error) {
    const code = body.error?.code;
    throw new MetaApiError(
      `Meta API request failed with HTTP ${response.status}${code ? ` (code ${code})` : ""}.`,
      { retryable: retryableStatus(response.status), status: response.status, providerCode: code }
    );
  }
  return body;
}

function appendQuery(base: string, values: Record<string, string | boolean | undefined>) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseTokenEnvelope(body: Record<string, unknown>, nowMs: number): MetaOAuthToken {
  const userAccessToken = typeof body.access_token === "string" ? body.access_token : "";
  if (!userAccessToken) {
    throw new MetaApiError("Meta OAuth exchange did not return an access token.", {
      retryable: false,
      status: 502,
    });
  }
  const expiresIn = Number(body.expires_in);
  return {
    userAccessToken,
    ...(Number.isFinite(expiresIn) && expiresIn > 0
      ? { expiresAt: new Date(nowMs + expiresIn * 1000).toISOString() }
      : {}),
  };
}

export function createMetaClient({ graphVersion, fetcher = fetch }: MetaClientOptions) {
  const version = cleanVersion(graphVersion);
  const graphRoot = `https://graph.facebook.com/${version}`;

  const client = {
    async exchangeCode(input: {
      appId: string;
      appSecret: string;
      code: string;
      redirectUri: string;
      nowMs?: number;
    }): Promise<MetaOAuthToken> {
      const form = new URLSearchParams({
        client_id: input.appId,
        client_secret: input.appSecret,
        code: input.code,
        redirect_uri: input.redirectUri,
      });
      const body = await requestJson(fetcher, `${graphRoot}/oauth/access_token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      return parseTokenEnvelope(body, input.nowMs ?? Date.now());
    },

    async exchangeLongLivedUserToken(input: {
      appId: string;
      appSecret: string;
      shortLivedUserAccessToken: string;
      nowMs?: number;
    }): Promise<MetaOAuthToken> {
      const form = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: input.appId,
        client_secret: input.appSecret,
        fb_exchange_token: input.shortLivedUserAccessToken,
      });
      const body = await requestJson(fetcher, `${graphRoot}/oauth/access_token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      return parseTokenEnvelope(body, input.nowMs ?? Date.now());
    },

    async resolveManagedPage(input: {
      userAccessToken: string;
      preferredPageId?: string;
    }): Promise<MetaManagedPage> {
      const url = appendQuery(`${graphRoot}/me/accounts`, {
        fields: "id,name,access_token,tasks,instagram_business_account{id,username,name}",
      });
      const body = await requestJson(fetcher, url, { headers: authHeaders(input.userAccessToken) });
      const data = Array.isArray(body.data) ? body.data : [];
      const candidates = data
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map((item) => {
          const instagram =
            item.instagram_business_account && typeof item.instagram_business_account === "object"
              ? (item.instagram_business_account as Record<string, unknown>)
              : null;
          return {
            facebookPageId: typeof item.id === "string" ? item.id : "",
            facebookPageName: typeof item.name === "string" ? item.name : "",
            pageAccessToken: typeof item.access_token === "string" ? item.access_token : "",
            instagramAccountId: typeof instagram?.id === "string" ? instagram.id : "",
            instagramAccountName:
              typeof instagram?.username === "string"
                ? instagram.username
                : typeof instagram?.name === "string"
                  ? instagram.name
                  : null,
            tasks: stringArray(item.tasks),
          } satisfies MetaManagedPage;
        })
        .filter(
          (item) =>
            Boolean(item.facebookPageId) &&
            Boolean(item.pageAccessToken) &&
            Boolean(item.instagramAccountId)
        );

      if (candidates.length === 0) {
        throw new MetaApiError("No Instagram-linked Facebook Page is available for this Meta account.", {
          retryable: false,
          status: 422,
        });
      }

      if (input.preferredPageId) {
        const selected = candidates.find((item) => item.facebookPageId === input.preferredPageId);
        if (!selected) {
          throw new MetaApiError("The selected Instagram-linked Facebook Page is unavailable.", {
            retryable: false,
            status: 422,
          });
        }
        return selected;
      }

      if (candidates.length > 1) {
        throw new MetaApiError("More than one Instagram-linked Facebook Page is available. Choose a Page explicitly.", {
          retryable: false,
          status: 409,
        });
      }

      return candidates[0];
    },

    async createInstagramReel(input: {
      accessToken: string;
      igUserId: string;
      videoUrl: string;
      caption: string;
      shareToFeed?: boolean;
    }) {
      const url = appendQuery(`${graphRoot}/${encodeURIComponent(input.igUserId)}/media`, {
        media_type: "REELS",
        video_url: input.videoUrl,
        caption: input.caption,
        share_to_feed: input.shareToFeed ?? true,
      });
      const body = await requestJson(fetcher, url, {
        method: "POST",
        headers: authHeaders(input.accessToken),
      });
      const id = typeof body.id === "string" ? body.id : "";
      if (!id) throw new MetaApiError("Meta API did not return an Instagram container ID.", { retryable: false, status: 502 });
      return id;
    },

    async readInstagramContainer(input: { accessToken: string; containerId: string }) {
      const url = appendQuery(`${graphRoot}/${encodeURIComponent(input.containerId)}`, {
        fields: "status_code,status",
      });
      const body = await requestJson(fetcher, url, { headers: authHeaders(input.accessToken) });
      const status = String(body.status_code || "ERROR").toUpperCase();
      if (["FINISHED", "IN_PROGRESS", "ERROR", "EXPIRED", "PUBLISHED"].includes(status)) {
        return status as "FINISHED" | "IN_PROGRESS" | "ERROR" | "EXPIRED" | "PUBLISHED";
      }
      return "ERROR" as const;
    },

    async publishInstagramContainer(input: {
      accessToken: string;
      igUserId: string;
      containerId: string;
    }) {
      const url = appendQuery(`${graphRoot}/${encodeURIComponent(input.igUserId)}/media_publish`, {
        creation_id: input.containerId,
      });
      const body = await requestJson(fetcher, url, {
        method: "POST",
        headers: authHeaders(input.accessToken),
      });
      const id = typeof body.id === "string" ? body.id : "";
      if (!id) throw new MetaApiError("Meta API did not return an Instagram media ID.", { retryable: false, status: 502 });
      return id;
    },

    async startFacebookReel(input: { pageAccessToken: string }): Promise<FacebookReelUploadSession> {
      const startUrl = appendQuery(`${graphRoot}/me/video_reels`, { upload_phase: "start" });
      const start = await requestJson(fetcher, startUrl, {
        method: "POST",
        headers: authHeaders(input.pageAccessToken),
      });
      const videoId = typeof start.video_id === "string" ? start.video_id : "";
      const uploadUrl = typeof start.upload_url === "string" ? start.upload_url : "";
      if (!videoId || !uploadUrl) {
        throw new MetaApiError("Meta API did not return a Facebook Reel upload session.", {
          retryable: false,
          status: 502,
        });
      }
      return { videoId, uploadUrl };
    },

    async uploadFacebookReel(input: {
      pageAccessToken: string;
      uploadUrl: string;
      videoUrl: string;
    }) {
      if (!input.uploadUrl.startsWith("https://")) {
        throw new MetaApiError("Meta API returned an invalid Facebook Reel upload URL.", {
          retryable: false,
          status: 502,
        });
      }
      await requestJson(fetcher, input.uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `OAuth ${input.pageAccessToken}`,
          file_url: input.videoUrl,
        },
      });
    },

    async finishFacebookReel(input: {
      pageAccessToken: string;
      videoId: string;
      description: string;
      title: string;
    }) {
      const finishUrl = appendQuery(`${graphRoot}/me/video_reels`, {
        video_id: input.videoId,
        upload_phase: "finish",
        video_state: "PUBLISHED",
        description: input.description,
        title: input.title,
      });
      await requestJson(fetcher, finishUrl, {
        method: "POST",
        headers: authHeaders(input.pageAccessToken),
      });
      return input.videoId;
    },

    async publishFacebookReel(input: {
      pageAccessToken: string;
      videoUrl: string;
      description: string;
      title: string;
    }) {
      const session = await client.startFacebookReel({ pageAccessToken: input.pageAccessToken });
      await client.uploadFacebookReel({
        pageAccessToken: input.pageAccessToken,
        uploadUrl: session.uploadUrl,
        videoUrl: input.videoUrl,
      });
      await client.finishFacebookReel({
        pageAccessToken: input.pageAccessToken,
        videoId: session.videoId,
        description: input.description,
        title: input.title,
      });
      return session.videoId;
    },
  };

  return client;
}
