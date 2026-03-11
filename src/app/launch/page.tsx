import Link from "next/link";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import CorePageLinks from "@/components/CorePageLinks";
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
  "Website design in 48 hours for Nigeria-based businesses and international clients that need a professional site live fast, with domain guidance, hosting, a conversion-focused one-page build, and pricing from $150.";

const launchSteps = [
  {
    label: "Day 1",
    title: "Direction locked",
    description:
      "We confirm the offer, headline, CTA path, brand assets, and the exact scope before the build starts.",
  },
  {
    label: "Build",
    title: "Page assembled fast",
    description:
      "The one-page business website is built with mobile-first structure, launch-ready copy blocks, and clean SEO basics.",
  },
  {
    label: "Go live",
    title: "Launch and handoff",
    description:
      "Domain connection, hosting setup, final checks, and a simple handoff so you can start sending traffic immediately.",
  },
] as const;

const fitPoints = [
  "Founders who need a professional website before outreach starts",
  "Service businesses that want a focused one-page business website first",
  "Nigeria-based brands that need a remote partner and a fast delivery window",
  "International clients who want a done-for-you website launch without agency drag",
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

export const metadata = buildPageMetadata({
  title: "Website Design in 48 Hours | Launch Your Business Website Fast",
  description: pageDescription,
  path: "/launch",
  keywords: [
    ...launchKeywordSet,
    "website launch in nigeria",
    "remote website launch service",
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
            Website design in 48 hours for businesses that need to go live without delay
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
            Website design in 48 hours with domain guidance, hosting setup, and a
            conversion-focused one-page business website delivered in a fast,
            done-for-you flow for Nigeria-based and international clients.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={GET_STARTED_PATH}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
            >
              Start Your Website
            </Link>
            <a
              href={BOOKING_URL}
              target={BOOKING_URL.startsWith("http") ? "_blank" : undefined}
              rel={BOOKING_URL.startsWith("http") ? "noreferrer" : undefined}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
            >
              Book a Call
            </a>
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
                Built for local and international service businesses
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
                This website design in 48 hours offer stays focused so you can launch
                quickly now and expand into services, blog content, or deeper SEO later.
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
            Who this 48-hour launch is actually for
          </h2>
          <p className="mt-4 text-lg leading-7 text-white/72">
            The homepage introduces the offer. This page is where we get specific
            about the type of business, timeline, and launch constraints the service
            is designed to solve.
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
            A simple way to tell if this launch offer matches your situation
          </h2>
          <p className="mt-4 text-lg leading-7 text-white/72">
            This keeps the service page practical. You should be able to decide
            quickly whether the 48-hour website launch is the right next step or
            whether your project needs a bigger scope first.
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
        <PricingSection
          tiers={pricingTiers}
          title="Choose the launch package that matches your timeline"
          description="Straight USD pricing for a focused launch. Ideal when speed, clarity, and clean delivery matter more than bloated scope, and when you need a website design in 48 hours without sacrificing the basics."
        />
        <LaunchComparisonSection />

        <CorePageLinks
          eyebrow="Next steps"
          title="Review pricing, launch questions, and supporting resources"
          description="If the offer fits your timeline, use these internal links to compare package options, check FAQs, and read launch-focused articles before you start."
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
          title="What your website design in 48 hours package includes"
          description="This section goes deeper into the actual launch deliverables, so the service page feels more operational and less like a broad homepage overview."
        />
        <SocialProofSection cards={socialProofCards} />
        <FAQSection
          items={launchFaqs}
          title="Questions about the 48-hour launch"
          description="These are the practical questions people ask before they commit to a fast website build."
        />
        <FinalCTASection description="If the offer fits your stage, start your website request now and choose the next step that suits your process." />
      </main>
    </>
  );
}
