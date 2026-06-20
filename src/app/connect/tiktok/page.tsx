import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  clearTikTokConnection,
  lockInternalWorkflow,
  unlockInternalWorkflow,
} from "./actions";
import { readInternalWorkflowCookie, getInternalWorkflowCookieName, isInternalWorkflowConfigured } from "@/lib/internalWorkflowAuth";
import { getPublicPosts } from "@/lib/posts";
import { buildPageMetadata } from "@/lib/seo";
import {
  getTikTokAuthorizePath,
  getTikTokConnectionCookieName,
  getTikTokRedirectUri,
  getTikTokRequiredScopes,
  getTikTokTokenCookieName,
  isTikTokConfigured,
  maskOpenId,
  normalizeTikTokScopeMode,
  readTikTokConnectionCookie,
  readTikTokTokenCookie,
} from "@/lib/tiktok";
import { buildTikTokWorkflowBrief } from "@/lib/tiktokPublishing";

const pageDescription =
  "Internal TikTok Login Kit and Content Posting API connection page for the Web Growth publishing workflow.";

export const metadata: Metadata = buildPageMetadata({
  title: "TikTok Connection",
  description: pageDescription,
  path: "/connect/tiktok",
  noIndex: true,
});

type TikTokConnectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined, maxLength = 240) {
  if (!value) return "";
  return decodeURIComponent(Array.isArray(value) ? value[0] || "" : value).slice(0, maxLength);
}

function parseGrantedScopes(scopeValue?: string) {
  return (scopeValue || "")
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusTone(status: string, publishingGranted: boolean, scopeMode: "login" | "publishing") {
  if (status === "connected" && scopeMode === "publishing" && !publishingGranted) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  }
  if (status === "connected" || status === "cleared") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  }
  if (status === "error") return "border-rose-500/30 bg-rose-500/10 text-rose-100";
  if (status === "config-missing") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return "border-white/10 bg-white/5 text-white/80";
}

function getWorkflowTone(workflowStatus: string) {
  if (workflowStatus === "invalid") return "border-rose-500/30 bg-rose-500/10 text-rose-100";
  if (workflowStatus === "ready") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  if (workflowStatus === "locked") return "border-white/10 bg-white/5 text-white/80";
  if (workflowStatus === "config-missing") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return "border-white/10 bg-white/5 text-white/80";
}

function getWorkflowMessage(workflowStatus: string, unlocked: boolean) {
  if (workflowStatus === "invalid") return "The internal workflow passphrase did not match the server secret.";
  if (workflowStatus === "ready") return "Internal workflow unlocked for this browser session.";
  if (workflowStatus === "locked") return "Internal workflow session cleared.";
  if (workflowStatus === "config-missing") {
    return "Add INTERNAL_WORKFLOW_SECRET on the server before using the protected publishing panel.";
  }
  return unlocked
    ? "Protected publishing tools are available in this browser session."
    : "Unlock the protected panel to review article briefs and future publishing actions.";
}

export default async function TikTokConnectPage({ searchParams }: TikTokConnectPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = readParam(resolvedSearchParams.status, 48);
  const message = readParam(resolvedSearchParams.message);
  const workflowStatus = readParam(resolvedSearchParams.workflow, 48);
  const requestedArticleSlug = readParam(resolvedSearchParams.article, 120);
  const cookieStore = await cookies();

  const connection = readTikTokConnectionCookie(
    cookieStore.get(getTikTokConnectionCookieName())?.value
  );
  const tokenRecord = readTikTokTokenCookie(
    cookieStore.get(getTikTokTokenCookieName())?.value
  );
  const workflowSession = readInternalWorkflowCookie(
    cookieStore.get(getInternalWorkflowCookieName())?.value
  );
  const unlocked = Boolean(workflowSession);

  const configured = isTikTokConfigured();
  const workflowConfigured = isInternalWorkflowConfigured();
  const scopeMode = normalizeTikTokScopeMode(readParam(resolvedSearchParams.mode, 24));
  const redirectUri = getTikTokRedirectUri();
  const requiredScopes = getTikTokRequiredScopes(scopeMode);
  const grantedScopes = parseGrantedScopes(connection?.scope || tokenRecord?.scope);
  const publishingGranted = grantedScopes.includes("video.upload");
  const loginGranted = grantedScopes.includes("user.info.basic");
  const hasTokenCookie = Boolean(tokenRecord?.accessToken && tokenRecord?.refreshToken);
  const statusTone = getStatusTone(status, publishingGranted, scopeMode);
  const workflowTone = getWorkflowTone(workflowStatus);
  const workflowMessage = getWorkflowMessage(workflowStatus, unlocked);
  const statusHeading =
    status === "connected"
      ? scopeMode === "publishing"
        ? publishingGranted
          ? "TikTok publishing scope granted."
          : "TikTok returned to the site, but publishing scope is still missing."
        : loginGranted
          ? "TikTok login authorization completed."
          : "TikTok returned to the site, but the base login scope is missing."
      : status === "error"
        ? "TikTok authorization returned an error."
        : status === "config-missing"
          ? "Server credentials still need to be configured."
          : status === "cleared"
            ? "Saved TikTok connection cookies were cleared from this browser."
            : "Ready to start the TikTok connection flow.";

  const publicPosts = unlocked ? getPublicPosts() : [];
  const selectedPost =
    publicPosts.find((post) => post.slug === requestedArticleSlug) || publicPosts[0];
  const workflowBrief = selectedPost ? buildTikTokWorkflowBrief(selectedPost) : null;

  return (
    <main className="bg-[#050806] text-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.95fr]">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              Internal workflow
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
                Connect TikTok for the Web Growth publishing workflow
              </h1>
              <p className="max-w-3xl text-lg text-white/70">
                This route handles TikTok Login Kit, Content Posting API access, and the
                internal article selection panel. It stays noindex and is meant only for
                Web Growth publishing ops.
              </p>
            </div>

            <div className={`rounded-2xl border p-5 ${statusTone}`}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                Connection status
              </p>
              <p className="mt-3 text-lg font-medium">{statusHeading}</p>
              {message ? <p className="mt-2 text-sm text-white/75">{message}</p> : null}
              {connection ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                      Connected account
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {maskOpenId(connection.openId)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                      Last callback
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {formatDate(connection.connectedAt)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                      Granted scopes
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {grantedScopes.length ? grantedScopes.join(", ") : "None returned"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                      Publishing access
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {publishingGranted ? "Granted" : "Not granted yet"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                      Token storage
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {hasTokenCookie ? "Encrypted browser cookie" : "Summary only"}
                    </p>
                  </div>
                </div>
              ) : null}
              {tokenRecord ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                      Access token expires
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {formatDate(tokenRecord.expiresAt)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                      Refresh window ends
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {formatDate(tokenRecord.refreshExpiresAt)}
                    </p>
                  </div>
                </div>
              ) : null}
              {status === "connected" && scopeMode === "publishing" && !publishingGranted ? (
                <p className="mt-4 text-sm text-white/75">
                  TikTok redirected back successfully, but the returned scope set still does not
                  include <code className="rounded bg-black/30 px-2 py-1">video.upload</code>.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={
                  configured
                    ? `${getTikTokAuthorizePath()}?returnTo=/connect/tiktok/&mode=login`
                    : "/connect/tiktok/?status=config-missing"
                }
                className={`inline-flex items-center justify-center rounded-md px-6 py-4 text-sm font-semibold transition ${
                  configured
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "cursor-not-allowed bg-white/10 text-white/50"
                }`}
                aria-disabled={!configured}
              >
                Start TikTok login authorization
              </Link>
              <Link
                href={
                  configured
                    ? `${getTikTokAuthorizePath()}?returnTo=/connect/tiktok/&mode=publishing`
                    : "/connect/tiktok/?status=config-missing"
                }
                className={`inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition ${
                  configured ? "hover:bg-white/10" : "cursor-not-allowed opacity-50"
                }`}
                aria-disabled={!configured}
              >
                Request publishing scope
              </Link>
              {connection ? (
                <form action={clearTikTokConnection}>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Clear saved connection
                  </button>
                </form>
              ) : null}
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back home
              </Link>
            </div>

            <div className={`rounded-2xl border p-5 ${workflowTone}`}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                Protected publishing panel
              </p>
              <p className="mt-3 text-lg font-medium">{workflowMessage}</p>
              <p className="mt-2 text-sm text-white/75">
                This panel is intentionally separate from the public site. It is for
                article review, caption planning, and later publishing actions.
              </p>

              {!workflowConfigured ? (
                <p className="mt-4 text-sm text-white/75">
                  Add <code className="rounded bg-black/30 px-2 py-1">INTERNAL_WORKFLOW_SECRET</code>
                  {" "}to unlock this section securely.
                </p>
              ) : unlocked ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
                    Browser session unlocked
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
                    {hasTokenCookie
                      ? "TikTok tokens available to server actions in this browser"
                      : "TikTok tokens not available yet in this browser"}
                  </div>
                  <form action={lockInternalWorkflow}>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Lock panel
                    </button>
                  </form>
                </div>
              ) : (
                <form action={unlockInternalWorkflow} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-white">Internal workflow passphrase</span>
                    <input
                      type="password"
                      name="passphrase"
                      required
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-white/35"
                      placeholder="Enter the internal workflow secret"
                    />
                  </label>
                  <button
                    type="submit"
                    className="mt-7 inline-flex items-center justify-center rounded-md bg-emerald-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Unlock panel
                  </button>
                </form>
              )}
            </div>

            {unlocked ? (
              <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Article publishing workspace</h2>
                    <p className="mt-2 max-w-3xl text-sm text-white/70">
                      Pick an approved article to review its keyword intent, TikTok-ready
                      framing, and content depth before we add live publishing actions.
                    </p>
                  </div>
                  {publicPosts.length ? (
                    <form className="grid gap-3 sm:grid-cols-[minmax(0,320px)_auto]">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-white">Approved article</span>
                        <select
                          name="article"
                          defaultValue={selectedPost?.slug}
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                        >
                          {publicPosts.map((post) => (
                            <option key={post.slug} value={post.slug}>
                              {post.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="submit"
                        className="mt-7 inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Load article brief
                      </button>
                    </form>
                  ) : null}
                </div>

                {selectedPost && workflowBrief ? (
                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                          Selected article
                        </p>
                        <h3 className="mt-3 text-2xl font-semibold">{selectedPost.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-white/72">{selectedPost.excerpt}</p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                            Primary keyword
                          </p>
                          <p className="mt-2 text-sm font-medium text-white">
                            {selectedPost.primaryKeyword || "Missing"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                            Search intent
                          </p>
                          <p className="mt-2 text-sm font-medium text-white">
                            {selectedPost.searchIntent || "Missing"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                            Internal links
                          </p>
                          <p className="mt-2 text-sm font-medium text-white">
                            {workflowBrief.internalLinkCount}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                            FAQ entries
                          </p>
                          <p className="mt-2 text-sm font-medium text-white">
                            {selectedPost.faq.length}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-5 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <p className="text-sm font-semibold text-white">Quick editorial checks</p>
                          <ul className="mt-3 space-y-2 text-sm text-white/72">
                            <li>Updated: {selectedPost.updatedAt || selectedPost.lastReviewedAt || "Needs review date"}</li>
                            <li>Author: {selectedPost.author || "Missing"}</li>
                            <li>Reviewer: {selectedPost.reviewedBy || "Missing"}</li>
                            <li>Cover alt: {selectedPost.coverAlt || "Missing"}</li>
                            <li>Related guides: {selectedPost.relatedGuideSlugs.length}</li>
                          </ul>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <p className="text-sm font-semibold text-white">Publishing readiness</p>
                          <ul className="mt-3 space-y-2 text-sm text-white/72">
                            <li>{publishingGranted ? "TikTok publishing scope is present." : "Publishing scope is still missing."}</li>
                            <li>{hasTokenCookie ? "Encrypted TikTok token cookie is available." : "No saved token payload for server-side publishing yet."}</li>
                            <li>{workflowBrief.internalLinkCount >= 3 ? "Internal linking floor is met." : "Add more contextual internal links before distribution."}</li>
                            <li>{selectedPost.primaryKeyword && selectedPost.searchIntent ? "SEO intent fields are present." : "SEO intent fields need completion."}</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                          TikTok draft brief
                        </p>
                        <h3 className="mt-3 text-2xl font-semibold">{workflowBrief.headline}</h3>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-sm font-semibold text-white">Suggested caption</p>
                        <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">
                          {workflowBrief.caption}
                        </pre>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-sm font-semibold text-white">Talking points</p>
                        <ol className="mt-3 space-y-2 text-sm text-white/75">
                          {workflowBrief.talkingPoints.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ol>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-sm font-semibold text-white">Carousel sequence</p>
                        <ol className="mt-3 space-y-2 text-sm text-white/75">
                          {workflowBrief.carouselSlides.map((slide, index) => (
                            <li key={`${slide}-${index}`}>Slide {index + 1}: {slide}</li>
                          ))}
                        </ol>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-sm font-semibold text-white">Short-form video beats</p>
                        <ol className="mt-3 space-y-2 text-sm text-white/75">
                          {workflowBrief.videoShots.map((shot) => (
                            <li key={shot}>{shot}</li>
                          ))}
                        </ol>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-sm font-semibold text-white">Hashtag starter set</p>
                        <p className="mt-3 text-sm text-white/75">
                          {workflowBrief.hashtags.join(" ")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/72">
                    No approved article is available for the publishing workspace yet.
                  </p>
                )}

                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
                  Current limitation: TikTok access and refresh tokens are stored as encrypted
                  <code className="mx-1 rounded bg-black/30 px-2 py-1">httpOnly</code> browser
                  cookies for this session. That is enough for protected in-browser publishing
                  tools, but full background automation after article publish will still need a
                  shared server-side token store.
                </div>
              </section>
            ) : null}
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">TikTok app settings to mirror</h2>
            <div className="mt-6 space-y-5 text-sm text-white/75">
              <div>
                <p className="font-semibold text-white">Redirect URI</p>
                <p className="mt-2 break-all rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white/80">
                  {redirectUri}
                </p>
              </div>
              <div>
                <p className="font-semibold text-white">Authorization mode</p>
                <p className="mt-2 text-white/70">
                  {scopeMode === "publishing"
                    ? "Publishing mode requests TikTok draft upload access after basic login works."
                    : "Login mode requests the minimum TikTok profile scope first so the callback flow can be verified cleanly."}
                </p>
              </div>
              <div>
                <p className="font-semibold text-white">Required scopes</p>
                <ul className="mt-2 space-y-2">
                  {requiredScopes.map((scope) => (
                    <li
                      key={scope}
                      className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      {scope}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white">Products</p>
                <ul className="mt-2 space-y-2">
                  <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    Login Kit
                  </li>
                  <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    Content Posting API
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white">Server configuration</p>
                <p className="mt-2 text-white/70">
                  This flow expects <code className="rounded bg-black/30 px-2 py-1">TIKTOK_CLIENT_KEY</code>,{" "}
                  <code className="rounded bg-black/30 px-2 py-1">TIKTOK_CLIENT_SECRET</code>,{" "}
                  <code className="rounded bg-black/30 px-2 py-1">TIKTOK_REDIRECT_URI</code>, and
                  an internal unlock secret if you want the protected article workspace.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
