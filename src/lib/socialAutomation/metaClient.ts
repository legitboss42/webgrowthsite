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

export function createMetaClient({ graphVersion, fetcher = fetch }: MetaClientOptions) {
  const version = cleanVersion(graphVersion);
  const graphRoot = `https://graph.facebook.com/${version}`;

  return {
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

    async publishFacebookReel(input: {
      pageAccessToken: string;
      videoUrl: string;
      description: string;
      title: string;
    }) {
      const startUrl = appendQuery(`${graphRoot}/me/video_reels`, { upload_phase: "start" });
      const start = await requestJson(fetcher, startUrl, {
        method: "POST",
        headers: authHeaders(input.pageAccessToken),
      });
      const videoId = typeof start.video_id === "string" ? start.video_id : "";
      const uploadUrl = typeof start.upload_url === "string" ? start.upload_url : "";
      if (!videoId || !uploadUrl) {
        throw new MetaApiError("Meta API did not return a Facebook Reel upload session.", { retryable: false, status: 502 });
      }

      await requestJson(fetcher, uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `OAuth ${input.pageAccessToken}`,
          file_url: input.videoUrl,
        },
      });

      const finishUrl = appendQuery(`${graphRoot}/me/video_reels`, {
        video_id: videoId,
        upload_phase: "finish",
        video_state: "PUBLISHED",
        description: input.description,
        title: input.title,
      });
      await requestJson(fetcher, finishUrl, {
        method: "POST",
        headers: authHeaders(input.pageAccessToken),
      });
      return videoId;
    },
  };
}
