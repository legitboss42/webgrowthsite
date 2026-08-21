import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import {
  AuditIcon,
  GrowthChartIcon,
  LightbulbIcon,
  SearchIcon,
  SitemapIcon,
  TagIcon,
} from "@/components/home/HomeIcons";
import { buildPageMetadata } from "@/lib/seo";
import { PUBLIC_TOOLS, type PublicToolSlug } from "@/lib/tools";

const toolPresentation: Record<
  PublicToolSlug,
  { icon: React.ReactNode; number: string; note: string }
> = {
  "adsense-readiness-checker": {
    icon: <AuditIcon />,
    number: "01",
    note: "Trust, content and policy-alignment signals",
  },
  "website-cost-calculator": {
    icon: <GrowthChartIcon />,
    number: "02",
    note: "Scope and investment planning",
  },
  "homepage-checklist": {
    icon: <LightbulbIcon />,
    number: "03",
    note: "Messaging, trust and conversion flow",
  },
  "meta-description-generator": {
    icon: <TagIcon />,
    number: "04",
    note: "Search snippet drafting",
  },
  "sitemap-validator": {
    icon: <SitemapIcon />,
    number: "05",
    note: "Technical SEO and sitemap structure",
  },
  "website-launch-checklist": {
    icon: <SearchIcon />,
    number: "06",
    note: "Pre-launch quality assurance",
  },
};

const categories = [
  {
    label: "Plan",
    title: "Make the scope clearer.",
    copy: "Estimate investment and define what the website actually needs before implementation begins.",
    slugs: ["website-cost-calculator"] as PublicToolSlug[],
  },
  {
    label: "Improve",
    title: "Find the gaps that matter.",
    copy: "Review homepage clarity, search snippets and technical structure with focused checks.",
    slugs: ["homepage-checklist", "meta-description-generator", "sitemap-validator"] as PublicToolSlug[],
  },
  {
    label: "Launch and monetize",
    title: "Publish with fewer avoidable risks.",
    copy: "Check launch readiness and monetization foundations without treating a checklist as a guarantee.",
    slugs: ["website-launch-checklist", "adsense-readiness-checker"] as PublicToolSlug[],
  },
];

const schedulerTool = {
  title: "TikTok Scheduler",
  description:
    "Create, approve, and schedule TikTok posts from the Web Growth publishing queue.",
  href: "/scheduler/",
  category: "Publishing",
  note: "Private scheduled publishing workflow",
};

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
  const featured = PUBLIC_TOOLS.find((tool) => tool.slug === "adsense-readiness-checker")!;

  return (
    <main className="tools-system">
      <section className="tools-hero" aria-labelledby="tools-title">
        <div className="tools-container tools-hero-grid">
          <div>
            <p className="tools-kicker">Web Growth utility studio</p>
            <h1 id="tools-title">Practical tools for better website decisions.</h1>
            <p className="tools-hero-copy">
              Six public utilities for planning, reviewing, launching and improving a website, plus the private TikTok scheduler for publishing work.
            </p>
            <div className="tools-actions">
              <a className="tools-button tools-button-primary" href="#tool-library">Explore live tools</a>
              <Link className="tools-button tools-button-secondary" href="/blog/">Open the Academy</Link>
            </div>
          </div>

          <aside className="tools-hero-console" aria-label="Live tools inventory">
            <div className="tools-console-top">
              <span>WG / UTILITIES</span>
              <span className="tools-live"><i /> {PUBLIC_TOOLS.length + 1} live</span>
            </div>
            <div className="tools-console-orbit" aria-hidden="true">
              <div className="tools-console-core">BUILD<br />BETTER</div>
              {PUBLIC_TOOLS.slice(0, 4).map((tool, index) => (
                <span key={tool.slug} className={`tools-orbit-node tools-orbit-node-${index + 1}`}>
                  {toolPresentation[tool.slug].number}
                </span>
              ))}
            </div>
            <p>Useful before a sales conversation, and practical when website work needs publishing support.</p>
          </aside>
        </div>
      </section>

      <section className="tools-featured" aria-labelledby="featured-tool-title">
        <div className="tools-container tools-featured-grid">
          <div className="tools-featured-copy">
            <p className="tools-kicker">Featured diagnostic</p>
            <span className="tools-status"><i /> Available now</span>
            <h2 id="featured-tool-title">{featured.title}</h2>
            <p>{featured.description}</p>
            <ul>
              <li>Review trust and navigation signals</li>
              <li>Spot content and layout risks</li>
              <li>Get a practical, non-guaranteed readiness score</li>
            </ul>
            <TrackedLink
              href={`/tools/${featured.slug}/`}
              className="tools-button tools-button-dark"
              ctaName="open_adsense_readiness_checker"
              ctaLocation="tools_featured"
              destination={`/tools/${featured.slug}/`}
              pageType="tools_hub"
            >
              Run the readiness check <span aria-hidden="true">→</span>
            </TrackedLink>
          </div>
          <div className="tools-featured-visual" aria-hidden="true">
            <div className="tools-signal-card tools-signal-card-a"><span>Trust</span><strong>Pages + identity</strong></div>
            <div className="tools-signal-card tools-signal-card-b"><span>Content</span><strong>Depth + purpose</strong></div>
            <div className="tools-signal-card tools-signal-card-c"><span>Experience</span><strong>Navigation + layout</strong></div>
            <div className="tools-score-disc"><span>Review</span><strong>01</strong><small>of 06 live tools</small></div>
          </div>
        </div>
      </section>

      <section className="tools-library" id="tool-library" aria-labelledby="tool-library-title">
        <div className="tools-container tools-section-heading">
          <div>
            <p className="tools-kicker">Live tool library</p>
            <h2 id="tool-library-title">Choose the decision in front of you.</h2>
          </div>
          <p>Every utility below has a working route and a defined purpose. Public tools stay indexable; private workflows stay protected.</p>
        </div>

        <div className="tools-container tools-editorial-list">
          {PUBLIC_TOOLS.map((tool, index) => {
            const presentation = toolPresentation[tool.slug];
            return (
              <TrackedLink
                key={tool.slug}
                href={`/tools/${tool.slug}/`}
                className="tools-editorial-item"
                ctaName={`open_${tool.slug}`}
                ctaLocation="tools_library"
                destination={`/tools/${tool.slug}/`}
                pageType="tools_hub"
              >
                <span className="tools-item-number">{presentation.number}</span>
                <span className="tools-item-icon" aria-hidden="true">{presentation.icon}</span>
                <span className="tools-item-content">
                  <small>{tool.category} · {presentation.note}</small>
                  <strong>{tool.title}</strong>
                  <span>{tool.description}</span>
                </span>
                <span className="tools-item-action"><i /> Live <b aria-hidden="true">↗</b></span>
              </TrackedLink>
            );
          })}
          <TrackedLink
            href={schedulerTool.href}
            className="tools-editorial-item"
            ctaName="open_tiktok_scheduler"
            ctaLocation="tools_library"
            destination={schedulerTool.href}
            pageType="tools_hub"
          >
            <span className="tools-item-number">07</span>
            <span className="tools-item-icon" aria-hidden="true"><GrowthChartIcon /></span>
            <span className="tools-item-content">
              <small>{schedulerTool.category} / {schedulerTool.note}</small>
              <strong>{schedulerTool.title}</strong>
              <span>{schedulerTool.description}</span>
            </span>
            <span className="tools-item-action"><i /> Private <b aria-hidden="true">-&gt;</b></span>
          </TrackedLink>
        </div>
      </section>

      <section className="tools-categories" aria-labelledby="tools-categories-title">
        <div className="tools-container">
          <p className="tools-kicker">A useful sequence</p>
          <h2 id="tools-categories-title">Plan. Improve. Launch with confidence.</h2>
          <div className="tools-category-grid">
            {categories.map((category, index) => (
              <article key={category.label}>
                <span>0{index + 1} / {category.label}</span>
                <h3>{category.title}</h3>
                <p>{category.copy}</p>
                <div>
                  {category.slugs.map((slug) => {
                    const tool = PUBLIC_TOOLS.find((item) => item.slug === slug)!;
                    return <Link href={`/tools/${slug}/`} key={slug}>{tool.shortTitle} <span aria-hidden="true">→</span></Link>;
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tools-guidance" aria-labelledby="tools-guidance-title">
        <div className="tools-container tools-guidance-grid">
          <div>
            <p className="tools-kicker">Tools are a starting point</p>
            <h2 id="tools-guidance-title">A result becomes valuable when it leads to the right action.</h2>
          </div>
          <div className="tools-guidance-links">
            <Link href="/blog/"><span>Learn the implementation</span><strong>Read practical Academy guides</strong><small>Explore the Academy →</small></Link>
            <Link href="/services/website-audit/"><span>Need a deeper diagnosis?</span><strong>Review the full website system</strong><small>Explore website audits →</small></Link>
            <Link href="/contact/"><span>Ready to improve the site?</span><strong>Discuss the right next step</strong><small>Work with Web Growth →</small></Link>
          </div>
        </div>
      </section>

      <section className="tools-final-cta">
        <div className="tools-container tools-final-inner">
          <div>
            <p className="tools-kicker">From diagnosis to implementation</p>
            <h2>Know what needs attention. Then build the fix properly.</h2>
          </div>
          <Link href="/contact/" className="tools-button tools-button-primary">Request a website review</Link>
        </div>
      </section>
    </main>
  );
}
