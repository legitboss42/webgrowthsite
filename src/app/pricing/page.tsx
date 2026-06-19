import Link from "next/link";
import FAQSection from "@/components/FAQSection";
import StructuredData from "@/components/StructuredData";
import TrackedLink from "@/components/analytics/TrackedLink";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

const pageDescription =
  "Explore Web Growth website services, from free website reviews and audits to landing pages, redesigns, business websites, speed fixes, and online stores.";

const whatsappHref =
  "https://wa.me/2348066706336?text=Hello%20Web%20Growth%2C%20I%20would%20like%20a%20website%20review.%20Here%20is%20my%20website%2Fbusiness%20detail%3A";

const pricingNote =
  "Final pricing depends on page count, content readiness, design complexity, integrations, timeline, and the level of strategy required.";

type OfferCard = {
  title: string;
  pricing: string;
  description: string;
  includes: readonly string[];
  ctaLabel: string;
  ctaLocation: string;
  ctaName: string;
  serviceHref?: string;
  serviceLabel?: string;
};

const offers: readonly OfferCard[] = [
  {
    title: "Free Quick Website Review",
    pricing: "Free starting point",
    description:
      "For business owners who are not sure what their website needs yet.",
    includes: [
      "Quick look at the website or business details",
      "2-3 main observations",
      "Suggested next step",
      "Recommendation for audit, redesign, landing page, speed fix, or new build",
    ],
    ctaLabel: "Request a Website Review",
    ctaLocation: "pricing_review",
    ctaName: "website_review",
  },
  {
    title: "Website Audit",
    pricing: "Diagnostic review from ₦25,000",
    description:
      "For businesses that need to understand why their website is not building trust, generating enquiries, or supporting conversions.",
    includes: [
      "Homepage clarity review",
      "Trust and credibility review",
      "CTA and enquiry-flow review",
      "Mobile experience review",
      "Speed and performance observations",
      "SEO foundation notes",
      "Priority fix list",
      "Recommended next steps",
    ],
    ctaLabel: "Request a Website Audit",
    ctaLocation: "pricing_audit",
    ctaName: "website_audit",
    serviceHref: "/services/website-audit/",
    serviceLabel: "Website Audit service",
  },
  {
    title: "Website Speed Fix",
    pricing: "Performance improvement from ₦50,000",
    description:
      "For businesses with slow, heavy, or frustrating websites.",
    includes: [
      "Page speed review",
      "Image and asset checks",
      "Script and tracking review",
      "Mobile performance observations",
      "Priority speed fixes",
      "Before and after notes where measurable",
      "Practical recommendations for keeping the site lighter",
    ],
    ctaLabel: "Request a Website Speed Review",
    ctaLocation: "pricing_speed",
    ctaName: "website_speed_review",
    serviceHref: "/services/performance-optimisation/",
    serviceLabel: "Website Speed Optimization service",
  },
  {
    title: "Landing Page Build",
    pricing: "Typical project starting point: ₦180,000+",
    description:
      "For businesses that need one focused page for a specific offer, campaign, booking, signup, product, or enquiry goal.",
    includes: [
      "One focused landing page",
      "Offer structure",
      "Headline and section flow",
      "Problem and outcome messaging",
      "CTA sections",
      "Trust and FAQ sections",
      "Contact form or WhatsApp CTA",
      "Mobile responsive build",
      "Basic SEO metadata",
      "Launch checks",
    ],
    ctaLabel: "Request a Landing Page Review",
    ctaLocation: "pricing_landing_page",
    ctaName: "landing_page_review",
    serviceHref: "/services/landing-page-design/",
    serviceLabel: "Landing Page Design service",
  },
  {
    title: "Business Website Build",
    pricing: "Typical project starting point: ₦350,000+",
    description:
      "For businesses that need a professional website to explain their services, build trust, and support enquiries.",
    includes: [
      "Homepage",
      "About page or section",
      "Service pages or service sections",
      "Contact page",
      "CTA sections",
      "FAQ section",
      "Portfolio or proof section where available",
      "Mobile responsive design",
      "Basic SEO setup",
      "Analytics-ready structure",
      "Launch checks",
    ],
    ctaLabel: "Request a Website Review",
    ctaLocation: "pricing_business_website",
    ctaName: "business_website_review",
    serviceHref: "/services/business-website-design/",
    serviceLabel: "Business Website Design service",
  },
  {
    title: "Website Redesign",
    pricing: "Typical project starting point: ₦450,000+",
    description:
      "For businesses with an outdated, unclear, slow, or low-converting website that needs a stronger structure and user experience.",
    includes: [
      "Current website review",
      "Homepage redesign",
      "Service page restructuring",
      "CTA improvements",
      "Mobile-first redesign",
      "Trust and proof section improvements",
      "Basic SEO migration checks",
      "Speed and launch checks",
    ],
    ctaLabel: "Request a Website Redesign Review",
    ctaLocation: "pricing_redesign",
    ctaName: "website_redesign_review",
    serviceHref: "/services/website-redesign/",
    serviceLabel: "Website Redesign service",
  },
  {
    title: "Online Store Website",
    pricing: "Typical project starting point: ₦600,000+",
    description:
      "For product businesses that need a proper online store or ecommerce website to present products clearly and support enquiry, checkout, or purchase paths.",
    includes: [
      "Store homepage",
      "Product listing structure",
      "Product detail pages",
      "Product categories",
      "WhatsApp enquiry or checkout path",
      "Payment integration where appropriate",
      "Trust and policy sections",
      "Mobile responsive design",
      "Basic SEO setup",
      "Analytics-ready structure",
      "Launch checks",
    ],
    ctaLabel: "Request an Online Store Website Review",
    ctaLocation: "pricing_online_store",
    ctaName: "online_store_review",
    serviceHref: "/services/ecommerce-website-design/",
    serviceLabel: "Online Store Website Design service",
  },
] as const;

const choosingGuidance = [
  "If you are unsure what is wrong, start with the Free Quick Website Review.",
  "If your website exists but is not getting enquiries, start with a Website Audit.",
  "If the site is slow, start with a Website Speed Fix or speed review.",
  "If you need one focused offer page, choose Landing Page Build.",
  "If you need a professional site from scratch, choose Business Website Build.",
  "If your current website is outdated or unclear, choose Website Redesign.",
  "If you sell products, choose Online Store Website.",
] as const;

const pricingFactors = [
  "Number of pages",
  "Content readiness",
  "Design complexity",
  "Copywriting needs",
  "Forms and contact paths",
  "WhatsApp, booking, analytics, or tracking setup",
  "Ecommerce or product requirements",
  "Speed and performance issues",
  "SEO migration needs",
  "Timeline and urgency",
  "Platform or integration requirements",
] as const;

const faqItems = [
  {
    question: "Are these fixed prices?",
    answer:
      "No. These are starting points, not fixed all-inclusive prices. Final pricing is confirmed after reviewing the project scope.",
  },
  {
    question: "Why do website prices vary?",
    answer:
      "Pricing depends on pages, content, design, features, integrations, timeline, and the level of strategy required.",
  },
  {
    question: "Can I start with a free website review?",
    answer:
      "Yes. The free quick review helps identify the best starting point before a deeper audit or build is discussed.",
  },
  {
    question: "What is the difference between a website review and a website audit?",
    answer:
      "A review gives initial direction. An audit is a deeper diagnostic review with clearer recommendations and a more detailed fix list.",
  },
  {
    question: "Do I need a redesign or a new website?",
    answer:
      "It depends on the condition of the current website, how clear the structure is, and whether the existing setup is worth improving or replacing.",
  },
  {
    question: "Can I pay for only a landing page first?",
    answer:
      "Yes. A landing page can be a good first build for one offer, campaign, booking flow, or enquiry goal.",
  },
  {
    question: "Do online store websites cost more than normal business websites?",
    answer:
      "Usually yes, because product structure, checkout or enquiry paths, trust and policy sections, and testing increase scope.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Website Services and Project Starting Points | Web Growth",
  description: pageDescription,
  path: "/pricing/",
  keywords: [
    "website services and project starting points",
    "website pricing",
    "website design pricing",
    "website audit pricing",
    "website redesign pricing",
    "landing page pricing",
    "online store website pricing",
    "website speed fix",
    "business website project",
    "website review",
  ],
});

export default function PricingPage() {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl("/pricing/")}#webpage`,
    url: absoluteUrl("/pricing/"),
    name: "Website Services and Project Starting Points | Web Growth",
    description: pageDescription,
  };

  return (
    <>
      <StructuredData
        data={[
          webPageSchema,
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing/" },
          ]),
        ]}
      />

      <main className="relative overflow-x-clip bg-[#050806] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />

        <section className="relative overflow-hidden border-b border-white/10 py-20 md:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_85%_25%,rgba(16,185,129,0.08),transparent_28%)]" />

          <div className="relative mx-auto max-w-6xl px-6">
            <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                  Website Services
                </p>
                <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-6xl">
                  Website Services and Project Starting Points
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
                  Choose the kind of website support you need, from a quick review
                  or audit to a landing page, redesign, business website, speed
                  fix, or online store build.
                </p>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/64">
                  Project pricing depends on scope, but these starting points help
                  you understand where to begin.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <TrackedLink
                    href="/contact/"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                    ctaName="website_review"
                    ctaLocation="pricing_hero_primary"
                    destination="/contact/"
                    pageType="pricing"
                    offerType="website_review"
                  >
                    Request a Website Review
                  </TrackedLink>
                  <TrackedLink
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                    ctaName="whatsapp"
                    ctaLocation="pricing_hero_whatsapp"
                    destination="whatsapp"
                    pageType="pricing"
                    offerType="website_review"
                  >
                    Send Website Link on WhatsApp
                  </TrackedLink>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {offers.map((offer) => (
                  <article
                    key={offer.title}
                    className="relative overflow-hidden rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.21),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
                    <div className="relative z-10">
                      <p className="text-xs uppercase tracking-[0.14em] text-emerald-200/85">
                        Starting point
                      </p>
                      <h2 className="mt-3 text-lg font-semibold text-white">
                        {offer.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/68">
                        {offer.pricing}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">
                Pricing note
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-white">
                How Project Starting Points Work
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-white/72">
                <p>
                  The listed amounts are starting points, not fixed all-inclusive
                  prices. Web Growth reviews the website, business needs, pages,
                  content, features, timeline, and technical requirements before
                  confirming a quote.
                </p>
                <p>
                  This protects both the client and the project from under-scoping.
                </p>
                <p className="font-medium text-white/88">{pricingNote}</p>
                <p>
                  If you want to see how this approach translates into real website
                  builds, you can also explore the{" "}
                  <Link href="/portfolio/" className="text-emerald-300 hover:text-emerald-200">
                    portfolio
                  </Link>{" "}
                  before sending your request.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-6">
              {offers.map((offer) => (
                <article
                  key={offer.title}
                  className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] p-8"
                >
                  <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-emerald-300/80">
                        Offer
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white">
                        {offer.title}
                      </h2>
                      <p className="mt-3 text-lg font-medium text-emerald-200">
                        {offer.pricing}
                      </p>
                      <p className="mt-4 text-sm leading-7 text-white/72">
                        {offer.description}
                      </p>
                      {offer.title === "Free Quick Website Review" ? (
                        <p className="mt-4 text-sm leading-7 text-white/62">
                          A free review gives you a starting direction. A deeper
                          audit or implementation plan can be discussed after
                          reviewing your request.
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-emerald-300/80">
                        Can include
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {offer.includes.map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm text-white/72"
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <TrackedLink
                          href="/contact/"
                          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                          ctaName={offer.ctaName}
                          ctaLocation={offer.ctaLocation}
                          destination="/contact/"
                          pageType="pricing"
                          offerType={offer.title.toLowerCase()}
                        >
                          {offer.ctaLabel}
                        </TrackedLink>
                        {offer.serviceHref && offer.serviceLabel ? (
                          <Link
                            href={offer.serviceHref}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-black/35 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
                          >
                            {offer.serviceLabel}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">
                  Choosing guide
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-white">
                  How to Choose the Right Option
                </h2>
                <ul className="mt-6 space-y-4 text-sm leading-7 text-white/72">
                  {choosingGuidance.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <TrackedLink
                  href="/contact/"
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                  ctaName="website_review"
                  ctaLocation="pricing_guide"
                  destination="/contact/"
                  pageType="pricing"
                  offerType="website_review"
                >
                  Not sure? Request a Website Review
                </TrackedLink>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/35 p-8">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">
                  Final quote factors
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-white">
                  What Affects Final Pricing?
                </h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {pricingFactors.map((factor) => (
                    <div
                      key={factor}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/72"
                    >
                      {factor}
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm leading-7 text-white/68">
                  Final quotes are confirmed after reviewing the project scope.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FAQSection
          items={faqItems}
          title="Pricing Questions Business Owners Usually Ask"
          description="Clear answers so you can understand the difference between a review, an audit, and a full build before sending your request."
        />

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">
                Next step
              </p>
              <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-[-0.02em] text-white md:text-5xl">
                Not Sure Which Website Option Fits Yet?
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 md:text-base">
                Send your website link or business details and Web Growth will
                review your current situation, then recommend the best next step
                based on your goals, scope, timeline, and budget.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="/contact/"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                  ctaName="website_review"
                  ctaLocation="pricing_final_primary"
                  destination="/contact/"
                  pageType="pricing"
                  offerType="website_review"
                >
                  Request a Website Review
                </TrackedLink>
                <TrackedLink
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                  ctaName="whatsapp"
                  ctaLocation="pricing_final_whatsapp"
                  destination="whatsapp"
                  pageType="pricing"
                  offerType="website_review"
                >
                  Send Website Link on WhatsApp
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
