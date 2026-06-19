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

const canonicalUrl = "https://webgrowth.info/services/ecommerce-website-design/";
const pageDescription =
  "Launch a fast, trustworthy online store website built to showcase products clearly, improve mobile shopping, and support enquiries, checkout, or sales.";

const problemItems = [
  {
    title: "Product pages do not explain enough",
    answer:
      "Many product businesses struggle online because the store does not clearly present product details, delivery information, or why the product is worth buying.",
  },
  {
    title: "The store does not build trust quickly",
    answer:
      "If the website feels risky, unprofessional, or unclear about payment, delivery, or support, customers hesitate before they ever add to cart or enquire.",
  },
  {
    title: "Mobile shopping feels too difficult",
    answer:
      "A poor phone experience, weak calls to action, and confusing checkout or enquiry paths create friction for buyers who want a fast decision.",
  },
  {
    title: "The sales path is not clear enough",
    answer:
      "An online store website design service should make it obvious how to browse, compare, enquire, order, or checkout without making customers guess.",
    href: "/services/website-audit/",
    hrefLabel: "Find Out What Is Blocking Online Sales",
  },
] as const;

const storeElements = [
  {
    title: "Clear product presentation",
    description:
      "Products should be easy to browse, understand, compare, and trust without forcing customers to dig for basic details.",
  },
  {
    title: "Strong trust signals",
    description:
      "Delivery details, payment clarity, FAQs, policies, proof, and contact options reduce hesitation and help the store feel safer to use.",
  },
  {
    title: "Simple shopping or enquiry flow",
    description:
      "Customers should know exactly how to buy, enquire, order, or checkout from the moment they land on the page.",
  },
  {
    title: "Mobile-first experience",
    description:
      "A mobile online store website should feel smooth for customers browsing from phones where much of the buying journey starts.",
  },
  {
    title: "Fast loading pages",
    description:
      "Speed supports trust and reduces friction when customers are browsing products, categories, or checkout steps.",
  },
  {
    title: "Clear calls to action",
    description:
      "Calls to action should guide customers toward checkout, WhatsApp enquiry, booking, or purchase instead of leaving the next step unclear.",
  },
] as const;

const outcomes = [
  {
    title: "Clearer product discovery",
    description:
      "Customers can quickly understand what you sell, what matters about each product, and why the offer is worth attention.",
  },
  {
    title: "Stronger buyer trust",
    description:
      "The store explains product details, delivery, payment, and support more clearly so the business feels more trustworthy.",
  },
  {
    title: "Better mobile shopping flow",
    description:
      "Customers can browse and take action more easily from their phones, which is critical for an online shop website design in Nigeria.",
  },
  {
    title: "More focused checkout or enquiry path",
    description:
      "The site guides visitors toward checkout, WhatsApp enquiry, booking, or purchase without burying the main action.",
  },
  {
    title: "Better foundation for growth",
    description:
      "The store can support SEO, campaigns, product launches, and future improvements with a cleaner structure and stronger product presentation.",
  },
] as const;

const includedItems = [
  {
    title: "Store landing and category pages",
    description:
      "This can include a homepage or store landing page, product listing pages, product categories, and a clearer structure for browsing what you sell.",
  },
  {
    title: "Product detail pages",
    description:
      "Product detail pages can be structured to show images, descriptions, options, pricing context, and the information customers need before acting.",
  },
  {
    title: "Shopping or enquiry flow",
    description:
      "Cart and checkout flow, WhatsApp enquiry buttons, or other order paths can be included where appropriate depending on how the store sells.",
  },
  {
    title: "Trust and support sections",
    description:
      "Delivery information, pickup details, FAQs, policy sections, and contact areas can be included to reduce doubt and shopping friction.",
  },
  {
    title: "Store utility features",
    description:
      "Product search, filtering, payment integration, and other store helpers can be included where appropriate based on the project scope.",
  },
  {
    title: "Technical foundation",
    description:
      "Basic SEO metadata, analytics-ready structure, mobile responsive design, and a fast-loading layout can be included as part of the build.",
  },
] as const;

const audienceItems = [
  {
    title: "Product-based businesses",
    description:
      "This service suits product businesses that need a proper online store website instead of relying only on DMs, posts, or scattered product links.",
  },
  {
    title: "Fashion, beauty, food, and retail brands",
    description:
      "It also fits fashion brands, skincare sellers, packaged food businesses, fitness product sellers, and small retail businesses ready for a clearer online shopping experience.",
  },
  {
    title: "Instagram or WhatsApp sellers ready to scale",
    description:
      "If the business is moving from manual orders into a more structured product site, a stronger online store developer in Nigeria approach can improve trust and buying flow.",
  },
] as const;

const processSteps = [
  {
    step: "1",
    title: "Product and Business Review",
    description:
      "We review what you sell, who you sell to, your product categories, your current sales flow, and what the store needs to support.",
  },
  {
    step: "2",
    title: "Store Structure Plan",
    description:
      "We plan the categories, product pages, trust sections, CTAs, and the shopping or enquiry flow that will guide customers clearly.",
  },
  {
    step: "3",
    title: "Content and Product Direction",
    description:
      "Product descriptions, images, delivery information, FAQs, and trust content are organized so the store feels clearer and easier to shop.",
  },
  {
    step: "4",
    title: "Design and Build",
    description:
      "The online shopping website design is built as a fast, mobile-friendly experience with stronger product presentation and cleaner page flow.",
  },
  {
    step: "5",
    title: "Checkout, Enquiry, and Launch Checks",
    description:
      "Buttons, forms, checkout or enquiry flow, metadata, mobile layout, and analytics-ready setup are checked before launch.",
  },
  {
    step: "6",
    title: "Launch and Handover",
    description:
      "The store is deployed and important pages, product paths, and customer actions are confirmed to be working properly.",
  },
] as const;

const whyItems = [
  {
    title: "Built around product clarity and trust",
    description:
      "Web Growth treats online store website design Nigeria work as a product-selling experience, not just a generic website build.",
  },
  {
    title: "Mobile-first shopping experience",
    description:
      "The store is designed to feel clearer and easier to use on phones where many customers first browse products.",
  },
  {
    title: "Clear CTA and enquiry flow",
    description:
      "The site is structured to reduce shopping friction and make the next step obvious whether the goal is checkout or enquiry.",
  },
  {
    title: "Fast-loading and SEO-friendly foundation",
    description:
      "The build is designed with speed, a clean SEO foundation, and analytics-ready structure so the store is easier to improve over time.",
  },
  {
    title: "Built to support future campaigns",
    description:
      "The store is built to support online sales, product launches, and campaigns without overcomplicating the customer journey.",
  },
] as const;

const relatedServices = [
  { title: "Business Website Design", href: "/services/business-website-design/" },
  { title: "Landing Page Design", href: "/services/landing-page-design/" },
  { title: "Website Redesign", href: "/services/website-redesign/" },
  { title: "Website Audit", href: "/services/website-audit/" },
  { title: "Performance Optimisation", href: "/services/performance-optimisation/" },
  { title: "Ecommerce Website Strategy", href: "/ecommerce/" },
] as const;

const faqs = [
  {
    question: "What is an online store website?",
    answer:
      "An online store website helps a business showcase products and guide customers toward enquiry, checkout, or purchase through a clearer product and shopping flow.",
  },
  {
    question: "Do I need an online store or just a landing page?",
    answer:
      "A landing page may be enough for one offer or one product. An online store is usually better when the business needs multiple products, categories, and a broader product browsing experience.",
  },
  {
    question: "Can the store include WhatsApp enquiry buttons?",
    answer:
      "Yes. WhatsApp enquiry buttons can be included where appropriate if they support how your customers ask questions or place orders.",
  },
  {
    question: "Can the website include payment or checkout?",
    answer:
      "Yes. Payment or checkout can be included depending on the project scope, platform, and payment provider requirements.",
  },
  {
    question: "Will the online store be mobile-friendly?",
    answer:
      "Yes. The store should be mobile-friendly because many customers browse products and make decisions from their phones.",
  },
  {
    question: "Can you help organize product pages and categories?",
    answer:
      "Yes. Product categories, product details, images, and trust sections can be structured as part of the project so the store feels easier to browse and understand.",
  },
  {
    question: "How long does it take to build an online store website?",
    answer:
      "Timeline depends on the number of products, content readiness, integrations, design scope, and review speed. A smaller store usually moves faster than a broader catalog build.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Online Store Website Design Nigeria | Web Growth",
  description: pageDescription,
  path: "/services/ecommerce-website-design/",
  keywords: [
    "online store website design Nigeria",
    "ecommerce website design Nigeria",
    "online shop website design",
    "online store website design service",
    "online shopping website design",
    "ecommerce website designer in Nigeria",
    "online store developer in Nigeria",
    "product page design",
    "mobile online store website",
    "conversion-focused ecommerce website",
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
      name: "Online Store Website Design",
      alternateName: "Ecommerce Website Design",
      description: pageDescription,
      url: canonicalUrl,
      serviceType: "Online Store Website Design",
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
      { name: "Ecommerce Website Design", path: "/services/ecommerce-website-design/" },
    ]),
  ];

  return (
    <>
      <StructuredData data={schema} />

      <main className="relative overflow-x-clip bg-black text-white">
        <HeroSection
          eyebrow="Online Store Website Design"
          title="Online Store Website Design in Nigeria for Businesses Ready to Sell Online"
          description="Web Growth builds fast, trustworthy online store websites that help businesses showcase products clearly, improve mobile shopping, and guide customers toward enquiries, checkout, or purchase."
          primaryLabel="Request an Online Store Website Review"
          primaryHref="/contact/"
          secondaryLabel="View Pricing"
          secondaryHref="/pricing/"
          trustLine="Product-focused page structure | Mobile-first shopping experience | Trust-building sections | Checkout or enquiry flow | SEO-friendly foundation"
          locationNote="This service is for Nigerian businesses that need a proper online store, not just product photos and a payment link. The goal is to help customers understand the products, trust the store, and move toward action more easily."
          fitTags={[
            "Online store website design Nigeria",
            "Ecommerce website design Nigeria",
            "Conversion-focused ecommerce website",
          ]}
          asideTitle="Built to support"
          asideItems={[
            "Clearer product presentation so customers quickly understand what you sell and what each item offers.",
            "Stronger trust through better product detail structure, clearer delivery and payment context, and cleaner store presentation.",
            "Better mobile shopping flow for businesses moving from manual DMs into a more professional online selling experience.",
          ]}
          imageAlt="Online store website design service page for Web Growth"
        />

        <AnswerHighlightsSection
          eyebrow="The online sales problem"
          title="Selling Online Needs More Than Product Photos and a Payment Link"
          description="Many product businesses struggle online because product pages are unclear, trust is weak, the mobile shopping experience is poor, and the checkout or enquiry flow leaves too much confusion for the buyer."
          items={problemItems}
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Store essentials
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                What Makes an Online Store Website Work
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                A strong online shop website design should help customers trust what
                they see, understand what to do next, and feel comfortable buying.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {storeElements.map((item) => (
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
                An Online Store Built to Help Customers Buy With Confidence
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The store should make products easier to discover, easier to trust, and
                easier to buy from a phone or desktop screen.
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
          title="What Your Online Store Website Can Include"
          description="An online store can include the product pages, trust sections, and buying flow needed to help customers browse and act with more confidence."
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Who this is for
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Who This Online Store Website Service Is For
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                This service is for product sellers and brands that need a clearer,
                more trustworthy online store website design service built for real
                shopping behavior.
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
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href="/ecommerce/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Ecommerce Website Strategy
              </Link>
              <Link
                href="/services/landing-page-design/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Landing Page Design
              </Link>
              <Link
                href="/services/business-website-design/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Business Website Design
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
                A Clear Online Store Process From Products to Launch
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The goal is to make the products easier to understand, the store easier
                to trust, and the shopping path easier to follow.
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
                Request an Online Store Website Review
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
                Why Build Your Online Store With Web Growth
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Web Growth approaches online store development as a product-selling
                experience built around trust, clarity, and smoother shopping flow.
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
          eyebrow="Selected store work"
          title="Selected Website and Online Store Work"
          description="Explore selected Web Growth website builds, online store work, and conversion-focused layouts without relying on invented results or fake proof."
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
                If the business needs supporting work beyond the store itself, these
                are the closest next services to consider.
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
          title="Online Store Website Design FAQs"
          description="Helpful answers for businesses comparing online stores, landing pages, product structure, payment flow, and mobile shopping needs."
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
                    Ready to Turn Your Products Into a Proper Online Store?
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                    Send your product details or existing store link and we&apos;ll
                    review what your online store needs to present products clearly,
                    build trust, and guide customers toward action.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/contact/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                  >
                    Request an Online Store Website Review
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
