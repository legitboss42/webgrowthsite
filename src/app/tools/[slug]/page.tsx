import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolRenderer from "@/components/tools/ToolRenderer";
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

      <main className="tool-detail-system">
        <section className="tool-detail-hero" aria-labelledby="tool-title">
          <div className="tools-container tool-detail-hero-grid">
            <div>
              <Link href="/tools/" className="tool-detail-back"><span aria-hidden="true">←</span> All tools</Link>
              <p className="tools-kicker">{tool.eyebrow}</p>
              <h1 id="tool-title">{tool.title}</h1>
              <p className="tool-detail-intro">{tool.intro}</p>
              <div className="tools-actions">
                <a href="#tool-workspace" className="tools-button tools-button-primary">Use the tool</a>
                <Link href="/blog/" className="tools-button tools-button-secondary">Read the Academy</Link>
              </div>
            </div>
            <aside className="tool-detail-status" aria-label="Tool status and expectations">
              <div><span>{tool.category}</span><strong><i /> Available now</strong></div>
              <p>This utility provides practical guidance from the information you enter. It is not a guarantee of rankings, AdSense approval, pricing, or business results.</p>
              <dl>
                <div><dt>Access</dt><dd>Free</dd></div>
                <div><dt>Route</dt><dd>Public</dd></div>
                <div><dt>Status</dt><dd>Live</dd></div>
              </dl>
            </aside>
          </div>
        </section>

        <section id="tool-workspace" className="tool-workspace-section" aria-labelledby="tool-workspace-title">
          <div className="tools-container">
            <div className="tool-workspace-heading">
              <div><p className="tools-kicker">Interactive workspace</p><h2 id="tool-workspace-title">Use {tool.shortTitle.toLowerCase()} to make a clearer website decision.</h2></div>
              <p>Enter only the information requested below. Review the output as decision support, then verify important changes before publishing.</p>
            </div>
            <div className="tool-workspace-shell"><ToolRenderer slug={tool.slug} /></div>
          </div>
        </section>

        {support ? (
          <section className="tool-support-section" aria-labelledby="tool-support-title">
            <div className="tools-container tool-support-grid">
              <article className="tool-support-primary">
                <p className="tools-kicker">Best used when</p>
                <h2 id="tool-support-title">Use this tool to make a better decision before implementation.</h2>
                <div className="tool-use-list">
                  {support.useCases.map((item) => (
                    <div key={item}><span aria-hidden="true">✓</span>{item}</div>
                  ))}
                </div>
              </article>

              <div className="tool-support-links">
                <article>
                  <p className="tools-kicker">Related services</p>
                  <div>
                    {support.services.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <h3>{item.label}</h3><p>{item.description}</p><small>Explore service →</small>
                      </Link>
                    ))}
                  </div>
                </article>

                <article>
                  <p className="tools-kicker">Related Academy guides</p>
                  <div>
                    {support.guides.map((item) => (
                      <Link key={item.href} href={item.href}>{item.label}<span aria-hidden="true">→</span></Link>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          </section>
        ) : null}

        <section className="tool-detail-final"><div className="tools-container tools-final-inner"><div><p className="tools-kicker">Need deeper context?</p><h2>Turn the result into a focused website improvement plan.</h2></div><Link href="/contact/" className="tools-button tools-button-primary">Request a website review</Link></div></section>
      </main>
    </>
  );
}
