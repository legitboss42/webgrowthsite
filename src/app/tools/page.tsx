import Link from "next/link";
import {
  AuditIcon,
  GrowthChartIcon,
  IconBadge,
  LightbulbIcon,
  SearchIcon,
  SitemapIcon,
  TagIcon,
} from "@/components/home/HomeIcons";
import SectionShell from "@/components/home/SectionShell";
import { buildPageMetadata } from "@/lib/seo";
import { PUBLIC_TOOLS } from "@/lib/tools";

const plannedTools = [
  {
    title: "AdSense Readiness Checker",
    description:
      "Review trust pages, content quality, navigation, and layout risks before applying for AdSense.",
    icon: <AuditIcon />,
  },
  {
    title: "Website Cost Calculator",
    description:
      "Estimate likely project scope based on page count, platform complexity, and conversion requirements.",
    icon: <GrowthChartIcon />,
  },
  {
    title: "Homepage Checklist",
    description:
      "Use a practical checklist for messaging clarity, trust cues, CTA flow, and layout quality.",
    icon: <LightbulbIcon />,
  },
  {
    title: "Meta Description Generator",
    description:
      "Generate cleaner search snippets for service pages, articles, and landing pages.",
    icon: <TagIcon />,
  },
  {
    title: "Sitemap Validator",
    description:
      "Check sitemap structure, indexation intent, and route governance consistency.",
    icon: <SitemapIcon />,
  },
  {
    title: "Website Launch Checklist",
    description:
      "Run a final QA pass for SEO, metadata, mobile UX, forms, analytics, and trust pages.",
    icon: <SearchIcon />,
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Web Growth Tools | Practical Website Growth Utilities",
  description:
    "Explore the upcoming Web Growth tools hub for website audits, AdSense readiness, SEO checks, and launch planning.",
  path: "/tools/",
  keywords: [
    "website growth tools",
    "adsense readiness checker",
    "seo website tools",
    "website cost calculator",
    "homepage checklist tool",
    "website launch checklist",
  ],
});

export default function ToolsPage() {
  return (
    <main className="bg-[#f7f8fc] text-slate-950">
      <SectionShell tone="canvas" spacing="hero" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
          <div className="absolute left-[-10%] top-[-6%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.12),transparent_70%)]" />
          <div className="absolute right-[-8%] top-[4%] h-[25rem] w-[25rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.12),transparent_70%)]" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-blue-100 bg-white/92 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700 shadow-sm">
              Tools
            </p>
            <h1 className="mt-5 max-w-[34rem] text-balance text-[3.9rem] font-semibold leading-[0.9] tracking-[-0.07em] text-slate-950 md:text-[5rem]">
              Practical website growth tools built around real implementation.
            </h1>
            <p className="mt-4 max-w-[33rem] text-lg leading-8 text-slate-600">
              Use focused utilities for website reviews, AdSense readiness, SEO planning,
              launch QA, and conversion support. The first tool set is live now.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/blog/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3557ff_0%,#4f6bff_45%,#7c5cff_100%)] px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,107,255,0.28)] transition hover:brightness-105"
              >
                Explore the Academy
              </Link>
              <Link
                href="/contact/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-white px-6 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50"
              >
                Request a Website Review
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {PUBLIC_TOOLS.slice(0, 4).map((tool) => (
              <Link
                key={tool.title}
                href={`/tools/${tool.slug}/`}
                className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(79,107,255,0.10)]"
              >
                <IconBadge tone="blue" className="h-11 w-11 rounded-[1rem]">
                  {
                    plannedTools.find((item) => item.title === tool.title)?.icon ?? <AuditIcon />
                  }
                </IconBadge>
                <h2 className="mt-5 text-[1.25rem] font-semibold tracking-[-0.03em] text-slate-950">
                  {tool.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{tool.description}</p>
                <p className="mt-5 text-sm font-semibold text-blue-700">Open tool -&gt;</p>
              </Link>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell tone="white" spacing="compact">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PUBLIC_TOOLS.map((tool) => {
            const matched = plannedTools.find((item) => item.title === tool.title);

            return (
            <Link
              key={tool.title}
              href={`/tools/${tool.slug}/`}
              className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_38px_rgba(79,107,255,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <IconBadge tone="blue" className="h-11 w-11 rounded-[1rem]">
                  {matched?.icon ?? <AuditIcon />}
                </IconBadge>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Live
                </span>
              </div>
              <h2 className="mt-5 text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
                {tool.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{tool.description}</p>
              <p className="mt-5 text-sm font-semibold text-blue-700">Use tool -&gt;</p>
            </Link>
          )})}
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="overflow-hidden rounded-[1.8rem] border border-blue-950/60 bg-[radial-gradient(circle_at_88%_14%,rgba(108,84,255,0.42),transparent_24%),linear-gradient(135deg,#091226_0%,#0c1631_48%,#0b1230_100%)] px-8 py-9 shadow-[0_26px_70px_rgba(6,14,35,0.28)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="max-w-2xl text-[2.2rem] font-semibold tracking-[-0.05em] text-white">
                The tools hub is now live and ready to expand.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-8 text-blue-100">
                Start with the tools, then move into a website review or Academy guide when you need deeper implementation help.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <Link
                href="/contact/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                Request a Website Review
              </Link>
              <Link
                href="/blog/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-transparent px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Open the Academy
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}
