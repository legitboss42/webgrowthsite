import Link from "next/link";
import CaseStudyCard from "@/components/CaseStudyCard";
import StructuredData from "@/components/StructuredData";
import TrackedLink from "@/components/analytics/TrackedLink";
import { portfolioCases } from "@/lib/portfolioCases";
import {
  buildFaqSchema,
  buildPageMetadata,
  buildProfessionalServiceSchema,
} from "@/lib/seo";
import { BOOKING_URL } from "@/lib/site";

const pageDescription =
  "Ecommerce website redesign built for speed, stronger conversion, cleaner shopping journeys, and more trustworthy checkout experiences.";

const valueProps = [
  {
    title: "Faster storefronts",
    text: "Shoppers leave slow pages fast. The storefront has to load quickly and feel smooth on mobile before anything else matters.",
  },
  {
    title: "Better conversion paths",
    text: "Products, categories, and buying actions need a cleaner hierarchy so people can move through the store without friction.",
  },
  {
    title: "Checkout trust",
    text: "The design has to feel reassuring enough for someone to keep going instead of second-guessing the purchase.",
  },
  {
    title: "Growth-ready structure",
    text: "A better ecommerce build should be easier to expand, easier to optimise, and easier to run without constant duct-tape fixes.",
  },
] as const;

const architecturePoints = [
  "Fast, clean product and category layouts",
  "Strong mobile shopping experience",
  "Clear hierarchy for offers, collections, and CTAs",
  "Trust cues that support checkout confidence",
  "Structure that can scale with more products later",
] as const;

const process = [
  {
    title: "Audit the buying flow",
    text: "We look at where the friction is: the product page, the category structure, the messaging, or the overall shopping experience.",
  },
  {
    title: "Design the storefront",
    text: "The layout is rebuilt around speed, product clarity, and a buying journey that feels easier to follow.",
  },
  {
    title: "Launch the right foundation",
    text: "The goal is a storefront that feels stronger now and gives you something cleaner to scale later.",
  },
] as const;

const faqs = [
  {
    question: "Who is this for?",
    answer:
      "Ecommerce brands, online stores, and product businesses that need a better storefront, cleaner conversion flow, and a more trustworthy shopping experience.",
  },
  {
    question: "Is this about design only?",
    answer:
      "No. The point is not to make the store look nicer in isolation. It is to improve how the storefront feels, how easy it is to shop, and how confidently people move toward checkout.",
  },
  {
    question: "Do you only work on big ecommerce builds?",
    answer:
      "No. Some stores need a cleaner first version or a focused conversion improvement before they need anything larger.",
  },
  {
    question: "What usually matters most first?",
    answer:
      "Speed, product clarity, trust, and the overall buying path. If those are weak, more traffic will not solve much.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Ecommerce Website Redesign Agency | Web Growth",
  description: pageDescription,
  path: "/ecommerce",
  keywords: [
    "ecommerce website design",
    "ecommerce website redesign",
    "ecommerce redesign agency",
    "online store web design",
    "premium storefront design",
    "ecommerce conversion website",
    "fast ecommerce website",
  ],
  image: "/images/portfolio/treats-by-ann-desktop.jpg",
});

export default function EcommercePage() {
  const featuredCases = [
    ...portfolioCases.filter((item) => item.type === "E-commerce"),
    ...portfolioCases.filter((item) => item.type !== "E-commerce" && item.status !== "Proposal").slice(0, 2),
  ].slice(0, 3);

  return (
    <>
      <StructuredData
        data={[
          buildProfessionalServiceSchema("/ecommerce", pageDescription),
          buildFaqSchema(faqs),
        ]}
      />

      <main className="bg-[#050806] text-white">
        <section className="relative overflow-hidden border-b border-white/10 py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(16,185,129,0.1),transparent_28%)]" />
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/85">
                Ecommerce websites
              </p>
              <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-6xl">
                Ecommerce storefronts built for speed, trust, and better conversion
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
                If the store feels slow, cluttered, or harder to shop than it should,
                a prettier layout alone will not fix much. The storefront has to be
                fast, clear, and easier for people to buy from.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="/contact?service=Ecommerce Website Design"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white transition hover:bg-emerald-600"
                  ctaName="request_quote"
                  ctaLocation="ecommerce_hero_primary"
                  destination="/contact?service=Ecommerce Website Design"
                  pageType="ecommerce"
                  offerType="ecommerce"
                >
                  Get My Ecommerce Quote
                </TrackedLink>
                <TrackedLink
                  href={BOOKING_URL}
                  target={BOOKING_URL.startsWith("http") ? "_blank" : undefined}
                  rel={BOOKING_URL.startsWith("http") ? "noreferrer" : undefined}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition hover:border-white/40 hover:bg-black/50"
                  ctaName="booking"
                  ctaLocation="ecommerce_hero_secondary"
                  destination="booking"
                  pageType="ecommerce"
                  offerType="ecommerce"
                >
                  Book a Call
                </TrackedLink>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/70">
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                  Fast storefronts
                </span>
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                  Checkout trust
                </span>
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                  Conversion-focused UX
                </span>
              </div>
              <p className="mt-4 text-sm text-white/64">
                Running both service and ecommerce funnels? See{" "}
                <Link href="/website-build" className="text-emerald-200 hover:text-emerald-100">
                  website design and redesign services
                </Link>
                .
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-7 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-200/95">
                [ What a better storefront should do ]
              </p>
              <div className="mt-6 grid gap-4">
                {valueProps.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-black/30 p-5"
                  >
                    <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-white/74">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#060907] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Architecture highlights
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
                The structure matters as much as the visuals
              </h2>
              <p className="mt-4 text-lg leading-7 text-white/72">
                A stronger store is usually a combination of speed, clearer product hierarchy, and a buying path that feels more natural.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {architecturePoints.map((item, index) => (
                <article
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/35 p-5 shadow-[0_14px_30px_rgba(0,0,0,0.2)]"
                >
                  <span className="inline-flex rounded-md border border-white/20 bg-black/45 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-200/95">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-4 text-sm leading-7 text-white/78">{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-black py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Proof
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
                A few projects that show the standard
              </h2>
              <p className="mt-4 text-lg leading-7 text-white/72">
                Treats by Ann is the clearest ecommerce example, with supporting work shown to give a fuller sense of the quality bar.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {featuredCases.map((item) => (
                <CaseStudyCard
                  key={item.title}
                  title={item.title}
                  client={item.client}
                  status={item.status}
                  summary={item.summary}
                  results={item.results}
                  imageUrl={item.imageUrl}
                  imageAlt={item.imageAlt}
                  href={item.liveUrl}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#060907] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Process
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
                How the ecommerce work usually moves
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {process.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-3xl border border-white/10 bg-black/40 p-7 shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
                >
                  <span className="inline-flex rounded-md border border-white/20 bg-black/45 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-200/95">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/72">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-black py-24">
          <div className="mx-auto max-w-4xl px-6">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
              FAQ
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
              Questions ecommerce brands usually ask first
            </h2>

            <div className="mt-10 space-y-4">
              {faqs.map((item) => (
                <article
                  key={item.question}
                  className="rounded-2xl border border-white/10 bg-black/40 p-6"
                >
                  <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/72">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-3xl border border-emerald-500/35 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(8,12,10,0.96)_55%,rgba(0,0,0,0.9))] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                    Ready
                  </p>
                  <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
                    Need a storefront that feels better to shop and easier to trust?
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                    If the current store feels slow, cluttered, or harder to buy from than it should, that is the first thing to fix.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <TrackedLink
                    href="/contact?service=Ecommerce Website Design"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white transition hover:bg-emerald-600"
                    ctaName="request_quote"
                    ctaLocation="ecommerce_final_primary"
                    destination="/contact?service=Ecommerce Website Design"
                    pageType="ecommerce"
                    offerType="ecommerce"
                  >
                    Get My Ecommerce Quote
                  </TrackedLink>
                  <Link
                    href="/website-build"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition hover:border-white/40 hover:bg-black/50"
                  >
                    See Full Website Build Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
