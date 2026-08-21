import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSchedulerConfig } from "@/lib/scheduler/config";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";

export default async function SettingsPage() {
  const jar = await cookies();
  const session = readSchedulerSession(jar.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) redirect("/scheduler/sign-in/");

  const config = getSchedulerConfig();

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-[.25em] text-[#62f5e6]">Account</p>
      <h1 className="mt-3 font-serif text-4xl">Connection controls</h1>
      <div className="mt-9 space-y-4 rounded-3xl border border-white/10 p-6">
        {config.directPostEnabled ? (
          <a
            href="/api/scheduler/auth/authorize/?mode=publishing&returnTo=/scheduler/settings/"
            className="inline-flex rounded-full bg-[#62f5e6] px-5 py-3 font-bold text-black"
          >
            Connect Direct Post
          </a>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-bold text-white">Direct Post approval needed</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              TikTok login is connected. Fully automatic Direct Post requires TikTok Content Posting API approval for the{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5 text-[#62f5e6]">video.publish</code> scope before this
              button can be enabled.
            </p>
            <p className="mt-3 text-xs text-white/45">
              After TikTok approves the app for Direct Post, set{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5">TIKTOK_DIRECT_POST_ENABLED=true</code> in production.
            </p>
          </div>
        )}
        <form action="/api/scheduler/disconnect/" method="post">
          <button className="rounded-full border border-[#ff5269]/60 px-5 py-3 text-[#ff8b9a]">
            Disconnect TikTok publishing
          </button>
        </form>
        <form action="/api/scheduler/auth/sign-out/" method="post">
          <button className="text-sm text-white/55 underline">Sign out of scheduler</button>
        </form>
      </div>
    </main>
  );
}
