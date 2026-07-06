import Link from "next/link";
import { AuditIcon, SearchIcon, TagIcon } from "./HomeIcons";
import PlatformCard from "./PlatformCard";
import SectionShell from "./SectionShell";

const tools = [
  {
    title: "SEO Content Brief",
    description: "Build content that ranks and converts.",
    icon: <SearchIcon />,
    cta: "Create Brief",
  },
  {
    title: "Website Audit",
    description: "Discover issues. Unlock growth opportunities.",
    icon: <AuditIcon />,
    cta: "Run Audit",
  },
  {
    title: "Keyword Explorer",
    description: "Find high-value keywords with low competition.",
    icon: <SearchIcon />,
    cta: "Explore Keywords",
  },
  {
    title: "AdSense Checker",
    description: "Check if your site is policy and AdSense ready.",
    icon: <TagIcon />,
    cta: "Check Now",
  },
] as const;

export default function FreeToolsSection() {
  return (
    <SectionShell id="free-tools" tone="canvas" spacing="compact">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Academy: Tools. Built for growth.
        </p>
        <Link
          href="/tools/"
          className="inline-flex min-h-11 items-center rounded-xl text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          View all tools -&gt;
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool) => (
          <PlatformCard
            key={tool.title}
            href="/tools/"
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            ctaLabel={tool.cta}
            variant="tool"
            className="min-h-[12rem] rounded-[1.45rem] p-5"
          />
        ))}
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">
        Public tool visuals are shown as platform direction. Route and launch truth
        will stay aligned with what is actually live.
      </p>
    </SectionShell>
  );
}
