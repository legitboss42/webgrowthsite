import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { buildPageMetadata } from "@/lib/seo";
import {
  getTikTokAuthorizePath,
  getTikTokConnectionCookieName,
  getTikTokRedirectUri,
  getTikTokRequiredScopes,
  isTikTokConfigured,
  maskOpenId,
  readTikTokConnectionCookie,
} from "@/lib/tiktok";

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

function readMessageParam(value: string | string[] | undefined) {
  if (!value) return "";
  return decodeURIComponent(Array.isArray(value) ? value[0] || "" : value).slice(0, 240);
}

function getStatusTone(status: string) {
  if (status === "connected") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  if (status === "error") return "border-rose-500/30 bg-rose-500/10 text-rose-100";
  if (status === "config-missing") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return "border-white/10 bg-white/5 text-white/80";
}

export default async function TikTokConnectPage({ searchParams }: TikTokConnectPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = Array.isArray(resolvedSearchParams.status)
    ? resolvedSearchParams.status[0] || ""
    : resolvedSearchParams.status || "";
  const message = readMessageParam(resolvedSearchParams.message);
  const cookieStore = await cookies();
  const connection = readTikTokConnectionCookie(
    cookieStore.get(getTikTokConnectionCookieName())?.value
  );
  const configured = isTikTokConfigured();
  const redirectUri = getTikTokRedirectUri();

  return (
    <main className="bg-[#050806] text-white">
      <section className="mx-auto max-w-5xl px-6 py-20">
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
                This utility route is for TikTok Login Kit authorization and the Content
                Posting API callback. It is not meant for public navigation or search.
              </p>
            </div>

            <div className={`rounded-2xl border p-5 ${getStatusTone(status)}`}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                Connection status
              </p>
              <p className="mt-3 text-lg font-medium">
                {status === "connected"
                  ? "TikTok authorization completed."
                  : status === "error"
                    ? "TikTok authorization returned an error."
                    : status === "config-missing"
                      ? "Server credentials still need to be configured."
                      : "Ready to start the TikTok connection flow."}
              </p>
              {message ? <p className="mt-2 text-sm text-white/75">{message}</p> : null}
              {connection ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                      {new Date(connection.connectedAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={
                  configured
                    ? `${getTikTokAuthorizePath()}?returnTo=/connect/tiktok/`
                    : "/connect/tiktok/?status=config-missing"
                }
                className={`inline-flex items-center justify-center rounded-md px-6 py-4 text-sm font-semibold transition ${
                  configured
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "cursor-not-allowed bg-white/10 text-white/50"
                }`}
                aria-disabled={!configured}
              >
                Start TikTok authorization
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back home
              </Link>
            </div>
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
                <p className="font-semibold text-white">Required scopes</p>
                <ul className="mt-2 space-y-2">
                  {getTikTokRequiredScopes().map((scope) => (
                    <li key={scope} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
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
                  <code className="rounded bg-black/30 px-2 py-1">TIKTOK_CLIENT_SECRET</code>, and optionally{" "}
                  <code className="rounded bg-black/30 px-2 py-1">TIKTOK_REDIRECT_URI</code>.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
