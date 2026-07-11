import Link from "next/link";
import { PUBLIC_TOOLS } from "@/lib/tools";
import { AuditIcon, GrowthChartIcon, SearchIcon, SitemapIcon, TagIcon } from "./HomeIcons";
import PlatformCard from "./PlatformCard";
import SectionShell from "./SectionShell";

const toolIcons = {
  "adsense-readiness-checker": <TagIcon />,
  "website-cost-calculator": <GrowthChartIcon />,
  "homepage-checklist": <AuditIcon />,
  "meta-description-generator": <SearchIcon />,
  "sitemap-validator": <SitemapIcon />,
  "website-launch-checklist": <AuditIcon />,
} as const;

export default function FreeToolsSection() {
  const featuredTools = PUBLIC_TOOLS.slice(0, 4);

  return (
    <SectionShell id="free-tools" tone="canvas" spacing="compact">
      <div data-reveal className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">
          Academy: Tools. Built for growth.
        </p>
        <Link
          href="/tools/"
          className="inline-flex min-h-11 items-center rounded-xl text-sm font-semibold text-accent-gold transition hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
        >
          View all tools -&gt;
        </Link>
      </div>

      <div data-stagger className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featuredTools.map((tool) => (
          <PlatformCard
            key={tool.title}
            href={`/tools/${tool.slug}/`}
            title={tool.title}
            description={tool.description}
            icon={toolIcons[tool.slug]}
            eyebrow={tool.eyebrow}
            ctaLabel="Open tool"
            variant="tool"
            className="min-h-[12rem] rounded-[1.45rem] p-5"
          />
        ))}
      </div>

      <p data-reveal className="mt-4 text-sm leading-6 text-text-muted">
        {PUBLIC_TOOLS.length} public tools are live now, with every card linked to the
        actual tool route rather than a placeholder hub state.
      </p>
    </SectionShell>
  );
}
