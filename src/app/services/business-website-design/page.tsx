import Link from "next/link";
import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import FAQSection from "@/components/FAQSection";
import HeroSection from "@/components/HeroSection";
import SocialProofSection from "@/components/SocialProofSection";
import StructuredData from "@/components/StructuredData";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import GeneratedSectionBackground from "@/components/GeneratedSectionBackground";
import { featuredPortfolioCases } from "@/lib/portfolioCases";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const canonicalUrl = "https://webgrowth.info/services/business-website-design/";
const pageDescription =
  "Get a fast, professional business website built to explain your offer clearly, create trust, and turn visitors into enquiries, bookings, or sales.";

const problemItems = [
  {
    title: "The offer is not clear enough",
    answer:
      "Many business websites leave visitors guessing what the company actually does, who it helps, and why they should choose it over other options.",
  },
  {
    title: "The design feels generic or outdated",
    answer:
      "When the layout looks templated, cluttered, or old, the business can lose trust before the visitor even gets to the contact section.",
  },
  {
    title: "Slow pages and weak CTAs lose attention",
    answer:
      "If the website loads slowly, feels awkward on mobile, or does not guide action clearly, visitors leave without enquiring.",
  },
  {
    title: "Trust is not built quickly enough",
    answer:
      "A business website should reduce doubt fast with clearer structure, stronger messaging, and a better conversion path.",
    href: "/services/website-audit/",
    hrefLabel: "Find Out What Is Holding Your Website Back",
  },
] as const;

const outcomes = [
  {
    title: "Clear positioning",
    description:
      "Visitors should quickly understand what the business does, who it helps, and why the offer matters.",
  },
  {
    title: "Stronger trust",
    description:
      "Better structure, visuals, proof, and messaging reduce doubt and make the business feel more credible.",
  },
  {
    title: "Better conversion flow",
    description:
      "Sections and CTAs should guide people naturally toward an enquiry, booking, or purchase instead of leaving them unsure what to do next.",
  },
  {
    title: "Faster experience",
    description:
      "Fast business websites and cleaner mobile usability improve user experience and help the website feel more trustworthy.",
  },
] as const;

const includedItems = [
  {
    title: "Core business pages",
    description:
      "This can include a homepage, about page, service pages, contact section, and the key pages a business needs to explain its offer clearly.",
  },
  {
    title: "Conversion-focused sections",
    description:
      "CTA sections, FAQ blocks, portfolio or proof sections, and trust-building content can be included to support stronger enquiries.",
  },
  {
    title: "Mobile responsive design",
    description:
      "The website is designed to work properly across mobile, tablet, and desktop so the experience feels clean on the screens buyers actually use.",
  },
  {
    title: "SEO-friendly foundations",
    description:
      "Basic SEO setup can include metadata, heading structure, crawlable pages, and a clean technical foundation built for stronger visibility.",
  },
  {
    title: "Performance and analytics readiness",
    description:
      "Performance optimisation and analytics-ready structure can be included so the website is easier to measure and improve after launch.",
  },
  {
    title: "Lead capture paths",
    description:
      "Lead capture forms, WhatsApp links, and clear contact paths can be included where appropriate so visitors know how to take the next step.",
  },
] as const;

const audienceItems = [
  {
    title: "Service and local businesses",
    description:
      "This service fits local businesses and service-based businesses that need a clearer website to support trust and enquiries.",
    href: "/local-business/",
    hrefLabel: "See local business website direction",
  },
  {
    title: "Consultants, clinics, gyms, and small companies",
    description:
      "It also fits consultants, clinics, gyms and fitness brands, real estate businesses, and smaller companies that need a professional business website design upgrade.",
    href: "/website-design-lagos/",
    hrefLabel: "Explore website design Lagos",
  },
  {
    title: "Growing brands with outdated websites",
    description:
      "If the current website feels dated, confusing, or weak on mobile, a redesign or rebuild can improve clarity, structure, and conversion flow.",
    href: "/services/website-redesign/",
    hrefLabel: "See website redesign service",
  },
] as const;

const processSteps = [
  {
    step: "1",
    title: "Website or Business Review",
    description:
      "We review the business, current website if one exists, the audience, the offer, and the goals the website needs to support.",
  },
  {
    step: "2",
    title: "Page Strategy",
    description:
      "We decide the pages, sections, calls to action, and content structure needed to make the website clearer and more useful.",
  },
  {
    step: "3",
    title: "Design and Build",
    description:
      "The website is designed and built as a clean, modern, responsive business website with stronger trust and conversion flow.",
  },
  {
    step: "4",
    title: "SEO and Performance Setup",
    description:
      "Metadata, headings, speed improvements, and basic SEO foundations are added so the site launches with a cleaner technical base.",
  },
  {
    step: "5",
    title: "Launch and Handover",
    description:
      "The website is deployed and checked so important pages, contact paths, and core user flows are working properly.",
  },
] as const;

const whyItems = [
  {
    title: "Built with performance in mind",
    description:
      "Web Growth builds fast business websites with performance in mind so the experience feels cleaner and more credible from the first visit.",
  },
  {
    title: "Designed around conversion, not decoration",
    description:
      "The goal is not to fill pages with design flourishes. The goal is to create a conversion-focused business website that supports action.",
  },
  {
    title: "Clear page structure before design",
    description:
      "Page hierarchy, service positioning, and CTA flow are clarified before visual choices are pushed too far.",
  },
  {
    title: "Mobile-first and SEO-friendly foundations",
    description:
      "Layouts are built mobile-first, structured for stronger search visibility, and prepared with a clean SEO foundation and analytics-ready setup.",
  },
] as const;

const relatedServices = [
  { title: "Website Redesign", href: "/services/website-redesign/" },
  { title: "Landing Page Design", href: "/services/landing-page-design/" },
  { title: "Ecommerce Website Design", href: "/services/ecommerce-website-design/" },
  { title: "Website Audit", href: "/services/website-audit/" },
  { title: "Performance Optimisation", href: "/services/performance-optimisation/" },
] as const;

const faqs = [
  {
    question: "How much does a business website cost?",
    answer:
      "Cost depends on the number of pages, content requirements, features, integrations, and project timeline. A smaller website costs less than a larger site with more pages and technical needs.",
  },
  {
    question: "How long does it take to build a business website?",
    answer:
      "Timeline depends on project scope, revision rounds, content readiness, and integrations. Simpler websites move faster than larger builds with more pages and technical requirements.",
  },
  {
    question: "Can you redesign my existing business website?",
    answer:
      "Yes. Redesign work can improve clarity, speed, structure, user experience, trust, and the overall conversion flow without changing the business itself.",
  },
  {
    question: "Will my website be mobile-friendly?",
    answer:
      "Yes. The website should be mobile-friendly because many buyers first experience the brand from a phone, not a desktop screen.",
  },
  {
    question: "Can the website include WhatsApp or contact forms?",
    answer:
      "Yes. WhatsApp links, contact forms, and other enquiry paths can be included where appropriate so visitors have a clear next step.",
  },
  {
    question: "Will the website be SEO-friendly?",
    answer:
      "Yes. An SEO-friendly foundation can include metadata, clean page structure, headings, crawlable pages, and speed-conscious implementation.",
  },
  {
    question: "Do I need hosting and a domain before starting?",
    answer:
      "Not always. If you already have them, we can work with that setup. If you do not, guidance can be provided so the launch path is clearer.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Business Website Design Service | Web Growth",
  description: pageDescription,
  path: "/services/business-website-design/",
  keywords: [
    "business website design service",
    "business website design Nigeria",
    "professional business website design",
    "website design for businesses",
    "small business website design",
    "conversion-focused business website",
    "business website designer",
    "fast business websites",
    "website design company in Nigeria",
  ],
  image: "/images/hero/Hero-Image-1.webp",
});

export default function Page() {
  const featuredCases = featuredPortfolioCases;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: "Business Website Design Service",
      description: pageDescription,
      url: canonicalUrl,
      serviceType: "Business Website Design Service",
      provider: {
        "@type": "ProfessionalService",
        "@id": `${SITE_URL}#professional-service`,
        name: "Web Growth",
        url: SITE_URL,
      },
      category: "Web Design Service",
    },
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services/" },
      { name: "Business Website Design", path: "/services/business-website-design/" },
    ]),
  ];

  return (
    <>
      <StructuredData data={schema} />

      <main className="relative overflow-x-clip bg-black text-white">
        <HeroSection
          eyebrow="Business Website Design Service"
          title="Business Website Design Service for Companies That Need More Trust and Enquiries"
          description="Web Growth builds fast, professional business websites that explain your offer clearly, create trust quickly, and guide visitors toward enquiries, bookings, or sales."
          primaryLabel="Request a Website Review"
          primaryHref="/contact/"
          secondaryLabel="View Pricing"
          secondaryHref="/pricing/"
          trustLine="Custom-coded websites | Mobile-first layouts | SEO-friendly structure | Fast loading performance | Conversion-focused sections"
          locationNote="This service is for businesses that need a professional business website design approach built around trust, clarity, and conversion, not a generic page that simply exists online."
          fitTags={[
            "Business website design Nigeria",
            "Conversion-focused business website",
            "Fast business websites",
          ]}
          asideTitle="Built to support"
          asideItems={[
            "Clearer offer communication for businesses that need visitors to understand the value faster.",
            "Stronger trust through better page structure, cleaner visuals, and a more credible mobile experience.",
            "A business website designer approach that prioritizes enquiries, booking intent, and better user flow.",
          ]}
          imageAlt="Business website design service page for Web Growth"
        />

        <AnswerHighlightsSection
          eyebrow="The business problem"
          title="Your Website Should Do More Than Just Exist Online"
          description="Many websites underperform because the offer is unclear, the design looks generic or outdated, the page loads slowly, calls to action are weak, and the website does not build trust quickly enough. The result is simple: visitors leave without contacting the business."
          items={problemItems}
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Outcomes
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                A Business Website Built to Support Real Enquiries
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                A professional business website design project should improve how
                clearly the business is understood, how quickly trust is built, and
                how easily visitors can move toward the next step.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {outcomes.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
                >
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/76">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <WhatYouGetSection
          items={includedItems}
          title="What Your Business Website Can Include"
          description="A business website can include the pages, sections, and contact paths needed to explain the offer clearly, support trust, and make enquiries easier."
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#060907] py-20">
          <GeneratedSectionBackground variant="service" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Audience fit
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Who This Service Is For
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                This service is best for businesses that need a stronger website design
                for businesses approach, clearer service positioning, and a better
                enquiry path online.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {audienceItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
                >
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/76">{item.description}</p>
                  <Link
                    href={item.href}
                    className="mt-5 inline-flex text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
                  >
                    {item.hrefLabel}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Process
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                A Clear Process From Website Review to Launch
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The process is designed to reduce uncertainty and make the project
                easier to understand for business owners, not harder.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-5">
              {processSteps.map((item) => (
                <article
                  key={item.step}
                  className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">
                    Step {item.step}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/74">{item.description}</p>
                </article>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/contact/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
              >
                Request a Website Review
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-white/10 bg-[#060907] py-20">
          <GeneratedSectionBackground variant="service" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Why Web Growth
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Why Businesses Choose Web Growth
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Web Growth is designed for businesses that want a website design
                company in Nigeria focused on performance, clarity, and trust rather
                than decoration alone.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {whyItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
                >
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/76">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <SocialProofSection
          cards={featuredCases}
          eyebrow="Selected work"
          title="Selected Website Work"
          description="Explore selected Web Growth website builds, redesign work, and conversion-focused layouts without relying on invented results or exaggerated claims."
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Related services
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Related Website Services
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                If your business needs a different type of website work first, these
                related services are the next logical places to look.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {relatedServices.map((service) => (
                <Link
                  key={service.title}
                  href={service.href}
                  className="rounded-2xl border border-white/10 bg-black/30 p-5 text-base font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition hover:border-emerald-400/35 hover:text-emerald-200"
                >
                  {service.title}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <FAQSection
          items={faqs}
          title="Business Website Design Service FAQs"
          description="Helpful answers for businesses comparing scope, timing, mobile readiness, SEO foundations, and enquiry-focused features."
        />

        <section className="relative overflow-hidden bg-[#050806] py-20">
          <GeneratedSectionBackground variant="cta" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.1),transparent_32%)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <article className="relative overflow-hidden rounded-3xl border border-emerald-500/35 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(8,12,10,0.96)_55%,rgba(0,0,0,0.9))] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <h2 className="text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                    Need a Business Website That Explains Your Offer Clearly?
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                    Send your website link or business details and we&apos;ll help you
                    understand what kind of website structure will support trust,
                    clarity, and enquiries.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/contact/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                  >
                    Request a Website Review
                  </Link>
                  <Link
                    href="/portfolio/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                  >
                    View Selected Website Work
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
