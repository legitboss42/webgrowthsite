import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolRenderer from "@/components/tools/ToolRenderer";
import SectionShell from "@/components/home/SectionShell";
import StructuredData from "@/components/StructuredData";
import { getPublicTool, PUBLIC_TOOLS } from "@/lib/tools";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";

const TOOL_SUPPORT_CONTENT: Record<
  string,
  {
    useCases: string[];
    services: Array<{ href: string; label: string; description: string }>;
    guides: Array<{ href: string; label: string }>;
  }
> = {
  "adsense-readiness-checker": {
    useCases: [
      "Review a content-heavy site before an AdSense application.",
      "Spot trust-page, thin-content, and layout risks before publishing more articles.",
      "Check whether monetization plans are crowding out content quality.",
    ],
    services: [
      {
        href: "/services/website-audit/",
        label: "Website Audit Service",
        description: "Use this when the site needs a real diagnosis across SEO, trust, UX, and conversion blockers.",
      },
      {
        href: "/services/search-engine-optimisation/",
        label: "SEO Service",
        description: "Move from readiness checks into crawl, snippet, and indexation improvements on revenue pages.",
      },
    ],
    guides: [
      { href: "/blog/small-business-website-seo-checklist/", label: "Small Business Website SEO Checklist" },
      { href: "/blog/website-launch-checklist-for-small-businesses/", label: "Website Launch Checklist for Small Businesses" },
    ],
  },
  "website-cost-calculator": {
    useCases: [
      "Estimate scope before requesting a redesign or new build.",
      "Compare whether the project is a landing page, business site, or broader platform build.",
      "Prepare budget context before discussing timelines and deliverables.",
    ],
    services: [
      {
        href: "/pricing/",
        label: "Pricing Guidance",
        description: "Review how Web Growth frames scope, investment range, and the right next step before kickoff.",
      },
      {
        href: "/services/business-website-design/",
        label: "Business Website Design",
        description: "Best for businesses that need clearer offer positioning, trust, and enquiry flow.",
      },
    ],
    guides: [
      { href: "/blog/how-to-build-a-small-business-website-that-converts/", label: "How to Build a Small Business Website That Converts" },
      { href: "/blog/high-converting-landing-pages-guide/", label: "High-Converting Landing Pages Guide" },
    ],
  },
  "homepage-checklist": {
    useCases: [
      "Audit a homepage before a launch, redesign, or paid-traffic push.",
      "Check whether the first screen explains the offer clearly enough to earn the next click.",
      "Find messaging, trust, and CTA gaps before deeper SEO work.",
    ],
    services: [
      {
        href: "/services/landing-page-design/",
        label: "Landing Page Design",
        description: "Use this when the page needs a sharper conversion path and stronger message match.",
      },
      {
        href: "/services/website-redesign/",
        label: "Website Redesign",
        description: "Best when homepage issues are part of a wider trust, UX, and positioning problem.",
      },
    ],
    guides: [
      { href: "/blog/homepage-structure-that-converts-visitors-into-customers/", label: "Homepage Structure That Converts Visitors Into Customers" },
      { href: "/blog/why-your-website-isnt-getting-leads/", label: "Why Your Website Isn't Getting Leads" },
    ],
  },
  "meta-description-generator": {
    useCases: [
      "Rewrite weak snippets on service pages that rank but do not earn clicks.",
      "Draft cleaner search snippets for blog posts, landing pages, and local pages.",
      "Tighten SERP messaging before rolling out metadata updates sitewide.",
    ],
    services: [
      {
        href: "/services/search-engine-optimisation/",
        label: "SEO Service",
        description: "Use this when metadata is only one part of a broader visibility and ranking problem.",
      },
      {
        href: "/services/website-audit/",
        label: "Website Audit Service",
        description: "Best when you need to diagnose why search traffic is weak before rewriting snippets.",
      },
    ],
    guides: [
      { href: "/blog/small-business-website-seo-checklist/", label: "Small Business Website SEO Checklist" },
      { href: "/blog/04-writing-service-pages-that-convert/", label: "Writing Service Pages That Convert" },
    ],
  },
  "sitemap-validator": {
    useCases: [
      "Check whether a sitemap only contains canonical, indexable URLs.",
      "Catch structural issues before submitting a sitemap to Search Console.",
      "Review whether route governance and sitemap output still match after launches.",
    ],
    services: [
      {
        href: "/services/search-engine-optimisation/",
        label: "SEO Service",
        description: "Use this when sitemap issues are part of a larger crawlability and indexation cleanup.",
      },
      {
        href: "/services/website-audit/",
        label: "Website Audit Service",
        description: "Start here when you need the bigger diagnosis across technical SEO, UX, and trust.",
      },
    ],
    guides: [
      { href: "/blog/03-seo-migration-without-losing-traffic/", label: "SEO Migration Without Losing Traffic" },
      { href: "/blog/small-business-website-seo-checklist/", label: "Small Business Website SEO Checklist" },
    ],
  },
  "website-launch-checklist": {
    useCases: [
      "Run a final QA pass before a redesign, migration, or new-site launch.",
      "Check whether forms, metadata, trust pages, and tracking are truly launch-ready.",
      "Reduce avoidable SEO and conversion regressions during go-live week.",
    ],
    services: [
      {
        href: "/services/website-audit/",
        label: "Website Audit Service",
        description: "Use this when launch risks overlap with wider clarity, trust, SEO, or conversion blockers.",
      },
      {
        href: "/services/website-maintenance/",
        label: "Website Maintenance",
        description: "Best for teams that need post-launch support, checks, and ongoing technical hygiene.",
      },
    ],
    guides: [
      { href: "/blog/website-launch-checklist-for-small-businesses/", label: "Website Launch Checklist for Small Businesses" },
      { href: "/blog/07-launch-week-checklist-and-first-7-days/", label: "Launch Week Checklist and First 7 Days" },
    ],
  },
};

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return PUBLIC_TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getPublicTool(slug);
  if (!tool) {
    return {
      title: "Tool not found",
      robots: { index: false, follow: false },
    };
  }

  return buildPageMetadata({
    title: `${tool.title} | Web Growth Tools`,
    description: tool.description,
    path: `/tools/${tool.slug}/`,
    keywords: tool.keywords,
  });
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getPublicTool(slug);
  if (!tool) return notFound();
  const support = TOOL_SUPPORT_CONTENT[tool.slug];

  return (
    <>
      <StructuredData
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: tool.title, path: `/tools/${tool.slug}` },
        ])}
      />

      <main className="bg-[#f7f8fc] text-slate-950">
        <SectionShell tone="canvas" spacing="hero" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
            <div className="absolute left-[-10%] top-[-6%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.12),transparent_70%)]" />
            <div className="absolute right-[-8%] top-[4%] h-[25rem] w-[25rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.12),transparent_70%)]" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="inline-flex rounded-full border border-blue-100 bg-white/92 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700 shadow-sm">
                {tool.eyebrow}
              </p>
              <h1 className="mt-5 max-w-[34rem] text-balance text-[3.7rem] font-semibold leading-[0.9] tracking-[-0.07em] text-slate-950 md:text-[4.9rem]">
                {tool.title}
              </h1>
              <p className="mt-4 max-w-[33rem] text-lg leading-8 text-slate-600">{tool.intro}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/tools/"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-white px-6 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Back to Tools
                </Link>
                <Link
                  href="/contact/"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3557ff_0%,#4f6bff_45%,#7c5cff_100%)] px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,107,255,0.28)] transition hover:brightness-105"
                >
                  Request a Website Review
                </Link>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-blue-700">Category</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{tool.category}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-blue-700">Status</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">Live</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                This tool is designed to be practically useful before you hire anyone. Use it for planning, QA, or implementation review.
              </p>
            </div>
          </div>
        </SectionShell>

        <SectionShell tone="white" spacing="compact">
          <ToolRenderer slug={tool.slug} />
        </SectionShell>

        {support ? (
          <SectionShell tone="canvas" spacing="compact">
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <article className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                  Best used when
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  Use this tool to make a better decision before implementation
                </h2>
                <div className="mt-5 space-y-3">
                  {support.useCases.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-7 text-slate-600"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </article>

              <div className="grid gap-6">
                <article className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                    Related services
                  </p>
                  <div className="mt-5 space-y-3">
                    {support.services.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 transition hover:border-blue-200 hover:bg-white"
                      >
                        <h3 className="text-base font-semibold text-slate-950">{item.label}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                      </Link>
                    ))}
                  </div>
                </article>

                <article className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                    Related Academy guides
                  </p>
                  <div className="mt-5 space-y-3">
                    {support.guides.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-white hover:text-blue-700"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          </SectionShell>
        ) : null}
      </main>
    </>
  );
}
