import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import CorePageLinks from "@/components/CorePageLinks";
import EntitySnapshotSection from "@/components/EntitySnapshotSection";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import PricingSection from "@/components/PricingSection";
import SocialProofSection from "@/components/SocialProofSection";
import StructuredData from "@/components/StructuredData";
import TrackedLink from "@/components/analytics/TrackedLink";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import { launchFaqs, pricingTiers, whatYouGetItems } from "@/lib/launchOffer";
import { featuredPortfolioCases } from "@/lib/portfolioCases";
import {
  buildPageMetadata,
  buildProfessionalServiceSchema,
  launchKeywordSet,
} from "@/lib/seo";
import { BOOKING_URL, GET_STARTED_PATH } from "@/lib/site";

const pageDescription =
  "Reserve a premium website launch package with strategy, custom Next.js development, hosting, and conversion-focused execution.";

const launchSteps = [
  {
    label: "01",
    title: "Strategy locked",
    description:
      "We define the offer, page hierarchy, calls to action, and assets first so the build moves with speed and precision.",
  },
  {
    label: "02",
    title: "Custom-coded build",
    description:
      "The site is designed and developed in a premium, performance-first structure built to load fast and convert cleanly on mobile.",
  },
  {
    label: "03",
    title: "Launch cleanly",
    description:
      "Hosting, domain connection, SSL, final QA, and handoff are handled so the website can go live looking polished from day one.",
  },
] as const;

const fitPoints = [
  "For service businesses, clinics, and premium local brands that need a high-quality website live quickly.",
  "For founders who want custom-coded performance instead of another cheap template that needs replacing later.",
  "For businesses that already have traffic, referrals, or outreach and need the website to convert that attention properly.",
  "Not for buyers chasing the cheapest possible site or a long discovery process before anything gets built.",
] as const;

const buyerQuestions = [
  {
    title: "What do you need from me?",
    answer:
      "A clear offer, your business details, your brand assets if you have them, and quick approvals. This package works best when you want momentum, not delay.",
    href: "/blog/website-launch-checklist-for-small-businesses",
    hrefLabel: "Use the launch checklist",
  },
  {
    title: "Is this a premium package or a cheap starter site?",
    answer:
      "It is a premium launch package. The goal is to get a serious website live fast without sacrificing build quality, performance, or brand perception.",
    href: "/pricing",
    hrefLabel: "Compare package pricing",
  },
  {
    title: "What happens after launch?",
    answer:
      "You launch on a clean technical foundation, then expand into more pages, SEO content, integrations, or a broader site as the business grows.",
    href: "/pricing",
    hrefLabel: "Compare next-step packages",
  },
  {
    title: "Why choose this over a page builder setup?",
    answer:
      "Because a custom-coded launch gives you better performance, a more premium feel, cleaner flexibility, and a stronger base for future growth.",
    href: "/contact",
    hrefLabel: "Start your website",
  },
] as const;

const offerSummary = [
  {
    title: "Strategy and page structure",
    description:
      "The package starts with clear positioning, better hierarchy, and a page structure built to guide buyers toward action.",
  },
  {
    title: "Custom Next.js development",
    description:
      "The build is custom-coded for performance and flexibility, not assembled from bloated templates that age badly.",
  },
  {
    title: "Managed launch setup",
    description:
      "Premium hosting, SSL, domain connection, and go-live checks are handled so the final launch feels clean and controlled.",
  },
  {
    title: "Conversion-minded execution",
    description:
      "Everything is shaped around speed, trust, and a stronger enquiry path so the website can support revenue instead of slowing it down.",
  },
] as const;

const comparisonColumns = [
  {
    title: "Web Growth launch package",
    items: [
      "Custom-coded Next.js build with stronger performance headroom",
      "Premium design system and cleaner conversion architecture",
      "Managed hosting, SSL, domain connection, and launch QA",
      "A scalable foundation for future pages, SEO, and integrations",
    ],
  },
  {
    title: "Cheap page builder setups",
    items: [
      "Template constraints and heavier plugin bloat",
      "Generic layouts that struggle to feel premium under pressure",
      "More friction when the business needs custom features or redesigns",
      "A weaker long-term foundation once traffic and expectations grow",
    ],
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Premium Website Launch Package | Web Growth",
  description: pageDescription,
  path: "/launch",
  noIndex: true,
  keywords: [
    "website launch package",
    "premium website launch package",
    "premium website package",
    "web design package",
    "custom next.js website package",
    ...launchKeywordSet,
  ],
  image: "/images/hero/Hero-Image-1.webp",
});

export default function LaunchPage() {
  const proofCards = featuredPortfolioCases;

  return (
    <>
      <StructuredData
        data={[
          buildProfessionalServiceSchema("/launch", pageDescription),
        ]}
      />

      <main className="bg-[#050806] text-white">
        <section className="relative overflow-hidden border-b border-white/10 py-20 md:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(16,185,129,0.1),transparent_28%),linear-gradient(180deg,rgba(5,8,6,0.95)_0%,rgba(5,8,6,0.98)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:34px_34px] opacity-20" />

          <div className="relative mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/85">
                Launch offer
              </p>
              <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-6xl">
                Reserve a premium custom-coded website package without waiting months
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
                This is the high-speed package for businesses that need strategy,
                premium Next.js development, managed hosting setup, and a
                conversion-focused website that looks serious from day one.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href={GET_STARTED_PATH}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                  ctaName="start_your_website"
                  ctaLocation="launch_hero_primary"
                  destination={GET_STARTED_PATH}
                  pageType="launch"
                  offerType="website_launch"
                >
                  Reserve This Package
                </TrackedLink>
                <TrackedLink
                  href={BOOKING_URL}
                  target={BOOKING_URL.startsWith("http") ? "_blank" : undefined}
                  rel={BOOKING_URL.startsWith("http") ? "noreferrer" : undefined}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                  ctaName="booking"
                  ctaLocation="launch_hero_booking"
                  destination="booking"
                  pageType="launch"
                  offerType="consultation"
                >
                  Book a Call
                </TrackedLink>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/85">
                    Starting price
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">$150</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    Premium launch package
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/85">
                    Delivery
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">48 hrs</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    When content and approvals are ready
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/85">
                    Best fit
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">Lagos + remote</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    Brands that want speed without sacrificing quality
                  </p>
                </div>
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-3xl border border-emerald-400/28 bg-[radial-gradient(circle_at_14%_-20%,rgba(16,185,129,0.24),rgba(4,16,13,0.9)_45%,rgba(2,8,7,0.98)_100%)] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
              <div className="relative z-10">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-200/95">
                  [ How this works ]
                </p>

                <div className="mt-6 space-y-4">
                  {launchSteps.map((step) => (
                    <div key={step.title} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="inline-flex items-center rounded-md border border-white/20 bg-black/45 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-200/95">
                          {step.label}
                        </span>
                      </div>
                      <h2 className="mt-3 text-xl font-semibold text-white">{step.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-white/76">{step.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
                  <p className="text-sm font-semibold text-white">Why people choose this</p>
                  <p className="mt-2 text-sm leading-7 text-white/74">
                    It gets a serious website live quickly while keeping the technical
                    quality high enough to support future growth.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#060907] py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Is this for you?
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
                Built for buyers who want a serious website without the usual drag
              </h2>
              <p className="mt-4 text-lg leading-7 text-white/72">
                This package is designed to qualify the right clients quickly, so
                both sides can move with clarity.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {fitPoints.map((point) => (
                <article
                  key={point}
                  className="rounded-2xl border border-emerald-400/22 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.2),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.22)]"
                >
                  <p className="text-sm leading-7 text-white/78">{point}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <AnswerHighlightsSection
          eyebrow="Q&A"
          title="The questions serious buyers ask before they commit"
          description="These answers make it easier to tell whether this launch package fits now or whether you need a broader build."
          items={buyerQuestions}
        />

        <EntitySnapshotSection
          eyebrow="Offer summary"
          title="What the package is actually built to deliver"
          description="This is not a cheap template sprint. It is a premium launch package engineered to balance speed, technical quality, and commercial intent."
          items={offerSummary}
          links={[
            { href: "/pricing", label: "Compare launch pricing" },
            { href: "/faq", label: "Read launch FAQ" },
            { href: "/contact", label: "Talk through your project" },
          ]}
        />

        <PricingSection
          tiers={pricingTiers}
          title="Pick the package that fits"
          description="Simple USD pricing for getting a one-page site live without overcomplicating the job."
          pageType="launch_pricing"
        />

        <section className="border-b border-white/10 bg-[#050806] py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Comparison
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
                Why serious brands skip cheap page builders when the website actually matters
              </h2>
              <p className="mt-4 text-lg leading-7 text-white/72">
                The goal is not to be the cheapest option. The goal is to give your
                business a faster, cleaner, more scalable website foundation.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {comparisonColumns.map((column) => (
                <article
                  key={column.title}
                  className="rounded-3xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
                >
                  <h3 className="text-xl font-semibold text-white">{column.title}</h3>
                  <ul className="mt-5 space-y-3 text-sm leading-7 text-white/76">
                    {column.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-[11px] h-2 w-2 rounded-full bg-emerald-400/80" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <CorePageLinks
          eyebrow="Next steps"
          title="The pages that help you decide a little faster"
          description="If this looks like the right fit, these pages cover pricing, FAQ, and launch prep."
          links={[
            {
              href: "/pricing",
              label: "Pricing",
              title: "Compare launch pricing",
              description:
                "See the 48-hour launch packages and where the $150 starting price fits.",
            },
            {
              href: "/faq",
              label: "FAQ",
              title: "Read the launch FAQ",
              description:
                "Get quick answers on timing, revisions, ownership, support, and go-live.",
            },
            {
              href: "/blog/website-launch-checklist-for-small-businesses",
              label: "Blog",
              title: "Read the launch checklist",
              description:
                "Use the checklist to prepare your content and approvals so the launch stays on track.",
            },
          ]}
        />

        <WhatYouGetSection
          items={whatYouGetItems}
          title="What's included in the launch package"
          description="The core technical and conversion pieces are handled from the start so the site can go live looking premium, not patched together."
        />

        <SocialProofSection
          cards={proofCards}
          eyebrow="Proof"
          title="Shipped work that shows the quality bar"
          description="These live projects show the level of execution behind the package: cleaner UX, stronger trust, and more deliberate frontend architecture."
        />

        <FAQSection
          items={launchFaqs}
          title="Questions about the 48-hour launch"
          description="These are the questions people usually ask before saying yes."
        />

        <FinalCTASection
          title="If you want a premium website launch without the usual delay, start here"
          description="Send the brief and get a direct answer on fit, scope, timing, and the fastest route to a launch that looks premium and sells properly."
          pageType="launch_final_cta"
        />
      </main>
    </>
  );
}
