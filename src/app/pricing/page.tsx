import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import PricingSection from "@/components/PricingSection";
import StructuredData from "@/components/StructuredData";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import { launchFaqs, pricingTiers, whatYouGetItems } from "@/lib/launchOffer";
import {
  buildPageMetadata,
  buildProfessionalServiceSchema,
  launchKeywordSet,
} from "@/lib/seo";
import { BOOKING_URL } from "@/lib/site";

const pageDescription =
  "Pricing for website design in 48 hours, with clear USD packages for businesses in Nigeria and international clients who need a professional website live fast.";

export const metadata = buildPageMetadata({
  title: "Pricing for Website Design in 48 Hours",
  description: pageDescription,
  path: "/pricing",
  keywords: [
    ...launchKeywordSet,
    "website design pricing nigeria",
    "one page website cost",
  ],
});

const pricingHighlights = [
  { label: "Starting at", value: "$150", note: "Launch package" },
  { label: "Delivery", value: "48 hours", note: "When content is ready" },
  { label: "Best fit", value: "Service brands", note: "Nigeria + remote clients" },
  { label: "Scope", value: "1 page or 1 page + blog", note: "Built to expand later" },
];

export default function PricingPage() {
  return (
    <>
      <StructuredData data={buildProfessionalServiceSchema("/pricing", pageDescription)} />

      <main className="relative overflow-x-clip bg-[#050806] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />

        <section className="relative overflow-hidden border-b border-white/10 py-20 md:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_85%_25%,rgba(16,185,129,0.08),transparent_28%)]" />

          <div className="relative mx-auto max-w-6xl px-6">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                  Pricing
                </p>
                <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-6xl">
                  Pricing for website design in 48 hours
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-7 text-white/72">
                  Clear USD pricing, clean scope, and a focused launch for businesses
                  in Nigeria, Lagos, or remote international markets.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/contact"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                  >
                    Contact Us
                  </a>
                  <a
                    href={BOOKING_URL}
                    target={BOOKING_URL.startsWith("http") ? "_blank" : undefined}
                    rel={BOOKING_URL.startsWith("http") ? "noreferrer" : undefined}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                  >
                    Book a Call
                  </a>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/68">
                  <span className="rounded-full border border-white/10 bg-black/25 px-4 py-2">
                    USD pricing
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/25 px-4 py-2">
                    Built for direct outreach
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/25 px-4 py-2">
                    Expand later without rebuilding
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {pricingHighlights.map((item) => (
                  <div
                    key={item.label}
                    className="relative overflow-hidden rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.21),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:22px_22px] opacity-15" />
                    <div className="relative z-10">
                      <p className="text-xs uppercase tracking-[0.14em] text-emerald-200/85">
                        {item.label}
                      </p>
                      <p className="mt-3 text-xl font-semibold text-white">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-white/68">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <PricingSection
          tiers={pricingTiers}
          title="Two launch options. No bloated package table."
          description="Start with the one-page launch or add a blog if SEO publishing matters from day one."
        />
        <WhatYouGetSection
          items={whatYouGetItems}
          title="What these packages already cover"
          description="The core launch stack is already included, so you are not piecing the essentials together separately."
        />
        <FAQSection
          items={launchFaqs}
          title="Pricing questions people ask first"
          description="Short answers on ownership, revisions, support, and what happens after launch."
        />
        <FinalCTASection title="Ready to lock in your launch package?" />
      </main>
    </>
  );
}
