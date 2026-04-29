import Link from "next/link";
import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import FAQSection from "@/components/FAQSection";
import HeroSection from "@/components/HeroSection";
import StructuredData from "@/components/StructuredData";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import GeneratedSectionBackground from "@/components/GeneratedSectionBackground";
import { buildBreadcrumbSchema, buildFaqSchema, buildPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const canonicalUrl = "https://webgrowth.info/ecommerce/";
const pageDescription =
  "Build a clear ecommerce website for your small business with product pages, trust sections, mobile shopping flow, and enquiry or checkout paths.";

const problemItems = [
  {
    title: "Products are scattered across posts and chats",
    answer:
      "Many product sellers struggle because product details are spread across Instagram posts, highlights, WhatsApp messages, and manual catalogues instead of one clear browsing experience.",
  },
  {
    title: "Customers repeat the same questions",
    answer:
      "When price, delivery, payment, and product details are not easy to find, sellers keep answering the same questions manually instead of letting the website do more of the work.",
  },
  {
    title: "Trust is harder to build through DMs alone",
    answer:
      "Customers may hesitate when the business does not feel structured enough or there is no clear place to browse products, compare options, and understand how to buy.",
  },
  {
    title: "Campaign traffic has nowhere focused to go",
    answer:
      "An ecommerce website for small business can give Instagram, WhatsApp, TikTok, email, and ad traffic a clearer place to land, browse, and act.",
    href: "/services/ecommerce-website-design/",
    hrefLabel: "See the Online Store Website Design Service",
  },
] as const;

const socialLimits = [
  {
    title: "Posts get buried",
    description:
      "Product information can disappear under newer posts, making it harder for customers to find the item or offer again when they are ready to buy.",
  },
  {
    title: "Customers repeat the same questions",
    description:
      "A proper online store for small business can answer common product, price, delivery, and payment questions before the customer even sends a message.",
  },
  {
    title: "Trust is harder to build",
    description:
      "A structured website can show products, policies, FAQs, contact options, and proof more clearly than chat threads and social posts alone.",
  },
  {
    title: "Buying steps can feel unclear",
    description:
      "A stronger online selling website for small business can guide customers toward enquiry, checkout, order, or purchase instead of leaving them to guess what happens next.",
  },
  {
    title: "You do not fully control the platform",
    description:
      "Social platforms are useful, but your website remains your owned sales asset and gives you a more stable structure for products and campaigns.",
  },
] as const;

const outcomes = [
  {
    title: "Clear product presentation",
    description:
      "Customers can browse products, categories, descriptions, prices, images, and details in one place without needing to piece things together from posts and chats.",
  },
  {
    title: "Stronger buyer trust",
    description:
      "Delivery information, payment clarity, FAQs, policies, proof, and contact options help the business feel more structured and more trustworthy.",
  },
  {
    title: "Better mobile shopping flow",
    description:
      "Customers can move from product interest to enquiry, order, checkout, or purchase more easily from their phones.",
  },
  {
    title: "Easier campaigns",
    description:
      "Instagram, TikTok, WhatsApp, email, and ad traffic can point to a focused product page or store instead of a generic profile or DM thread.",
  },
  {
    title: "Better foundation for growth",
    description:
      "A structured ecommerce website for business can support future SEO, tracking, promotions, product launches, and smarter iteration over time.",
  },
] as const;

const includedItems = [
  {
    title: "Store homepage and landing structure",
    description:
      "This can include a store homepage or landing page that introduces the products clearly and guides customers into the right categories or offers.",
  },
  {
    title: "Product listing and detail pages",
    description:
      "Product listing pages, product detail pages, categories, and product images or descriptions can be organized to make browsing clearer.",
  },
  {
    title: "Buying or enquiry paths",
    description:
      "WhatsApp enquiry buttons, cart and checkout flow, or other order paths can be included where appropriate depending on how the business sells.",
  },
  {
    title: "Trust and support sections",
    description:
      "Delivery, pickup, return information, FAQs, policy sections, and contact areas can be included to reduce hesitation before the customer acts.",
  },
  {
    title: "Store utility features",
    description:
      "Product search, filtering, payment integration, and other store helpers can be included where appropriate based on the scope of the project.",
  },
  {
    title: "Technical foundation",
    description:
      "Basic SEO metadata, analytics-ready structure, mobile responsive design, and a fast-loading layout can be included as part of the build.",
  },
] as const;

const audienceItems = [
  {
    title: "Instagram sellers ready for a proper website",
    description:
      "This page is for sellers who have interest on social media but need a clearer place for customers to browse products and understand the offer.",
  },
  {
    title: "WhatsApp sellers tired of repeating details",
    description:
      "It also suits businesses that are manually answering the same questions about price, delivery, stock, and payment over and over.",
  },
  {
    title: "Growing product brands and small retailers",
    description:
      "Fashion brands, beauty businesses, packaged product sellers, food brands, fitness product sellers, and local retail businesses can all benefit from a more structured online selling flow.",
  },
] as const;

const processSteps = [
  {
    step: "1",
    title: "Product and Sales Flow Review",
    description:
      "We review what you sell, how customers currently enquire or buy, and where the selling process feels unclear or too manual.",
  },
  {
    step: "2",
    title: "Store Structure Plan",
    description:
      "We plan the categories, product pages, trust sections, CTAs, enquiry paths, and checkout flow where appropriate.",
  },
  {
    step: "3",
    title: "Content and Product Direction",
    description:
      "Product details, images, descriptions, delivery information, FAQs, and trust content are organized so the store makes more sense to the buyer.",
  },
  {
    step: "4",
    title: "Design and Build",
    description:
      "The ecommerce website or online store is built as a fast, mobile-friendly experience with clearer product presentation and smoother flow.",
  },
  {
    step: "5",
    title: "Enquiry, Checkout, and Launch Checks",
    description:
      "Buttons, forms, product paths, mobile layout, metadata, and analytics-ready setup are checked before launch.",
  },
  {
    step: "6",
    title: "Launch and Handover",
    description:
      "The site is deployed and the important customer paths are checked so buyers can browse and act more confidently.",
  },
] as const;

const whyItems = [
  {
    title: "Built around product clarity and trust",
    description:
      "Web Growth approaches ecommerce website for product sellers work as a trust and buying-flow problem, not just a visual storefront exercise.",
  },
  {
    title: "Designed for mobile-first buyers",
    description:
      "The website is structured for customers who discover products on social media and continue browsing from their phones.",
  },
  {
    title: "Clearer enquiry, checkout, and purchase paths",
    description:
      "The pages are organized so customers can more easily understand what to do next instead of getting stuck between posts, chats, and unclear actions.",
  },
  {
    title: "Supports campaigns and search visibility",
    description:
      "The structure helps support social traffic, product campaigns, and a cleaner SEO foundation without unnecessary complexity.",
  },
  {
    title: "Reduces repetitive manual selling work",
    description:
      "The website helps explain products, delivery details, and buying steps before you have to answer every question manually.",
  },
] as const;

const relatedServices = [
  { title: "Online Store Website Design", href: "/services/ecommerce-website-design/" },
  { title: "Landing Page Design", href: "/services/landing-page-design/" },
  { title: "Business Website Design", href: "/services/business-website-design/" },
  { title: "Website Audit", href: "/services/website-audit/" },
  { title: "Performance Optimisation", href: "/services/performance-optimisation/" },
] as const;

const faqs = [
  {
    question: "What is an ecommerce website for a small business?",
    answer:
      "An ecommerce website helps a business display products clearly and guide customers toward enquiry, checkout, or purchase through a more structured product experience.",
  },
  {
    question: "Do I need an ecommerce website if I already sell on Instagram or WhatsApp?",
    answer:
      "Social media can still be useful, but a website gives customers a clearer place to browse products, compare options, and understand details without relying only on DMs.",
  },
  {
    question: "Can the website include WhatsApp enquiry buttons?",
    answer:
      "Yes. WhatsApp enquiry buttons can be included where appropriate if they support how the business currently takes questions or orders.",
  },
  {
    question: "Can the website include checkout and online payment?",
    answer:
      "Yes. Checkout and payment can be included depending on the project scope, platform, and provider requirements.",
  },
  {
    question: "Is an ecommerce website better than a landing page?",
    answer:
      "A landing page is better for one product or one offer. An ecommerce website is usually better when the business has multiple products, categories, or ongoing selling needs.",
  },
  {
    question: "Can you help organize my products and categories?",
    answer:
      "Yes. Product categories, details, images, delivery information, and trust sections can be organized so the store feels clearer and easier to browse.",
  },
  {
    question: "How long does it take to build an ecommerce website?",
    answer:
      "Timeline depends on the number of products, content readiness, integrations, design scope, and review speed. Smaller setups move faster than broader catalog builds.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Ecommerce Website for Small Business | Web Growth",
  description: pageDescription,
  path: "/ecommerce/",
  keywords: [
    "ecommerce website for small business",
    "online store for small business",
    "ecommerce website for business",
    "online shop for small business",
    "sell products online Nigeria",
    "online store website Nigeria",
    "ecommerce website design Nigeria",
    "product website for small business",
    "ecommerce website for product sellers",
    "online selling website for small business",
  ],
  image: "/images/portfolio/treats-by-ann-cover.webp",
});

export default function EcommercePage() {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: "Ecommerce Website for Small Business",
      alternateName: "Online Store Website Strategy",
      description: pageDescription,
      url: canonicalUrl,
      serviceType: "Ecommerce Website for Small Business",
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
      { name: "Ecommerce", path: "/ecommerce/" },
    ]),
  ];

  return (
    <>
      <StructuredData data={schema} />

      <main className="relative overflow-x-clip bg-black text-white">
        <HeroSection
          eyebrow="Ecommerce Website for Small Business"
          title="Ecommerce Website for Small Businesses Ready to Sell Beyond Social Media"
          description="Web Growth helps small businesses and product sellers build ecommerce websites that present products clearly, build buyer trust, and give customers a smoother path to enquire, order, checkout, or buy."
          primaryLabel="Request an Ecommerce Website Review"
          primaryHref="/contact/"
          secondaryLabel="View Online Store Website Design"
          secondaryHref="/services/ecommerce-website-design/"
          trustLine="Product-focused structure | Mobile-first shopping flow | Trust-building sections | WhatsApp or checkout paths | SEO-friendly foundation"
          locationNote="This page is for businesses moving from Instagram, WhatsApp, manual DMs, or offline selling into a clearer online store structure that customers can browse and trust more easily."
          fitTags={[
            "Ecommerce website for small business",
            "Online store for small business",
            "Sell products online Nigeria",
          ]}
          asideTitle="Built to support"
          asideItems={[
            "Clearer product browsing so customers can see what you sell without relying only on posts or chat threads.",
            "Stronger buyer trust through better product detail structure, FAQs, contact clarity, and clearer delivery or payment information.",
            "Smoother enquiry, checkout, or purchase flow for social traffic that needs a more focused place to land.",
          ]}
          imageAlt="Ecommerce website for small business page for Web Growth"
        />

        <AnswerHighlightsSection
          eyebrow="The selling problem"
          title="Selling Through DMs Alone Can Make Growth Harder"
          description="Social media can help you get attention, but it becomes harder to manage when products are scattered, details are repeated in chats, and customers do not have one clear place to browse and decide."
          items={problemItems}
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Beyond social media
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Why Social Media Alone Is Not Always Enough
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Social media is still useful, but an online store website Nigeria setup
                gives your products a clearer home and supports the traffic you are
                already working hard to get.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {socialLimits.map((item) => (
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
                What an Ecommerce Website Gives Your Small Business
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The goal is to help customers understand products more clearly, trust
                the business more easily, and take action with less friction.
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
          title="What Your Ecommerce Website Can Include"
          description="The website can include the product pages, trust sections, and enquiry or checkout paths needed to support clearer online selling."
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Who this is for
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Who This Ecommerce Website Page Is For
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                This page is for product sellers and small businesses that want a
                clearer online shop for small business growth beyond chat-based selling
                alone.
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
                href="/services/ecommerce-website-design/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Online Store Website Design
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
                A Clear Ecommerce Website Process From Product Structure to Launch
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The work starts by understanding how you currently sell and where a
                clearer online store can remove friction.
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
                Request an Ecommerce Website Review
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
                Why Build Your Ecommerce Website With Web Growth
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Web Growth helps your website explain products, support social traffic,
                and reduce manual selling friction before every question has to happen
                in chat.
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
                If you need the direct build or supporting page work, these are the
                closest next services to consider.
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
          title="Ecommerce Website for Small Business FAQs"
          description="Helpful answers for sellers comparing social selling, ecommerce websites, landing pages, product structure, and how the website supports clearer online buying."
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
                    Ready to Give Customers a Clearer Way to Browse and Buy?
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                    Send your product details or existing selling page and we&apos;ll
                    review what your ecommerce website needs to present products
                    clearly, build trust, and guide customers toward enquiry, checkout,
                    or purchase.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/contact/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                  >
                    Request an Ecommerce Website Review
                  </Link>
                  <Link
                    href="/services/ecommerce-website-design/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                  >
                    Explore Online Store Website Design
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
