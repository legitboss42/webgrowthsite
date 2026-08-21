import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TikTok Scheduler | Web Growth",
  description: "Review, approve, and schedule original TikTok content.",
  robots: { index: false, follow: false },
};

export default function SchedulerLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#080b0c] text-[#f4f1e8]">
    <header className="border-b border-white/10 bg-[#080b0c]/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/scheduler/" className="font-serif text-xl tracking-tight">Web Growth <span className="text-[#62f5e6]">/ Scheduler</span></Link>
        <nav aria-label="Scheduler" className="flex gap-4 text-sm text-white/70">
          <Link href="/scheduler/dashboard/">Dashboard</Link><Link href="/scheduler/new/">New post</Link><Link href="/scheduler/settings/">Settings</Link>
        </nav>
      </div>
    </header>{children}
  </div>;
}
