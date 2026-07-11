import Link from "next/link";
import { getPublicPosts } from "@/lib/posts";
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
    slugs: [
      "how-to-plan-website-copy-before-hiring-developer",
      "website-platform-comparison-small-business",
      "website-launch-checklist-for-small-businesses",
    ],
  },
  {
    title: "SEO Growth",
    description: "Rank higher and attract qualified traffic.",
    accent: <SearchIcon />,
    slugs: [
      "small-business-website-seo-checklist",
      "local-seo-for-small-business-google-maps-ranking-guide",
      "local-seo-basics-service-business-lagos",
      "03-seo-migration-without-losing-traffic",
    ],
  },
  {
    title: "Content Systems",
    description: "Create content that drives results.",
    accent: <PencilIcon />,
    slugs: [
      "04-writing-service-pages-that-convert",
      "homepage-structure-that-converts-visitors-into-customers",
      "high-converting-service-page",
    ],
  },
  {
    title: "Monetization",
    description: "AdSense, products, and revenue models.",
    accent: <DollarIcon />,
    slugs: [
      "email-marketing-for-small-business",
      "email-automation-architecture",
      "why-your-website-isnt-getting-leads",
    ],
  },
  {
    title: "Web Design",
    description: "UX, speed, and conversion best practices.",
    accent: <RevenueIcon />,
    slugs: [
      "how-to-build-a-small-business-website-that-converts",
      "high-converting-landing-pages-guide",
      "05-premium-design-without-slow-pages",
    ],
  },
  {
    title: "Case Studies",
    description: "Real projects. Real outcomes.",
    accent: <ShieldIcon />,
    slugs: [
      "jluxe-medical-aesthetics-case-study",
      "01-why-we-rebuilt-not-redesigned",
      "08-results-mistakes-and-reusable-playbook",
    ],
  },
] as const;

export default function AcademyCategoryGrid() {
  const posts = getPublicPosts();
  const availableSlugs = new Set(posts.map((post) => post.slug));

  return (
    <SectionShell id="academy" tone="canvas" spacing="compact">
      <div data-reveal className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">
          Academy: Learn. Apply. Grow.
        </p>
        <Link
          href="/blog/"
          className="inline-flex min-h-11 items-center rounded-xl text-sm font-semibold text-accent-gold transition hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
        >
          View all articles -&gt;
        </Link>
      </div>

      <div data-stagger className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {categories.map((category) => {
          const firstLiveSlug = category.slugs.find((slug) => availableSlugs.has(slug));
          const matchCount = category.slugs.filter((slug) => availableSlugs.has(slug)).length;
          const href = firstLiveSlug ? `/blog/${firstLiveSlug}/` : "/blog/";

          return (
            <PlatformCard
              key={category.title}
              href={href}
              title={category.title}
              description={category.description}
              icon={category.accent}
              variant="category"
              className="min-h-[12.75rem] rounded-[1.45rem] p-4"
            >
              <p className="text-xs font-semibold text-accent-gold">
                {matchCount} live guide{matchCount === 1 ? "" : "s"}
              </p>
            </PlatformCard>
          );
        })}
      </div>
    </SectionShell>
  );
}
