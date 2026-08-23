import type { Metadata } from "next";
import Link from "next/link";
import { getSchedulerLaunchState } from "@/lib/scheduler/launch";

export const metadata: Metadata = {
  title: "TikTok Scheduler | Web Growth",
  description: "Review, approve, and schedule original TikTok content.",
  robots: { index: false, follow: false },
};

export default function SchedulerLayout({ children }: { children: React.ReactNode }) {
  const launch = getSchedulerLaunchState();

  return (
    <div className="min-h-screen bg-[#080b0c] text-[#f4f1e8]">
      <header className="border-b border-white/10 bg-[#080b0c]/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4">
          <Link href="/scheduler/" className="font-serif text-xl tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#62f5e6]">
            Web Growth <span className="text-[#62f5e6]">/ Scheduler</span>
          </Link>
          <nav aria-label="Scheduler" className="flex items-center gap-4 text-sm text-white/70 sm:gap-5">
            <Link className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#62f5e6]" href="/scheduler/">Overview</Link>
            <Link className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#62f5e6]" href="/scheduler/terms/">Terms</Link>
            {launch.publicEnrollment ? (
              <Link className="text-[#d6fffa] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#62f5e6]" href="/scheduler/sign-in/">Sign in</Link>
            ) : null}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
