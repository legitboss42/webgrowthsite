import PageHero from "@/components/platform/PageHero";
import PageSection from "@/components/platform/PageSection";
import PremiumButton from "@/components/platform/PremiumButton";
import SurfaceCard from "@/components/platform/SurfaceCard";
import SectionHeading from "@/components/SectionHeading";

type PricingPackage = {
  name: string;
  price: string;
  bestFor: string;
  timeline: string;
  highlights: readonly string[];
  badge?: string;
};

const packages: readonly PricingPackage[] = [
  {
    name: "Foundation",
    price: "From $1,500",
    bestFor: "Businesses that need a credible launch-ready website with clear offer structure and stronger trust fundamentals.",
    timeline: "2-3 weeks",
    highlights: [
      "Strategy-led scope for core marketing pages",
      "Mobile-first design and development",
      "SEO, trust, and conversion baseline",
      "Launch-ready forms and CTA structure",
    ],
  },
  {
    name: "Growth",
    price: "From $3,500",
    bestFor: "Businesses that need a more premium sales experience, stronger conversion paths, and cleaner marketing infrastructure.",
    timeline: "3-5 weeks",
    highlights: [
      "Expanded information architecture and premium polish",
      "Sharper service-page and homepage conversion flow",
      "Deeper SEO, content, and UX refinement",
      "Analytics, lead-routing, and growth-ready setup",
    ],
    badge: "Most popular",
  },
  {
    name: "Platform",
    price: "From $6,500",
    bestFor: "Brands building a real website growth platform with services, academy content, tools, authority assets, and ongoing optimization needs.",
    timeline: "5-8 weeks",
    highlights: [
      "Platform-level IA across services, content, and lead generation",
      "Advanced motion, premium UI systems, and reusable components",
      "Schema, internal linking, and authority architecture",
      "Growth roadmap for post-launch optimization and monetization",
    ],
  },
] as const;

const pricingNotes = [
  "These are starting ranges, not one-size-fits-all fixed-price promises.",
  "Hosting, domain, paid plugins, and third-party subscriptions are scoped separately when required.",
  "The right investment depends on business model, content readiness, integrations, and growth ambition, not page count alone.",
  "A website review is still the best entry point when the real bottleneck is unclear.",
] as const;

export default function PricingClient() {
  return (
    <main className="bg-[#eff1ec] text-slate-950">
      <PageHero
        eyebrow="Pricing"
        title="Premium scope guidance, without hiding how Web Growth pricing works."
        description="Pricing is framed to help qualified buyers understand the level of build, polish, and strategy support they likely need. If the right route is still unclear, start with a website review instead of guessing."
        primaryCta={{ label: "Request a Website Review", href: "/contact/" }}
        secondaryCta={{ label: "View Services", href: "/services/" }}
        chips={["Transparent packages", "Scope-first", "Premium positioning"]}
      />

      <PageSection surface="default" spacing="md">
        <SectionHeading
          eyebrow="Packages"
          title="Choose the right scope level first"
          description="These packages are best used as commercial guidance, not as a substitute for proper project diagnosis."
          align="left"
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {packages.map((pack) => (
            <SurfaceCard key={pack.name} tone={pack.badge ? "tint" : "default"} className="h-full">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                    {pack.name}
                  </p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                    {pack.price}
                  </h2>
                </div>
                {pack.badge ? (
                  <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                    {pack.badge}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">{pack.bestFor}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Timeline: {pack.timeline}
              </p>

              <ul className="mt-5 space-y-2">
                {pack.highlights.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-slate-600">
                    <span className="mt-[9px] h-2 w-2 rounded-full bg-blue-500/80" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <PremiumButton href={`/contact?package=${encodeURIComponent(pack.name)}`}>
                  Request {pack.name} quote
                </PremiumButton>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </PageSection>

      <PageSection surface="white" spacing="sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <SurfaceCard>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Important notes
            </p>
            <ul className="mt-4 space-y-2">
              {pricingNotes.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-7 text-slate-600">
                  <span className="mt-[9px] h-2 w-2 rounded-full bg-blue-500/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SurfaceCard>

          <SurfaceCard tone="tint">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Better way to buy
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Start with a review if you are comparing redesign, rebuild, SEO, or conversion work.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The best commercial outcome usually comes from choosing the right intervention, not
              the cheapest package. A website review helps us recommend that cleanly.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PremiumButton href="/contact/">Request a Website Review</PremiumButton>
              <PremiumButton href="/portfolio/" variant="secondary">
                Review case studies
              </PremiumButton>
            </div>
          </SurfaceCard>
        </div>
      </PageSection>
    </main>
  );
}
