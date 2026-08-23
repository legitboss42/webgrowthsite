import type { Metadata } from "next";
import Link from "next/link";
import { getSchedulerLaunchState } from "@/lib/scheduler/launch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in to Scheduler | Web Growth",
  description: "TikTok Login Kit is the only sign-in path for the Web Growth creator scheduler.",
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  const launch = getSchedulerLaunchState();

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:py-24" aria-labelledby="sign-in-title">
      <div className="border-l border-[#62f5e6]/60 pl-5 sm:pl-7">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#62f5e6]">Creator access</p>
        <h1 id="sign-in-title" className="mt-5 font-serif text-5xl leading-none sm:text-6xl">Enter through TikTok.</h1>
        <p className="mt-6 max-w-xl text-base leading-8 text-white/70">
          TikTok Login Kit is the only way to authenticate with this scheduler. Publishing permission is separate, and you can disconnect the connection from your account settings when that control is available.
        </p>
        {launch.publicEnrollment ? (
          <Link
            href="/api/scheduler/auth/authorize/?mode=login&returnTo=/scheduler/dashboard/"
            className="mt-9 inline-flex rounded-full bg-[#62f5e6] px-7 py-3 font-bold text-[#071111] transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#62f5e6]"
          >
            Continue with TikTok
          </Link>
        ) : (
          <div className="mt-9 max-w-xl rounded-2xl border border-[#ff5269]/35 bg-[#ff5269]/[0.06] p-5" role="status">
            <p className="font-medium text-white">TikTok access opening after approval</p>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Public creator enrollment is not available yet. This page does not start an OAuth flow while the access gate is closed.
            </p>
          </div>
        )}
        <p className="mt-8 text-sm leading-6 text-white/55">
          By continuing when access is open, you will be asked to accept the current <Link className="text-white underline decoration-[#62f5e6]/60 underline-offset-4 hover:text-[#d6fffa]" href="/scheduler/terms/">Scheduler Terms and Privacy summary</Link> before creating or scheduling content.
        </p>
      </div>
    </section>
  );
}
