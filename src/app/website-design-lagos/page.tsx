import Link from "next/link";
import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import FAQSection from "@/components/FAQSection";
import HeroSection from "@/components/HeroSection";
import StructuredData from "@/components/StructuredData";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import GeneratedSectionBackground from "@/components/GeneratedSectionBackground";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const canonicalUrl = "https://webgrowth.info/website-design-lagos/";
const pageDescription =
  "Get a fast, trustworthy website for your Lagos business, built to explain your services clearly, build local trust, and support calls, bookings, or enquiries.";

const problemItems = [
  {
    title: "Visitors do not understand the service quickly",
    answer:
      "Many Lagos businesses lose enquiries because the website does not explain the service clearly enough before the visitor decides whether to call or leave.",
  },
  {
    title: "The website does not build enough trust",
    answer:
      "If the site feels outdated, incomplete, or weak on mobile, potential customers may hesitate before they message, book, or request a quote.",
  },
  {
    title: "Contact and WhatsApp paths feel hidden",
    answer:
      "When contact details, WhatsApp CTAs, or booking actions are hard to find, the website creates friction instead of helping the next step happen faster.",
  },
  {
    title: "The local business context is not clear enough",
    answer:
      "A website design Lagos page should help the business show what it offers, where it serves, and why a local customer should trust it before making contact.",
    href: "/services/website-audit/",
    hrefLabel: "Find Out What Is Holding Your Website Back",
  },
] as const;

const websiteNeeds = [
  {
    title: "Clear service message",
    description:
      "Customers should quickly understand what you offer, who you help, and how to contact you without guessing.",
  },
  {
    title: "Local trust signals",
    description:
      "Location context, service areas, proof, process, FAQs, and clear contact options help reduce doubt and make the business feel more credible.",
  },
  {
    title: "Simple enquiry path",
    description:
      "Calls, WhatsApp, forms, bookings, or directions should be easy to find so the customer always knows the next step.",
  },
  {
    title: "Mobile-first experience",
    description:
      "Many Lagos customers browse on phones first, so the website must feel clear, fast, and easy to use on smaller screens.",
  },
  {
    title: "Fast-loading pages",
    description:
      "Speed supports trust and makes the site easier to use, especially for local visitors making quick service decisions.",
  },
  {
    title: "SEO-friendly structure",
    description:
      "Clear headings, titles, descriptions, internal links, and crawlable content help support local search visibility and future marketing.",
  },
] as const;

const outcomes = [
  {
    title: "Clearer service presentation",
    description:
      "Customers understand what you do, what makes the service useful, and how they can take the next step.",
  },
  {
    title: "Stronger local trust",
    description:
      "The website gives visitors more confidence before they call, message, or book.",
  },
  {
    title: "Easier contact flow",
    description:
      "Calls, WhatsApp, forms, and booking actions become easier to find and use.",
  },
  {
    title: "Better mobile experience",
    description:
      "The site feels easier to use for customers browsing on phones across Lagos.",
  },
  {
    title: "Better foundation for search visibility",
    description:
      "The website is structured to support local search visibility and future marketing with a cleaner foundation.",
  },
] as const;

const includedItems = [
  {
    title: "Homepage and service sections",
    description:
      "This can include a homepage, service sections, or focused service pages that explain the offer and the next step clearly.",
  },
  {
    title: "Contact and WhatsApp paths",
    description:
      "WhatsApp CTAs, click-to-call links, contact forms, and booking links can be included where appropriate for the business model.",
  },
  {
    title: "Trust and proof sections",
    description:
      "About content, FAQ sections, gallery or proof areas, and local trust sections can be added to help visitors feel more confident.",
  },
  {
    title: "Location and service-area context",
    description:
      "Location sections, service-area details, and Google Maps embed support can be included where appropriate for Lagos businesses.",
  },
  {
    title: "Technical foundation",
    description:
      "Basic SEO metadata, mobile responsive design, analytics-ready structure, and a fast-loading layout can be included in the build.",
  },
  {
    title: "Flexible enquiry setup",
    description:
      "The website can be shaped around calls, bookings, WhatsApp enquiries, or lead forms depending on how the business sells.",
  },
] as const;

const businessTypes = [
  {
    title: "Clinics, wellness, and beauty businesses",
    description:
      "This fits clinics, med spas, skincare businesses, salons, and other brands in Lagos that need stronger trust before someone books or messages.",
  },
  {
    title: "Professional and local service businesses",
    description:
      "It also suits consultants, home service businesses, real estate businesses, cleaners, and other Lagos service providers that rely on enquiries.",
  },
  {
    title: "Gyms, schools, food, retail, and product brands",
    description:
      "Gyms, training centers, restaurants, local retail businesses, and product brands moving beyond Instagram or WhatsApp can also benefit from a clearer website structure.",
  },
] as const;

const processSteps = [
  {
    step: "1",
    title: "Business Review",
    description:
      "We review the business, services, customers, Lagos location context, enquiry path, and the goals the website needs to support.",
  },
  {
    step: "2",
    title: "Page and CTA Plan",
    description:
      "We decide the pages, sections, calls to action, WhatsApp links, booking paths, and trust content the site needs.",
  },
  {
    step: "3",
    title: "Content Direction",
    description:
      "The copy is structured so customers can understand the offer faster and know what to do next without confusion.",
  },
  {
    step: "4",
    title: "Design and Build",
    description:
      "The website is built as a fast, mobile-friendly experience that presents the business clearly and supports local enquiries.",
  },
  {
    step: "5",
    title: "SEO and Launch Checks",
    description:
      "Metadata, headings, mobile layout, forms, contact links, and key pages are checked before launch.",
  },
  {
    step: "6",
    title: "Handover",
    description:
      "The website goes live and the important contact paths are confirmed to be working properly.",
  },
] as const;

const whyItems = [
  {
    title: "Built around trust, clarity, and enquiries",
    description:
      "Web Growth treats Lagos business website design as a trust and conversion problem, not just a visual design exercise.",
  },
  {
    title: "Mobile-first layouts",
    description:
      "The experience is built for phones first because many Lagos customers browse, compare, and enquire from mobile.",
  },
  {
    title: "Clear contact paths",
    description:
      "Calls, WhatsApp, bookings, and forms are easier to find so the next step feels obvious instead of buried.",
  },
  {
    title: "Clearer service sections",
    description:
      "The site helps explain the business before the owner has to speak, with a clearer service structure and less friction for the visitor.",
  },
  {
    title: "Clean SEO foundation without complexity",
    description:
      "The build uses a clean SEO foundation and avoids unnecessary complexity while supporting local visibility and future marketing.",
  },
] as const;

const relatedServices = [
  { title: "Website Design for Small Business", href: "/local-business/" },
  { title: "Business Website Design", href: "/services/business-website-design/" },
  { title: "Website Redesign", href: "/services/website-redesign/" },
  { title: "Landing Page Design", href: "/services/landing-page-design/" },
  { title: "Website Audit", href: "/services/website-audit/" },
  { title: "Performance Optimisation", href: "/services/performance-optimisation/" },
] as const;

const faqs = [
  {
    question: "Do you offer website design in Lagos?",
    answer:
      "Yes. Web Growth can help Lagos businesses with business websites, redesigns, landing pages, online stores, audits, and performance improvements.",
  },
  {
    question: "What type of website does a Lagos business need?",
    answer:
      "A Lagos business usually needs a clear homepage, service information, trust content, contact paths, and a mobile-friendly layout that supports enquiries.",
  },
  {
    question: "How much does website design in Lagos cost?",
    answer:
      "Cost depends on the number of pages, content, features, integrations, and the project timeline. Simpler websites cost less than broader builds.",
  },
  {
    question: "Can the website include WhatsApp and click-to-call buttons?",
    answer:
      "Yes. WhatsApp, click-to-call, contact forms, and booking links can be included where appropriate based on how the business wants customers to get in touch.",
  },
  {
    question: "Can you redesign my existing Lagos business website?",
    answer:
      "Yes. Existing websites can be redesigned to improve clarity, trust, speed, and enquiry flow when the current site feels outdated or weak.",
  },
  {
    question: "Will the website help my business appear on Google?",
    answer:
      "The website can include a clean SEO foundation with better structure, headings, titles, and descriptions, but rankings are not guaranteed.",
  },
  {
    question: "How long does it take to build a business website?",
    answer:
      "Timeline depends on the project scope, content readiness, revision speed, and feature requirements. A smaller site usually moves faster than a broader build.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Website Design Lagos | Web Growth",
  description: pageDescription,
  path: "/website-design-lagos/",
  keywords: [
    "website design Lagos",
    "website design in Lagos",
    "website designer in Lagos",
    "web design Lagos",
    "website design company in Lagos",
    "business website design Lagos",
    "small business website design Lagos",
    "website designer Lagos Nigeria",
    "website development Lagos",
    "Lagos business website design",
    "website design for Lagos businesses",
  ],
  image: "/images/services/services-business.webp",
});

export default function WebsiteDesignLagosPage() {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: "Website Design Lagos",
      alternateName: "Website Design in Lagos",
      description: pageDescription,
      url: canonicalUrl,
      serviceType: "Website Design in Lagos",
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
      { name: "Website Design Lagos", path: "/website-design-lagos/" },
    ]),
  ];

  return (
    <>
      <StructuredData data={schema} />

      <main className="relative overflow-x-clip bg-black text-white">
        <HeroSection
          eyebrow="Website Design Lagos"
          title="Website Design in Lagos for Businesses That Need More Enquiries"
          description="Web Growth builds fast, trustworthy websites for Lagos businesses that need to explain their services clearly, build local trust, and make it easier for customers to call, book, message, or enquire."
          primaryLabel="Request a Lagos Website Review"
          primaryHref="/contact/"
          secondaryLabel="View Small Business Website Design"
          secondaryHref="/local-business/"
          trustLine="Lagos business website design | Mobile-first layouts | WhatsApp and contact CTAs | Local trust sections | SEO-friendly foundation"
          locationNote="This page is specifically for Lagos businesses that need a website built around local trust, clearer service presentation, and easier enquiry flow."
          fitTags={[
            "Website design in Lagos",
            "Website designer Lagos Nigeria",
            "Lagos business website design",
          ]}
          asideTitle="Built to support"
          asideItems={[
            "Clearer service presentation so Lagos customers quickly understand what the business offers and how to make contact.",
            "Stronger local trust through better mobile presentation, clearer service areas, and stronger contact visibility.",
            "Better enquiry flow for businesses that rely on calls, bookings, WhatsApp messages, or lead forms from local traffic.",
          ]}
          imageAlt="Website design in Lagos page for Web Growth"
        />

        <AnswerHighlightsSection
          eyebrow="The Lagos business problem"
          title="Many Lagos Business Websites Do Not Make It Easy for Customers to Take Action"
          description="Lagos businesses often lose enquiries because the service is unclear, the website feels weak on mobile, the contact path is buried, or the site does not build enough trust before the visitor decides whether to reach out."
          items={problemItems}
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Core elements
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                What a Lagos Business Website Needs to Work
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                A website designer in Lagos should be helping the business earn trust
                faster and make the next action easier, not just deliver a page that
                looks acceptable.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {websiteNeeds.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
                >
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/76">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-white/10 bg-[#060907] py-20">
          <GeneratedSectionBackground variant="service" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Outcomes
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                A Lagos Website Built to Support Local Trust and Enquiries
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The goal is to make the business easier to understand, easier to trust,
                and easier to contact without unnecessary friction.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
          title="What Your Lagos Business Website Can Include"
          description="The website can include the pages, contact paths, and trust sections needed to help local customers understand the business and act more easily."
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Business fit
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Lagos Businesses This Service Can Help
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                This page is for Lagos businesses that need a clearer, faster, more
                trustworthy website built around local enquiries.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {businessTypes.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
                >
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/76">{item.description}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href="/local-business/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Website Design for Small Business
              </Link>
              <Link
                href="/services/business-website-design/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Business Website Design
              </Link>
              <Link
                href="/services/website-redesign/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Website Redesign
              </Link>
              <Link
                href="/services/landing-page-design/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Landing Page Design
              </Link>
              <Link
                href="/services/website-audit/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Website Audit
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-white/10 bg-[#060907] py-20">
          <GeneratedSectionBackground variant="service" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Process
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                A Clear Website Process for Lagos Businesses
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The website is planned around how your Lagos business actually gets
                calls, bookings, messages, or enquiries.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
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
                Request a Lagos Website Review
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Why Web Growth
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Why Lagos Businesses Choose Web Growth
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Web Growth builds Lagos business websites around clarity, trust,
                enquiry flow, and a cleaner local visibility foundation.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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

        <section className="relative overflow-hidden border-b border-white/10 bg-[#060907] py-20">
          <GeneratedSectionBackground variant="service" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Related services
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Related Website Services
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                If the project needs a broader or different type of website support,
                these are the closest next services to consider.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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
          title="Website Design in Lagos FAQs"
          description="Helpful answers for Lagos businesses comparing pricing, WhatsApp CTAs, redesign needs, booking systems, and how the website supports trust and visibility."
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
                    Need a Lagos Business Website That Helps Customers Take Action?
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                    Send your business details or current website link and we&apos;ll
                    review what your website needs to explain your services clearly,
                    build trust, and support calls, bookings, WhatsApp enquiries, or
                    leads.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/contact/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                  >
                    Request a Lagos Website Review
                  </Link>
                  <Link
                    href="/local-business/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                  >
                    Explore Small Business Website Design
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
