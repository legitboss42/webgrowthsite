import Link from "next/link";
import {
  CodeWindowIcon,
  DollarIcon,
  PencilIcon,
  RevenueIcon,
  SearchIcon,
  ShieldIcon,
} from "./HomeIcons";
import PlatformCard from "./PlatformCard";
import SectionShell from "./SectionShell";

const categories = [
  {
    title: "Strategy",
    description: "Position, plan, and build with purpose.",
    accent: <CodeWindowIcon />,
    meta: "12 articles",
  },
  {
    title: "SEO Growth",
    description: "Rank higher and attract qualified traffic.",
    accent: <SearchIcon />,
    meta: "28 articles",
  },
  {
    title: "Content Systems",
    description: "Create content that drives results.",
    accent: <PencilIcon />,
    meta: "18 articles",
  },
  {
    title: "Monetization",
    description: "AdSense, products, and revenue models.",
    accent: <DollarIcon />,
    meta: "16 articles",
  },
  {
    title: "Web Design",
    description: "UX, speed, and conversion best practices.",
    accent: <RevenueIcon />,
    meta: "14 articles",
  },
  {
    title: "Case Studies",
    description: "Real projects. Real outcomes.",
    accent: <ShieldIcon />,
    meta: "10 articles",
  },
] as const;

export default function AcademyCategoryGrid() {
  return (
    <SectionShell id="academy" tone="canvas" spacing="compact">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Academy: Learn. Apply. Grow.
        </p>
        <Link
          href="/blog/"
          className="inline-flex min-h-11 items-center rounded-xl text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          View all articles -&gt;
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {categories.map((category) => (
          <PlatformCard
            key={category.title}
            href="/blog/"
            title={category.title}
            description={category.description}
            icon={category.accent}
            variant="category"
            className="min-h-[12.75rem] rounded-[1.45rem] p-4"
          >
            <p className="text-xs font-semibold text-blue-700">{category.meta}</p>
          </PlatformCard>
        ))}
      </div>
    </SectionShell>
  );
}
