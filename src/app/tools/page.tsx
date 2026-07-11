import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import CinematicHero from "@/components/platform/CinematicHero";
import SectionReveal from "@/components/platform/SectionReveal";
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
    "Use live Web Growth tools for website audits, AdSense readiness, SEO checks, launch planning, and conversion-focused website reviews.",
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
      <CinematicHero
        eyebrow="Tools laboratory"
        title={<>Small utilities. <span className="text-accent-gold">Sharper decisions.</span></>}
        description="Focused tools for website reviews, AdSense readiness, SEO planning, launch QA, and conversion support. Built to be useful before you hire anyone."
        pageType="tools_hub"
        variant="utility"
        primaryAction={{ label: "Open the tool library", href: "#tool-library", ctaName: "open_tool_library", destination: "tool_library" }}
        secondaryAction={{ label: "Explore the Academy", href: "/blog/", ctaName: "explore_academy", destination: "academy" }}
        aside={
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border-hairline bg-[#080b0f] p-6 font-mono text-xs text-text-muted shadow-2xl">
            <div className="mb-6 flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-accent-gold" /><span className="h-2.5 w-2.5 rounded-full bg-accent-teal" /><span className="h-2.5 w-2.5 rounded-full bg-border-hairline" /></div>
            <p className="text-accent-teal">webgrowth.tools / inventory</p>
            <div className="mt-5 space-y-3">
              {PUBLIC_TOOLS.slice(0, 4).map((tool, index) => <p key={tool.slug}><span className="mr-3 text-accent-gold">0{index + 1}</span>{tool.title}</p>)}
            </div>
            <p className="mt-6 border-t border-border-hairline pt-4 text-text-primary">{PUBLIC_TOOLS.length} utilities online</p>
          </div>
        }
      />

      <SectionShell id="tool-library" tone="white" spacing="compact">
        <SectionReveal className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
          {PUBLIC_TOOLS.map((tool, index) => {
            const matched = plannedTools.find((item) => item.title === tool.title);

            return (
            <TrackedLink
              key={tool.title}
              href={`/tools/${tool.slug}/`}
              ctaName={`open_${tool.slug}`}
              ctaLocation="tools_library"
              destination={`/tools/${tool.slug}/`}
              pageType="tools_hub"
              className={[
                "rounded-[1.45rem] border border-slate-200 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_38px_rgba(27,110,99,0.12)] md:col-span-1",
                index === 0 ? "xl:col-span-7" : index === 1 ? "xl:col-span-5" : "xl:col-span-4",
              ].join(" ")}
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
            </TrackedLink>
          )})}
        </SectionReveal>
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
