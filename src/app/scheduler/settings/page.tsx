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
      <h1 className="mt-3 font-serif text-4xl">Publishing and account controls</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
        Manage TikTok access separately from your Web Growth scheduler account. Disconnecting is reversible; deleting
        the account is not.
      </p>

      <section
        aria-labelledby="publishing-connection-heading"
        className="mt-9 rounded-3xl border border-white/10 bg-white/[0.025] p-6"
      >
        <h2 id="publishing-connection-heading" className="font-serif text-2xl text-white">
          TikTok publishing connection
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Disconnecting removes the encrypted TikTok connection and safely cancels future work that has not been
          submitted. It keeps your scheduler account and history, and it does not remove posts from TikTok.
        </p>
        <div className="mt-5 space-y-4">
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
                TikTok login is connected. Fully automatic Direct Post requires TikTok Content Posting API approval for
                the <code className="rounded bg-black/30 px-1.5 py-0.5 text-[#62f5e6]">video.publish</code> scope before
                this button can be enabled.
              </p>
              <p className="mt-3 text-xs text-white/45">
                After TikTok approves the app for Direct Post, set{" "}
                <code className="rounded bg-black/30 px-1.5 py-0.5">TIKTOK_DIRECT_POST_ENABLED=true</code> in production.
              </p>
            </div>
          )}
          <form action="/api/scheduler/disconnect/" method="post">
            <button className="rounded-full border border-[#ffb454]/50 px-5 py-3 font-bold text-[#ffd08a] transition hover:border-[#ffb454] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffb454]">
              Disconnect TikTok publishing
            </button>
          </form>
        </div>
      </section>

      <section aria-labelledby="scheduler-session-heading" className="mt-5 rounded-3xl border border-white/10 p-6">
        <h2 id="scheduler-session-heading" className="font-serif text-2xl text-white">Scheduler session</h2>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Sign out on this device without changing your connection or saved history.
        </p>
        <form action="/api/scheduler/auth/sign-out/" method="post">
          <button className="mt-4 text-sm font-bold text-white/70 underline decoration-white/30 underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            Sign out of scheduler
          </button>
        </form>
      </section>

      <section
        aria-labelledby="delete-account-heading"
        className="mt-8 rounded-3xl border border-[#ff5269]/40 bg-[#ff5269]/[0.055] p-6"
      >
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#ff8b9a]">Danger zone</p>
        <h2 id="delete-account-heading" className="mt-2 font-serif text-2xl text-white">
          Delete scheduler account
        </h2>
        <p id="account-deletion-help" className="mt-3 text-sm leading-6 text-white/70">
          This signs you out, removes the encrypted TikTok connection, stops safe future work, and queues permanent
          deletion of your scheduler media and account records. Published TikTok posts are not deleted from TikTok.
          Type <strong className="font-bold text-white">DELETE MY SCHEDULER ACCOUNT</strong> exactly to continue.
        </p>
        <form action="/api/scheduler/account/delete/" method="post" className="mt-5">
          <label htmlFor="account-deletion-confirmation" className="block text-sm font-bold text-white">
            Account deletion confirmation
          </label>
          <input
            id="account-deletion-confirmation"
            name="confirmation"
            type="text"
            required
            pattern="DELETE MY SCHEDULER ACCOUNT"
            autoComplete="off"
            spellCheck={false}
            aria-describedby="account-deletion-help"
            className="mt-2 w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#ff5269] focus:ring-2 focus:ring-[#ff5269]/30"
            placeholder="DELETE MY SCHEDULER ACCOUNT"
          />
          <button className="mt-4 rounded-full bg-[#ff5269] px-5 py-3 font-bold text-white transition hover:bg-[#ff6b7e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff8b9a]">
            Permanently delete scheduler account
          </button>
        </form>
      </section>
    </main>
  );
}
