import Link from "next/link";
import StructuredData from "@/components/StructuredData";
import CodeRain from "@/components/CodeRain";
import WebsiteBuildAnimations from "@/components/WebsiteBuildAnimations";
import WebsiteBuildHeroBackground from "@/components/WebsiteBuildHeroBackground";
import WebsiteBuildInquiryForm from "@/components/WebsiteBuildInquiryForm";
import WebsiteBuildSectionBackground from "@/components/WebsiteBuildSectionBackground";
import TrackedLink from "@/components/analytics/TrackedLink";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildPageMetadata,
  buildProfessionalServiceSchema,
} from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pageDescription =
  "High-converting website design and redesign for service and ecommerce brands. Web Growth builds fast premium pages engineered for leads, bookings, and sales.";

const websiteBuildUrl = absoluteUrl("/website-build");

const websiteBuildServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${websiteBuildUrl}#service`,
  name: "High-Converting Website Design and Redesign",
  description: pageDescription,
  url: websiteBuildUrl,
  serviceType: "Website design and redesign agency",
  category: "Website Design Service",
  provider: {
    "@id": `${SITE_URL}#professional-service`,
  },
  areaServed: [
    {
      "@type": "Place",
      name: "Lagos",
    },
    {
      "@type": "Country",
      name: "Nigeria",
    },
  ],
};

const websiteBuildPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${websiteBuildUrl}#webpage`,
  url: websiteBuildUrl,
  name: "High-Converting Website Design Agency | Web Growth",
  description: pageDescription,
  isPartOf: {
    "@id": `${SITE_URL}#website`,
  },
  about: {
    "@id": `${websiteBuildUrl}#service`,
  },
};

const websiteBuildBreadcrumbSchema = buildBreadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Website Build", path: "/website-build" },
]);

const problemCards = [
  {
    title: "Confusing layout",
    text: "If visitors cannot understand your page in seconds, they leave before they trust you.",
  },
  {
    title: "No clear offer",
    text: "When your offer is vague, qualified buyers move to the next clear competitor.",
  },
  {
    title: "Weak call-to-action",
    text: "If the next step is unclear, interested visitors delay action and leads stall.",
  },
  {
    title: "Slow, outdated experience",
    text: "Slow, dated pages kill trust quickly and make premium businesses look low-value.",
  },
] as const;

const services = [
  {
    title: "Website redesigns for local businesses",
    text: "Turn outdated websites into pages that convert more calls and bookings.",
  },
  {
    title: "One-page lead generation websites",
    text: "Focused pages built to convert social clicks, referrals, and outreach fast.",
  },
  {
    title: "E-commerce storefront redesigns",
    text: "Sharper product presentation and a cleaner buying journey to raise purchase intent.",
  },
  {
    title: "Mobile-first landing pages",
    text: "Mobile-first pages so your offer stays premium where cold traffic lands first.",
  },
  {
    title: "Speed and conversion improvements",
    text: "Technical upgrades that remove friction, strengthen trust, and protect traffic spend.",
  },
] as const;

const faqItems = [
  {
    question: "How long does a website build take?",
    answer:
      "Most focused builds move quickly once assets and approvals are ready. You get a clear timeline before we start.",
  },
  {
    question: "Do you redesign existing websites?",
    answer:
      "Yes. Redesigns are a core service, especially when your current site feels weak on mobile or hard to trust.",
  },
  {
    question: "Can you build for local businesses and online stores?",
    answer:
      "Yes. We build conversion-focused websites for both local service brands and ecommerce businesses.",
  },
  {
    question: "Will my website work well on mobile?",
    answer:
      "Yes. Every build is mobile-first so your website stays clean, fast, and easy to act on across devices.",
  },
  {
    question: "What do I need to get started?",
    answer:
      "Share your business details, current website (if any), and what needs fixing. We handle the build path from there.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "High-Converting Website Design Agency | Web Growth",
  description: pageDescription,
  path: "/website-build",
  keywords: [
    "high-converting website design agency",
    "website redesign agency",
    "high-performance web design",
    "custom next.js website development",
    "conversion-focused web design",
    "premium web design agency",
    "website design for service businesses",
    "ecommerce website redesign agency",
    "fast-loading website development",
  ],
  image: "/images/hero/Hero-Image-1.webp",
});

export default function WebsiteBuildPage() {
  return (
    <>
      <WebsiteBuildAnimations />
      <StructuredData
        data={[
          buildProfessionalServiceSchema("/website-build", pageDescription),
          websiteBuildServiceSchema,
          websiteBuildPageSchema,
          websiteBuildBreadcrumbSchema,
          buildFaqSchema(faqItems),
        ]}
      />

      <main id="website-build-page" className="relative overflow-x-clip bg-[#040705] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:38px_38px] opacity-20" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/14 blur-3xl" />

        <section id="website-build-hero" className="relative overflow-hidden border-b border-white/10 py-16 md:py-24">
          <WebsiteBuildHeroBackground />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35 [mask-image:linear-gradient(180deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.6)_56%,transparent_100%)]"
          >
            <CodeRain />
          </div>
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-start gap-10 lg:grid-cols-[1.03fr_0.97fr]">
              <div>
                <p
                  data-wb-hero-kicker
                  className="text-xs uppercase tracking-[0.22em] text-emerald-300/85"
                >
                  High-Converting Website Design Agency
                </p>
                <h1
                  data-wb-hero-title
                  className="mt-4 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-6xl"
                >
                  Your Website Should Convert Traffic, Not Waste It
                </h1>
                <p data-wb-hero-copy className="mt-5 max-w-2xl text-lg leading-8 text-white/74">
                  We engineer fast, premium websites for service businesses and ecommerce
                  brands. Custom Next.js builds, conversion architecture, and stronger SEO
                  foundations that turn traffic into leads, bookings, and sales.
                </p>

                <div
                  data-wb-hero-cta
                  className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <TrackedLink
                    href="#inquiry-form"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_36px_rgba(5,150,105,0.35)] transition hover:bg-emerald-600"
                    ctaName="book_website_build"
                    ctaLocation="website_build_hero_primary"
                    destination="#inquiry-form"
                    pageType="website_build_landing"
                    offerType="website_build"
                  >
                    Get My Website Build Plan
                  </TrackedLink>
                  <TrackedLink
                    href="#problems"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-black/30 px-7 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white"
                    ctaName="see_what_we_fix"
                    ctaLocation="website_build_hero_secondary"
                    destination="#problems"
                    pageType="website_build_landing"
                    offerType="website_build"
                  >
                    See What We Fix
                  </TrackedLink>
                </div>

                <p className="mt-4 text-sm text-white/68">Built for serious businesses investing in growth.</p>
                <p data-wb-hero-meta className="mt-2 text-sm text-white/62">
                  First impression speed | Mobile-first UX | Conversion architecture
                </p>
                <p className="mt-3 text-sm text-white/66">
                  Need a specialised track? Explore{" "}
                  <Link href="/local-business" className="text-emerald-200 hover:text-emerald-100">
                    local business website design
                  </Link>{" "}
                  and{" "}
                  <Link href="/ecommerce" className="text-emerald-200 hover:text-emerald-100">
                    ecommerce website redesign
                  </Link>{" "}
                  services.
                </p>
              </div>

              <div
                data-wb-hero-panel
                className="rounded-3xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-5 shadow-[0_20px_52px_rgba(0,0,0,0.3)] backdrop-blur-xl md:p-6"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-200/95">
                  [ Conversion contrast ]
                </p>
                <div data-wb-card-group className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div
                    data-wb-card
                    className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-red-200/90">
                      Typical weak page
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-white/76">
                      <li>Social click to slow load</li>
                      <li>Generic message to weak trust</li>
                      <li>No clear offer to no urgency</li>
                      <li>No path to action to bounce</li>
                    </ul>
                  </div>

                  <div
                    data-wb-card
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-200/95">
                      Web Growth build
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-white/82">
                      <li>Social click to fast first impression</li>
                      <li>Clear offer to instant clarity</li>
                      <li>Premium trust cues to higher confidence</li>
                      <li>Strong CTA path to inquiry or sale</li>
                    </ul>
                  </div>
                </div>

                <div
                  data-wb-card
                  className="mt-4 rounded-2xl border border-emerald-400/24 bg-emerald-500/10 p-4"
                >
                  <p className="text-sm leading-6 text-white/74">
                    Same traffic source. Different page quality. Different revenue outcome.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="problems"
          data-wb-reveal
          className="relative overflow-hidden border-b border-white/10 bg-[#050a07] py-16 md:py-20"
        >
          <WebsiteBuildSectionBackground variant="problem" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.02em] md:text-5xl">
                Why Most Business Websites Don&apos;t Convert
              </h2>
            </div>

            <div data-wb-card-group className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {problemCards.map((item) => (
                <article
                  key={item.title}
                  data-wb-card
                  className="rounded-2xl border border-white/10 bg-black/35 p-5 shadow-[0_14px_36px_rgba(0,0,0,0.22)]"
                >
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/68">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section data-wb-reveal className="relative overflow-hidden border-b border-white/10 py-16 md:py-20">
          <WebsiteBuildSectionBackground variant="comparison" />
          <div className="relative mx-auto max-w-6xl px-6">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.02em] md:text-5xl">
              From &ldquo;Looks Fine&rdquo; to &ldquo;Consistently Converts&rdquo;
            </h2>

            <div data-wb-card-group className="mt-10 grid gap-6 md:grid-cols-2">
              <article
                data-wb-card
                className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-red-200/90">Before</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-white/80">
                  <li>Cluttered structure</li>
                  <li>Confusing message</li>
                  <li>Weak trust signals</li>
                  <li>No clear conversion path</li>
                </ul>
              </article>

              <article
                data-wb-card
                className="rounded-3xl border border-emerald-400/28 bg-emerald-500/10 p-6"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/95">After</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                  <li>Clear positioning fast</li>
                  <li>Premium first impression</li>
                  <li>Trust-building structure</li>
                  <li>Built to turn visitors into customers</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section data-wb-reveal className="relative overflow-hidden border-b border-white/10 bg-[#050a07] py-16 md:py-20">
          <WebsiteBuildSectionBackground variant="services" />
          <div className="relative mx-auto max-w-6xl px-6">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.02em] md:text-5xl">
              What We Build to Increase Revenue
            </h2>

            <div data-wb-card-group className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <article
                  key={service.title}
                  data-wb-card
                  className="rounded-2xl border border-white/10 bg-black/35 p-5 shadow-[0_14px_36px_rgba(0,0,0,0.22)]"
                >
                  <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/68">{service.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section data-wb-reveal className="relative overflow-hidden border-b border-white/10 py-16 md:py-20">
          <WebsiteBuildSectionBackground variant="audience" />
          <div className="relative mx-auto max-w-6xl px-6">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.02em] md:text-5xl">
              Built for Businesses That Need Revenue, Not Just Design
            </h2>

            <div data-wb-card-group className="mt-10 grid gap-6 md:grid-cols-2">
              <article
                data-wb-card
                className="rounded-3xl border border-white/10 bg-black/35 p-6"
              >
                <h3 className="text-xl font-semibold text-white">Local Businesses</h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-white/75">
                  <li>More calls</li>
                  <li>More bookings</li>
                  <li>More walk-ins</li>
                  <li>Stronger trust online</li>
                </ul>
              </article>

              <article
                data-wb-card
                className="rounded-3xl border border-white/10 bg-black/35 p-6"
              >
                <h3 className="text-xl font-semibold text-white">E-commerce Brands</h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-white/75">
                  <li>Better product presentation</li>
                  <li>Clearer buying journey</li>
                  <li>Higher add-to-cart intent</li>
                  <li>More sales from existing traffic</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section data-wb-reveal className="relative overflow-hidden border-b border-white/10 bg-[#050a07] py-16 md:py-20">
          <WebsiteBuildSectionBackground variant="process" />
          <div className="relative mx-auto max-w-6xl px-6">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.02em] md:text-5xl">
              Simple Process. Fast Delivery.
            </h2>

            <div data-wb-card-group className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                "We review your current site or goal",
                "We design and build a cleaner, higher-converting page",
                "You launch with a site built to win customers",
              ].map((step, index) => (
                <article
                  key={step}
                  data-wb-card
                  className="rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_14%_-8%,rgba(16,185,129,0.2),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
                >
                  <span className="inline-flex rounded-md border border-white/20 bg-black/45 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-200/95">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-3 text-sm leading-6 text-white/80">{step}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section data-wb-reveal className="relative overflow-hidden border-b border-white/10 py-16 md:py-20">
          <WebsiteBuildSectionBackground variant="faq" />
          <div className="relative mx-auto max-w-4xl px-6">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.02em] md:text-5xl">
              Questions Before Hiring a Website Redesign Agency
            </h2>

            <div data-wb-card-group className="mt-10 space-y-4">
              {faqItems.map((item) => (
                <article
                  key={item.question}
                  data-wb-card
                  className="rounded-2xl border border-white/10 bg-black/35 p-5"
                >
                  <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section data-wb-reveal className="relative overflow-hidden border-b border-white/10 bg-[#050a07] py-16 md:py-20">
          <WebsiteBuildSectionBackground variant="final" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div
              data-wb-card
              className="rounded-3xl border border-emerald-500/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(8,12,10,0.95)_55%,rgba(0,0,0,0.9))] p-6 shadow-[0_22px_56px_rgba(0,0,0,0.3)] md:p-8"
            >
              <h2 className="text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
                Ready for a Website That Converts More of Your Traffic?
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-white/78">
                Let&apos;s build a premium page that earns trust in seconds and guides
                serious buyers to take action.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <TrackedLink
                  href="#inquiry-form"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white transition hover:bg-emerald-600"
                  ctaName="book_website_build"
                  ctaLocation="website_build_final_cta"
                  destination="#inquiry-form"
                  pageType="website_build_landing"
                  offerType="website_build"
                >
                  Claim a Build Slot
                </TrackedLink>
                <p className="text-sm text-emerald-200/90">
                  We cap monthly onboarding to keep execution senior-led and fast.
                </p>
              </div>
            </div>

            <div data-wb-reveal className="mt-8">
              <WebsiteBuildInquiryForm />
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-center text-sm text-white/70">
              <p className="font-semibold text-white">Web Growth</p>
              <p>webgrowth.info</p>
              <p className="mt-1 text-white/60">Websites built to convert.</p>
            </div>
          </div>
        </section>

        <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
          <TrackedLink
            href="#inquiry-form"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.35)] transition hover:bg-emerald-600"
            ctaName="book_website_build"
            ctaLocation="website_build_sticky_mobile"
            destination="#inquiry-form"
            pageType="website_build_landing"
            offerType="website_build"
          >
            Book Your Website Build
          </TrackedLink>
        </div>
      </main>
    </>
  );
}
