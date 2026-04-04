import Link from "next/link";
import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import TrackedLink from "@/components/analytics/TrackedLink";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import CorePageLinks from "@/components/CorePageLinks";
import EntitySnapshotSection from "@/components/EntitySnapshotSection";
import PricingSection from "@/components/PricingSection";
import SocialProofSection from "@/components/SocialProofSection";
import StructuredData from "@/components/StructuredData";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import {
  launchFaqs,
  pricingTiers,
  socialProofCards,
  whatYouGetItems,
} from "@/lib/launchOffer";
import {
  buildPageMetadata,
  buildProfessionalServiceSchema,
  launchKeywordSet,
} from "@/lib/seo";
import { BOOKING_URL, GET_STARTED_PATH } from "@/lib/site";

const pageDescription =
  "A fast website launch for businesses that need a clean one-page site live quickly, with setup help and pricing from $150.";

const launchSteps = [
  {
    label: "Day 1",
    title: "Direction locked",
    description:
      "We confirm the offer, the main message, the call to action, and what is being built before anything starts.",
  },
  {
    label: "Build",
    title: "Page assembled fast",
    description:
      "The one-page site is built with a clear structure, mobile-friendly layout, and the basics needed to go live.",
  },
  {
    label: "Go live",
    title: "Launch and handoff",
    description:
      "I connect the domain, finish the checks, and hand it over so you can start using it right away.",
  },
] as const;

const fitPoints = [
  "Founders who need a professional website before outreach starts",
  "Service businesses that want a focused one-page business website first",
  "Lagos and Nigeria-based brands that need a remote partner and a fast delivery window",
  "Remote clients who want a simple website process without weeks of back-and-forth",
] as const;

const comparisonPoints = [
  {
    title: "When this is a fit",
    items: [
      "You need a business website live quickly",
      "You want one clear page before expanding later",
      "You prefer done-for-you setup over a long build process",
    ],
  },
  {
    title: "When to start elsewhere",
    items: [
      "You need a large multi-page site immediately",
      "Your content is not ready enough to approve quickly",
      "You want a long discovery phase before launch work begins",
    ],
  },
] as const;

const buyerQuestionAnswers = [
  {
    title: "What do you need from me?",
    answer:
      "A clear offer, your business details, contact information, and quick approvals. This works best when you want speed and can reply during the build.",
    href: "/blog/website-launch-checklist-for-small-businesses",
    hrefLabel: "Use the launch checklist",
  },
  {
    title: "Is this only for Nigeria-based businesses?",
    answer:
      "No. It works for Nigeria-based businesses and remote clients who want a straightforward process and a site live quickly.",
    href: "/faq",
    hrefLabel: "See launch questions",
  },
  {
    title: "What happens after the page goes live?",
    answer:
      "You can start using the site right away, then add more pages, blog content, or extra SEO later if you need it.",
    href: "/pricing",
    hrefLabel: "Compare next-step packages",
  },
  {
    title: "Why choose this over a longer build?",
    answer:
      "Because a lot of businesses do not need a long build. They just need a clean, solid site live now so they can stop waiting.",
    href: "/contact",
    hrefLabel: "Start your website",
  },
] as const;

const launchEntitySnapshot = [
  {
    title: "What this page is about",
    description:
      "This page is for the 48-hour launch offer, not a full custom-build process.",
  },
  {
    title: "What Web Growth is offering here",
    description:
      "A one-page business website with domain guidance, hosting setup, and the main launch basics handled in one go.",
  },
  {
    title: "Who should use it",
    description:
      "Businesses that need to get online quickly and do not want the project to drag on for weeks.",
  },
  {
    title: "What comes after this",
    description:
      "After launch, you can add more pages, blog content, SEO work, or a bigger redesign if the business needs it.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "48-Hour Website Launch for Lagos Service Businesses | Web Growth",
  description: pageDescription,
  path: "/launch",
  keywords: [
    ...launchKeywordSet,
    "website launch in nigeria",
    "remote website launch service",
    "one page website launch",
  ],
  image: "/images/hero/Hero-Image-1.webp",
});

function LaunchHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 py-20 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(16,185,129,0.1),transparent_28%),linear-gradient(180deg,rgba(5,8,6,0.95)_0%,rgba(5,8,6,0.98)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:34px_34px] opacity-20" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/85">
            Launch Offer
          </p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.02em] md:text-6xl">
            A website launch for businesses that need to go live fast
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
            If you need a clean one-page website without dragging the project
            out for weeks, this is the fastest option. I handle the setup, the
            build, and the basics needed to get it live.
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
              Start Your Website
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
                One-page business website launch
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
              <p className="mt-3 text-2xl font-semibold text-white">Nigeria + Remote</p>
              <p className="mt-2 text-sm leading-6 text-white/68">
                Lagos, UK, and remote service businesses
              </p>
            </div>
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-3xl border border-emerald-400/28 bg-[radial-gradient(circle_at_14%_-20%,rgba(16,185,129,0.24),rgba(4,16,13,0.9)_45%,rgba(2,8,7,0.98)_100%)] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
          <div className="relative z-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-200/95">
              [ HOW THIS OFFER WORKS ]
            </p>

            <div className="mt-6 space-y-4">
              {launchSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-black/30 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center rounded-md border border-white/20 bg-black/45 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-200/95">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-emerald-200/80">
                      {step.label}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">{step.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-white/76">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
              <p className="text-sm font-semibold text-white">Supporting sentence</p>
              <p className="mt-2 text-sm leading-7 text-white/74">
                The point is to get the first version live quickly, then build on it later if the business needs more.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function LaunchFitSection() {
  return (
    <section className="border-b border-white/10 bg-[#060907] py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            Best fit
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
            Who this fast launch is really for
          </h2>
          <p className="mt-4 text-lg leading-7 text-white/72">
            This offer works best for businesses that want a solid one-page site
            first and do not need a huge build straight away.
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
  );
}

function LaunchComparisonSection() {
  return (
    <section className="border-b border-white/10 bg-[#050806] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            Quick filter
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
            A quick way to tell if this offer fits
          </h2>
          <p className="mt-4 text-lg leading-7 text-white/72">
            You should be able to tell pretty quickly whether this is enough for
            your business or whether you need a bigger project.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {comparisonPoints.map((column) => (
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
  );
}

export default function LaunchPage() {
  return (
    <>
      <StructuredData data={buildProfessionalServiceSchema("/launch", pageDescription)} />

      <main className="bg-[#050806] text-white">
        <LaunchHero />
        <LaunchFitSection />
        <AnswerHighlightsSection
          eyebrow="Decision support"
          title="The questions people usually ask before they commit"
          description="These answers help you tell whether the fast launch is enough for now or whether you need something bigger."
          items={buyerQuestionAnswers}
        />
        <EntitySnapshotSection
          title="What this offer includes in plain English"
          description="If you want the short version, this is it."
          items={launchEntitySnapshot}
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
        <LaunchComparisonSection />

        <CorePageLinks
          eyebrow="Next steps"
          title="A few useful next steps"
          description="If this looks like the right fit, these pages will help you decide a little faster."
          links={[
            {
              href: "/pricing",
              label: "Pricing",
              title: "Compare launch pricing",
              description:
                "See the 48-hour website launch packages, what each one includes, and where the $150 starting price fits.",
            },
            {
              href: "/faq",
              label: "FAQ",
              title: "Read the launch FAQ",
              description:
                "Get quick answers on timing, revisions, ownership, support, and what happens after go-live.",
            },
            {
              href: "/blog/website-launch-checklist-for-small-businesses",
              label: "Blog",
              title: "Read the website launch checklist",
              description:
                "Use the launch checklist article to prepare content and approvals so your website design in 48 hours stays on track.",
            },
          ]}
        />

        <WhatYouGetSection
          items={whatYouGetItems}
          title="What is included in the package"
          description="These are the main pieces that come with the launch."
        />
        <SocialProofSection cards={socialProofCards} />
        <FAQSection
          items={launchFaqs}
          title="Questions about the 48-hour launch"
          description="These are the questions people usually ask before saying yes."
        />
        <FinalCTASection
          title="Ready to stop researching and get your website live?"
          description="If this looks right for your business, send the details and let’s get the site moving."
          pageType="launch_final_cta"
        />
      </main>
    </>
  );
}
