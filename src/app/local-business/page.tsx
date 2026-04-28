import Link from "next/link";
import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import FAQSection from "@/components/FAQSection";
import HeroSection from "@/components/HeroSection";
import SocialProofSection from "@/components/SocialProofSection";
import StructuredData from "@/components/StructuredData";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import GeneratedSectionBackground from "@/components/GeneratedSectionBackground";
import { portfolioCases } from "@/lib/portfolioCases";
import { buildBreadcrumbSchema, buildFaqSchema, buildPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const canonicalUrl = "https://webgrowth.info/local-business/";
const pageDescription =
  "Get a fast, trustworthy small business website built to explain your services clearly, build local trust, and support calls, bookings, WhatsApp enquiries, or leads.";

const problemItems = [
  {
    title: "Visitors do not understand the service quickly",
    answer:
      "Many small business websites struggle because customers cannot immediately tell what the business offers, who it helps, or why they should make contact.",
  },
  {
    title: "The business does not feel trustworthy enough",
    answer:
      "If the website feels outdated, incomplete, or unclear, local customers may hesitate before they call, book, or send a WhatsApp message.",
  },
  {
    title: "Contact paths are too hard to find",
    answer:
      "Weak mobile design, hidden WhatsApp links, missing contact details, and unclear booking steps create extra friction before enquiry.",
  },
  {
    title: "The website is online but not helping enough",
    answer:
      "A website for small business in Nigeria should help explain the service, answer key questions, and make action easier instead of simply existing online.",
    href: "/services/website-audit/",
    hrefLabel: "Find Out What Is Holding Your Website Back",
  },
] as const;

const websiteNeeds = [
  {
    title: "Clear service message",
    description:
      "Customers should quickly understand what you offer, who you help, and how they can contact you without having to search for the basics.",
  },
  {
    title: "Local trust signals",
    description:
      "Location, process, proof, FAQs, contact options, and clear service information help reduce doubt and make the business feel more credible.",
  },
  {
    title: "Simple enquiry path",
    description:
      "Calls, WhatsApp, forms, bookings, or directions should be easy to find so the customer always knows the next step.",
  },
  {
    title: "Mobile-first experience",
    description:
      "A website for local service business needs to work properly on phones because many local customers browse and enquire from mobile first.",
  },
  {
    title: "Fast-loading pages",
    description:
      "Speed supports trust and makes the page easier to use, especially when the visitor is deciding quickly whether to call or leave.",
  },
  {
    title: "SEO-friendly structure",
    description:
      "Clear headings, titles, descriptions, and internal links help support search visibility and future marketing without overcomplicating the site.",
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
      "The website gives visitors more confidence before they call, message, or request a quote.",
  },
  {
    title: "Easier contact flow",
    description:
      "Calls, WhatsApp, forms, and booking actions become easier to find and use.",
  },
  {
    title: "Better mobile experience",
    description:
      "The site feels clearer and easier to use for customers browsing on their phones.",
  },
  {
    title: "Better foundation for visibility",
    description:
      "The structure supports search visibility and future marketing with a cleaner technical and content base.",
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
      "About content, FAQ sections, portfolio or gallery areas, local trust blocks, and service-area information can be added to reduce doubt.",
  },
  {
    title: "Location and service coverage",
    description:
      "Location sections, service-area details, and Google Maps embed support can be included where appropriate for local businesses.",
  },
  {
    title: "Technical foundation",
    description:
      "Basic SEO metadata, mobile responsive design, analytics-ready structure, and a fast-loading layout can be included in the build.",
  },
  {
    title: "Flexible contact experience",
    description:
      "The website can be shaped around calls, bookings, WhatsApp enquiries, or leads depending on how the business normally sells.",
  },
] as const;

const businessTypes = [
  {
    title: "Clinics, wellness, and beauty businesses",
    description:
      "This fits clinics, med spas, skincare businesses, salons, and other brands that need stronger trust before a customer books or messages.",
  },
  {
    title: "Local services and professional businesses",
    description:
      "It also suits consultants, home service businesses, real estate businesses, cleaners, and other local service providers that rely on enquiries.",
  },
  {
    title: "Gyms, schools, food, and retail brands",
    description:
      "Gyms, training centers, restaurants, food businesses, and local retail brands can also benefit when the website needs clearer service presentation and contact flow.",
  },
] as const;

const processSteps = [
  {
    step: "1",
    title: "Business Review",
    description:
      "We review the business, services, customers, location, enquiry path, and the goals the website needs to support.",
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
      "Web Growth treats local business website design as a conversion and trust problem, not just a design exercise.",
  },
  {
    title: "Mobile-first layouts",
    description:
      "The experience is built for phones first because many local customers will browse, compare, and enquire from mobile.",
  },
  {
    title: "Clear contact paths",
    description:
      "Calls, WhatsApp, bookings, and forms are placed so the next step feels easy to find instead of buried.",
  },
  {
    title: "Clean service sections",
    description:
      "The site helps explain the business before the owner has to speak, with clearer service structure and less friction for the visitor.",
  },
  {
    title: "SEO-friendly foundation without complexity",
    description:
      "The build uses a clean SEO foundation and avoids unnecessary complexity while supporting local visibility and future marketing.",
  },
] as const;

const relatedServices = [
  { title: "Business Website Design", href: "/services/business-website-design/" },
  { title: "Website Redesign", href: "/services/website-redesign/" },
  { title: "Landing Page Design", href: "/services/landing-page-design/" },
  { title: "Website Audit", href: "/services/website-audit/" },
  { title: "Performance Optimisation", href: "/services/performance-optimisation/" },
  { title: "Website Design in Lagos", href: "/website-design-lagos/" },
] as const;

const faqs = [
  {
    question: "What type of website does a small business need?",
    answer:
      "A small business usually needs a clear homepage, service information, trust content, easy contact paths, and a mobile-friendly layout that supports enquiries.",
  },
  {
    question: "How much does a small business website cost?",
    answer:
      "Cost depends on the number of pages, content, features, integrations, and the project timeline. Simpler websites cost less than broader builds.",
  },
  {
    question: "Can the website include WhatsApp and click-to-call buttons?",
    answer:
      "Yes. WhatsApp, click-to-call, contact forms, and booking links can be included where appropriate based on how the business wants customers to get in touch.",
  },
  {
    question: "Can you redesign my existing small business website?",
    answer:
      "Yes. Existing websites can be redesigned to improve clarity, trust, speed, and enquiry flow when the current site feels outdated or weak.",
  },
  {
    question: "Will the website help my business appear on Google?",
    answer:
      "The website can include a clean SEO foundation with better structure, headings, titles, and descriptions, but rankings are not guaranteed.",
  },
  {
    question: "Do I need a booking system?",
    answer:
      "Booking systems are useful for appointment-based businesses, but not every business needs one. The right contact path depends on how you sell.",
  },
  {
    question: "How long does it take to build a small business website?",
    answer:
      "Timeline depends on the project scope, content readiness, revision speed, and feature requirements. A smaller site usually moves faster than a broader build.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Website Design for Small Business | Web Growth",
  description: pageDescription,
  path: "/local-business/",
  keywords: [
    "website design for small business",
    "small business website design",
    "website design for local business",
    "local business website design",
    "business website design Nigeria",
    "website for small business in Nigeria",
    "website designer for small business",
    "website for local service business",
    "conversion-focused small business website",
  ],
  image: "/images/portfolio/tlc-interiors-desktop.jpg",
});

export default function LocalBusinessPage() {
  const featuredCases = portfolioCases
    .filter((item) => item.status !== "Proposal")
    .slice(0, 3);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: "Website Design for Small Business",
      alternateName: "Small Business Website Design",
      description: pageDescription,
      url: canonicalUrl,
      serviceType: "Website Design for Small Business",
      provider: {
        "@type": "ProfessionalService",
        "@id": `${SITE_URL}#professional-service`,
        name: "Web Growth",
        url: SITE_URL,
      },
      category: "Web Design Service",
    },
    buildFaqSchema(faqs),
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Local Business", path: "/local-business/" },
    ]),
  ];

  return (
    <>
      <StructuredData data={schema} />

      <main className="relative overflow-x-clip bg-black text-white">
        <HeroSection
          eyebrow="Website Design for Small Business"
          title="Website Design for Small Businesses That Need More Calls, Bookings, and Enquiries"
          description="Web Growth builds fast, trustworthy websites for small and local businesses that need to explain their services clearly, build local trust, and make it easier for customers to call, book, message, or enquire."
          primaryLabel="Request a Small Business Website Review"
          primaryHref="/contact/"
          secondaryLabel="View Business Website Design Service"
          secondaryHref="/services/business-website-design/"
          trustLine="Clear service presentation | Mobile-first layouts | WhatsApp and contact CTAs | Local trust sections | SEO-friendly foundation"
          locationNote="This page is for small businesses and local brands that need a clearer website for calls, bookings, WhatsApp enquiries, and stronger first impressions."
          fitTags={[
            "Website design for small business",
            "Local business website design",
            "Conversion-focused small business website",
          ]}
          asideTitle="Built to support"
          asideItems={[
            "Clearer service presentation so customers quickly understand what the business offers and how to make contact.",
            "Stronger local trust through better mobile presentation, proof sections, and contact clarity.",
            "Better enquiry flow for businesses that rely on calls, bookings, WhatsApp messages, or lead forms.",
          ]}
          imageAlt="Website design for small business page for Web Growth"
        />

        <AnswerHighlightsSection
          eyebrow="The local business problem"
          title="Many Small Business Websites Look Online but Do Not Bring Customers Closer"
          description="Small business websites often struggle because the service is unclear, the site feels outdated, the mobile experience is weak, and the customer cannot quickly find a reason or a path to contact the business."
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
                What a Small Business Website Needs to Work
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                A website design for local business should help the customer trust the
                service quickly and know exactly how to take the next step.
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
                A Small Business Website Built to Support Local Enquiries
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The goal is to make the business easier to understand, easier to trust,
                and easier to contact without overcomplicating the website.
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
          title="What Your Small Business Website Can Include"
          description="The website can include the pages, contact paths, and trust sections needed to help local customers understand the service and take action."
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Business fit
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Small Businesses This Service Can Help
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                This page is designed for growing local brands and service businesses
                that need clearer websites built around trust and enquiries.
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
                href="/website-design-lagos/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Website Design in Lagos
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
                A Clear Process From Business Review to Launch
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The website is planned around how your business actually gets calls,
                bookings, messages, or enquiries.
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
                Request a Small Business Website Review
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
                Why Small Businesses Choose Web Growth
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Web Growth builds small business websites around clarity, trust,
                enquiry flow, and cleaner local visibility foundations.
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

        <SocialProofSection
          cards={featuredCases}
          eyebrow="Selected work"
          title="Selected Website Work for Growing Businesses"
          description="Explore selected Web Growth website builds, redesign concepts, and conversion-focused layouts without relying on invented claims or fake proof."
        />

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
                If the business needs a broader or different type of website support,
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
          title="Small Business Website FAQs"
          description="Helpful answers for businesses comparing pricing, WhatsApp CTAs, redesign needs, booking systems, and how the website supports trust and visibility."
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
                    Need a Small Business Website That Helps Customers Take Action?
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
                    Request a Small Business Website Review
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
