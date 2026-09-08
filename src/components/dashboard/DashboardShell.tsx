import Link from "next/link";
import type { ReactNode } from "react";
import type { WebGrowthSession } from "@/lib/webGrowthSession";

const nav = [
  { href: "/dashboard/", label: "Overview" },
  { href: "/dashboard/content/", label: "Content Automation" },
  { href: "/dashboard/tiktok/", label: "TikTok Publishing" },
  { href: "/dashboard/whatsapp/", label: "WhatsApp Business" },
  { href: "/dashboard/media/", label: "Media Library" },
  { href: "/dashboard/connections/", label: "Connections" },
  { href: "/dashboard/settings/", label: "Settings" },
];

export default function DashboardShell({ session, children }: { session: WebGrowthSession; children: ReactNode }) {
  const identity = session.fullName || session.email || "Web Growth account";
  return (
    <div className="min-h-screen bg-[#070a0c] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1800px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-[#0b1013] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r" aria-label="Automation dashboard navigation">
          <div className="flex items-center justify-between gap-4 px-5 py-5 lg:block lg:px-6 lg:py-7">
            <Link href="/dashboard/" className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300">
              <span className="block text-xs font-bold uppercase tracking-[.22em] text-emerald-300">Web Growth</span>
              <span className="mt-1 block text-lg font-semibold">Automation</span>
            </Link>
            <div className="text-right text-xs text-white/50 lg:mt-7 lg:text-left">
              <span className="block max-w-40 truncate text-white/75">{identity}</span>
              <span className="mt-1 block capitalize">{session.provider} session</span>
            </div>
          </div>
          <nav className="overflow-x-auto px-4 pb-4 lg:overflow-visible lg:px-3" aria-label="Modules">
            <ul className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden px-6 pb-6 pt-4 text-xs leading-5 text-white/35 lg:block">
            One account. Separate engines. Shared control plane.
          </div>
        </aside>
        <div className="min-w-0">
          <header className="flex min-h-16 items-center justify-between border-b border-white/10 bg-[#070a0c]/95 px-5 backdrop-blur sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-white/45">Automation Dashboard</p>
            <form action="/api/auth/logout/" method="post">
              <button className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">Sign out</button>
            </form>
          </header>
          <div className="px-5 py-7 sm:px-7 lg:px-9 lg:py-9">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function DashboardHeading({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-300">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>{description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">{description}</p> : null}</div>{actions}</div>;
}

export function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/45">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p>{hint ? <p className="mt-2 text-xs leading-5 text-white/40">{hint}</p> : null}</div>;
}

export function ModuleCard({ href, title, description, status }: { href: string; title: string; description: string; status?: string }) {
  return <Link href={href} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-emerald-300/30 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-emerald-300"><div className="flex items-start justify-between gap-4"><h2 className="font-semibold text-white">{title}</h2>{status ? <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/55">{status}</span> : null}</div><p className="mt-3 text-sm leading-6 text-white/50">{description}</p><span className="mt-5 inline-block text-xs font-semibold text-emerald-300">Open module →</span></Link>;
}
