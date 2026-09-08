import type { Metadata } from "next";
import Link from "next/link";
import { getSchedulerLaunchState } from "@/lib/scheduler/launch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TikTok Publishing Sign in | Web Growth",
  description: "Use the shared Web Growth account for TikTok Publishing, with legacy TikTok creator access retained during migration.",
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  const launch = getSchedulerLaunchState();
  return <section className="mx-auto max-w-2xl px-5 py-16 sm:py-24" aria-labelledby="sign-in-title"><div className="border-l border-[#62f5e6]/60 pl-5 sm:pl-7"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#62f5e6]">TikTok Publishing</p><h1 id="sign-in-title" className="mt-5 font-serif text-5xl leading-none sm:text-6xl">Use your Web Growth account.</h1><p className="mt-6 max-w-xl text-base leading-8 text-white/70">The scheduler is now part of the unified Web Growth Automation dashboard. Sign in once, then connect or refresh TikTok from Connections.</p><Link href="/sign-in/?next=/dashboard/tiktok/" className="mt-9 inline-flex rounded-full bg-[#62f5e6] px-7 py-3 font-bold text-[#071111]">Sign in to Web Growth</Link>{launch.publicEnrollment ? <div className="mt-8 rounded-2xl border border-white/10 p-5"><p className="text-sm font-semibold">Legacy creator access</p><p className="mt-2 text-sm leading-6 text-white/55">Public creators can still enter through TikTok while the account migration remains compatible.</p><Link href="/api/scheduler/auth/authorize/?mode=login&returnTo=/dashboard/tiktok/" className="mt-4 inline-flex text-sm font-semibold text-[#62f5e6]">Continue with TikTok →</Link></div> : null}<p className="mt-8 text-sm leading-6 text-white/55">Publishing consent remains separate from account sign-in. Review the <Link className="text-white underline decoration-[#62f5e6]/60 underline-offset-4" href="/scheduler/terms/">Scheduler Terms and Privacy summary</Link> before publishing.</p></div></section>;
}
