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
    name: "Starter",
    price: "$150",
    bestFor: "New businesses needing a clear, credible online presence.",
    timeline: "7-10 days",
    highlights: [
      "Up to 5 pages",
      "$20 per extra page",
      "Mobile-first build",
      "Basic SEO foundation",
    ],
  },
  {
    name: "Growth",
    price: "$250",
    bestFor: "Businesses that need stronger conversion and a more premium presence.",
    timeline: "10-14 days",
    highlights: [
      "Up to 8 pages",
      "$20 per extra page",
      "Stronger conversion structure",
      "SEO polish and better content sections",
    ],
    badge: "Most popular",
  },
  {
    name: "Pro",
    price: "$400",
    bestFor: "Brands that want deeper polish, premium presentation, and scalable structure.",
    timeline: "2-3 weeks",
    highlights: [
      "Up to 12 pages",
      "$20 per extra page",
      "Premium interface polish",
      "Advanced SEO and analytics foundations",
    ],
  },
] as const;

const pricingNotes = [
  "Hosting and domain costs are paid directly by the client.",
  "Add-ons are scoped separately when the work falls outside the core package.",
  "The right package depends on the website's real job, not only page count.",
  "A website review is the best starting point if scope is still unclear.",
] as const;

export default function PricingClient() {
  return (
    <main className="bg-[#f7f8fc] text-slate-950">
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
