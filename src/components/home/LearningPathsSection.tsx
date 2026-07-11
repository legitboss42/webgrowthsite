import Link from "next/link";
import { getPublicPosts } from "@/lib/posts";
import { PUBLIC_TOOLS } from "@/lib/tools";
import { DollarIcon, GrowthChartIcon, RocketIcon } from "./HomeIcons";
import SectionShell from "./SectionShell";

const paths = [
  {
    title: "Start & Launch",
    description: "Build your foundation the right way.",
    href: "/blog/how-to-build-a-small-business-website-that-converts/",
    slugs: [
      "how-to-build-a-small-business-website-that-converts",
      "website-launch-checklist-for-small-businesses",
      "small-business-website-launch-qa-checklist",
    ],
    tools: ["website-launch-checklist", "website-cost-calculator"],
    supportingLabel: "Planning + launch",
    icon: <RocketIcon />,
  },
  {
    title: "Grow Traffic",
    description: "Increase visibility and attract the right audience.",
    href: "/blog/small-business-website-seo-checklist/",
    slugs: [
      "small-business-website-seo-checklist",
      "local-seo-for-small-business-google-maps-ranking-guide",
      "03-seo-migration-without-losing-traffic",
    ],
    tools: ["meta-description-generator", "sitemap-validator"],
    supportingLabel: "SEO foundations",
    icon: <GrowthChartIcon />,
  },
  {
    title: "Monetize & Scale",
    description: "Turn traffic into sustainable revenue.",
    href: "/blog/email-marketing-for-small-business/",
    slugs: [
      "email-marketing-for-small-business",
      "email-automation-architecture",
      "why-your-website-isnt-getting-leads",
    ],
    tools: ["adsense-readiness-checker", "homepage-checklist"],
    supportingLabel: "Revenue systems",
    icon: <DollarIcon />,
  },
] as const;

export default function LearningPathsSection() {
  const posts = getPublicPosts();
  const availablePostSlugs = new Set(posts.map((post) => post.slug));
  const availableToolSlugs = new Set(PUBLIC_TOOLS.map((tool) => tool.slug));

  return (
    <SectionShell tone="canvas" spacing="compact">
      <div data-reveal className="overflow-hidden rounded-[1.7rem] border border-border-hairline bg-[radial-gradient(circle_at_100%_0%,rgba(232,163,61,0.16),transparent_30%),linear-gradient(135deg,#0a0d12_0%,#11161f_48%,#0C0F14_100%)] p-5 shadow-[0_26px_70px_rgba(0,0,0,0.32)] md:p-7">
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr_0.92fr_0.92fr]">
          <div className="rounded-[1.45rem] border border-border-hairline bg-white/[0.035] p-6 text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">
              Learning paths
            </p>
            <h2 className="font-display mt-4 text-3xl font-medium tracking-[-0.04em] text-text-primary">
              Guided routes to real results
            </h2>
            <p className="mt-4 text-sm leading-7 text-text-muted">
              Follow grounded paths built from the guides and tools that are
              actually live across the platform today.
            </p>
            <Link
              href="/blog/"
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-accent-gold px-5 text-sm font-bold text-bg-ink shadow-[0_16px_34px_rgba(232,163,61,0.2)] transition hover:bg-[#f1b75d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
            >
              Explore Paths -&gt;
            </Link>
          </div>

          <div data-stagger className="contents">
          {paths.map((path) => {
            const guideCount = path.slugs.filter((slug) => availablePostSlugs.has(slug)).length;
            const toolCount = path.tools.filter((slug) => availableToolSlugs.has(slug)).length;

            return (
              <Link
                key={path.title}
                href={path.href}
                className="wg-card-hover group rounded-[1.45rem] border border-border-hairline bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-5 text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-accent-gold/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-teal/18 text-accent-gold ring-1 ring-accent-teal/35">
                  {path.icon}
                </div>
                <h3 className="font-display mt-6 text-[1.7rem] font-medium tracking-[-0.04em] text-text-primary">
                  {path.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-text-muted">{path.description}</p>
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-text-primary">
                  <span className="rounded-full border border-border-hairline bg-white/[0.04] px-3 py-1.5">
                    {guideCount} guide{guideCount === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-full border border-border-hairline bg-white/[0.04] px-3 py-1.5">
                    {toolCount} tool{toolCount === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-full border border-border-hairline bg-white/[0.04] px-3 py-1.5">
                    {path.supportingLabel}
                  </span>
                </div>
                <p className="mt-5 text-sm font-semibold text-accent-gold">
                  Start path -&gt;
                </p>
              </Link>
            );
          })}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
