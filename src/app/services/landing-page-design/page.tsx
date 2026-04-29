import Link from "next/link";
import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import FAQSection from "@/components/FAQSection";
import HeroSection from "@/components/HeroSection";
import SocialProofSection from "@/components/SocialProofSection";
import StructuredData from "@/components/StructuredData";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import GeneratedSectionBackground from "@/components/GeneratedSectionBackground";
import { featuredPortfolioCases } from "@/lib/portfolioCases";
import { buildBreadcrumbSchema, buildFaqSchema, buildPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const canonicalUrl = "https://webgrowth.info/services/landing-page-design/";
const pageDescription =
  "Get a focused landing page built to explain your offer clearly, build trust fast, and guide visitors toward enquiries, bookings, signups, or sales.";

const problemItems = [
  {
    title: "The offer is not clear enough",
    answer:
      "Weak landing pages often try to say too much at once, so visitors do not quickly understand the offer, who it is for, or why they should act.",
  },
  {
    title: "Too many distractions weaken the CTA",
    answer:
      "When the page has too many directions, weak calls to action, or a confusing form, visitors lose momentum instead of moving toward one clear next step.",
  },
  {
    title: "Trust is not built quickly enough",
    answer:
      "Generic copy, poor mobile layout, and weak proof sections make it harder for a lead generation landing page to reduce doubt and support action.",
  },
  {
    title: "Visitors do not know why they should act now",
    answer:
      "A landing page design service should help the page explain the value clearly, remove friction, and guide attention toward one main action.",
    href: "/services/website-audit/",
    hrefLabel: "Find Out What Is Blocking Conversions",
  },
] as const;

const conversionElements = [
  {
    title: "One clear offer",
    description:
      "A conversion-focused landing page should focus on one service, product, campaign, or action instead of trying to sell everything at once.",
  },
  {
    title: "Strong headline and promise",
    description:
      "Visitors should understand the value in seconds, especially when they arrive from ads, social campaigns, email, or outreach traffic.",
  },
  {
    title: "Trust signals",
    description:
      "Proof sections, process explanations, FAQs, and clear credibility markers reduce uncertainty and help the page feel more believable.",
  },
  {
    title: "Focused CTA",
    description:
      "The page should guide visitors toward one main action, whether that is an enquiry, signup, booking, WhatsApp conversation, or sale.",
  },
  {
    title: "Mobile-first structure",
    description:
      "A landing page for business needs to feel easy to read, scroll, and act on from a phone where much of the traffic will arrive.",
  },
  {
    title: "Fast loading experience",
    description:
      "Speed supports trust and reduces friction, especially for paid traffic where a slow experience wastes attention quickly.",
  },
] as const;

const outcomes = [
  {
    title: "Clearer offer",
    description:
      "Visitors understand what you are offering, who it is for, and why it matters without digging through unnecessary sections.",
  },
  {
    title: "Stronger trust",
    description:
      "A high converting landing page design should answer objections faster and reduce uncertainty before the visitor reaches the CTA.",
  },
  {
    title: "Better enquiry flow",
    description:
      "CTAs, sections, and forms are built to support action instead of forcing the visitor to guess what to do next.",
  },
  {
    title: "Campaign-ready structure",
    description:
      "The page can support ads, social campaigns, WhatsApp outreach, email campaigns, or organic traffic with a more focused flow.",
  },
  {
    title: "Faster mobile experience",
    description:
      "Landing page design for small business should make the mobile experience feel cleaner, easier, and more trustworthy.",
  },
] as const;

const includedItems = [
  {
    title: "Offer-first hero section",
    description:
      "This can include a strong hero section that explains the offer clearly, shows the main benefit quickly, and points the visitor toward the CTA.",
  },
  {
    title: "Benefits and problem-solution flow",
    description:
      "The page can include benefits sections, problem-solution blocks, and clear offer explanation so the sales page design service feels more persuasive and focused.",
  },
  {
    title: "Trust, proof, and FAQ sections",
    description:
      "Proof sections, process explanations, FAQs, and other trust-building content can be included to reduce doubt before action.",
  },
  {
    title: "Focused CTA blocks",
    description:
      "Contact forms, WhatsApp CTAs, booking links, and other call-to-action blocks can be placed where they support the conversion flow best.",
  },
  {
    title: "Basic SEO and analytics readiness",
    description:
      "Basic SEO metadata, analytics-ready structure, and crawlable page setup can be included where the landing page also needs a clean search and tracking foundation.",
  },
  {
    title: "Fast mobile-first build",
    description:
      "The landing page designer build can include a fast, mobile-first layout that supports campaign traffic and reduces friction for phone users.",
  },
] as const;

const useCases = [
  {
    title: "Launch a new offer",
    description:
      "A landing page makes sense when the business needs one focused page to promote a new service, product, class, or package clearly.",
  },
  {
    title: "Run ads or social campaigns",
    description:
      "High converting landing page design is useful when traffic is coming from paid campaigns and needs a cleaner message with one CTA path.",
  },
  {
    title: "Collect leads or bookings",
    description:
      "A lead generation landing page can be used to support enquiries, signups, bookings, or WhatsApp responses without the complexity of a full website.",
  },
  {
    title: "Test a focused idea first",
    description:
      "It can also help test a business idea or one offer before investing in a broader site with multiple pages.",
  },
] as const;

const processSteps = [
  {
    step: "1",
    title: "Offer Review",
    description:
      "We review the offer, audience, price point, traffic source, and the main action the landing page needs to support.",
  },
  {
    step: "2",
    title: "Page Strategy",
    description:
      "We plan the sections, CTA path, trust points, and conversion flow so the page says the right things in the right order.",
  },
  {
    step: "3",
    title: "Copy Direction",
    description:
      "The headline, benefits, objections, FAQs, and CTA messaging are structured to reduce friction and improve clarity.",
  },
  {
    step: "4",
    title: "Design and Build",
    description:
      "The landing page is built as a focused, responsive, fast-loading page designed around one clear offer and one main action.",
  },
  {
    step: "5",
    title: "Tracking and Launch Checks",
    description:
      "Forms, buttons, mobile layout, metadata, and analytics-ready structure are checked before launch.",
  },
] as const;

const whyItems = [
  {
    title: "Designed around one clear offer",
    description:
      "Web Growth keeps the page focused so the visitor understands what matters fast instead of getting distracted by unnecessary sections.",
  },
  {
    title: "Built for trust, clarity, and action",
    description:
      "The page structure is designed to improve clarity and trust while guiding visitors toward one next step.",
  },
  {
    title: "Mobile-first and fast-loading",
    description:
      "Landing pages are built mobile-first with a fast-loading structure that helps support campaign traffic and reduce friction.",
  },
  {
    title: "Clear CTA and section flow",
    description:
      "CTA placement, section order, and page flow are chosen to support enquiries rather than bury them under clutter.",
  },
  {
    title: "SEO-friendly and analytics-ready foundation",
    description:
      "Where needed, the page is built with a clean SEO foundation and analytics-ready setup so it is easier to measure and improve later.",
  },
] as const;

const relatedServices = [
  { title: "Business Website Design", href: "/services/business-website-design/" },
  { title: "Website Redesign", href: "/services/website-redesign/" },
  { title: "Website Audit", href: "/services/website-audit/" },
  { title: "Performance Optimisation", href: "/services/performance-optimisation/" },
  { title: "Ecommerce Website Design", href: "/services/ecommerce-website-design/" },
] as const;

const faqs = [
  {
    question: "What is a landing page?",
    answer:
      "A landing page is a focused page built around one offer and one main action, such as an enquiry, booking, signup, WhatsApp message, or sale.",
  },
  {
    question: "Do I need a landing page or a full website?",
    answer:
      "A landing page is useful when you are promoting one offer. A full website is usually better when the business needs multiple pages, broader trust-building, and more detailed service information.",
  },
  {
    question: "How long does it take to build a landing page?",
    answer:
      "Timeline depends on scope, content readiness, features, revision rounds, and how quickly reviews happen. A simpler landing page usually moves faster than a broader campaign page.",
  },
  {
    question: "Can a landing page include a form or WhatsApp button?",
    answer:
      "Yes. Forms, WhatsApp buttons, booking links, and other enquiry CTAs can be included depending on the action the page needs to support.",
  },
  {
    question: "Can I use a landing page for ads?",
    answer:
      "Yes. Landing pages can support ads, social campaigns, email campaigns, and outreach when the goal is to send visitors to one focused offer page.",
  },
  {
    question: "Will the landing page be mobile-friendly?",
    answer:
      "Yes. The page should be mobile-friendly because many visitors will view the offer from a phone first.",
  },
  {
    question: "Can you improve an existing landing page?",
    answer:
      "Yes. Existing landing pages can be reviewed and improved for clarity, trust, speed, mobile usability, and CTA flow.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Landing Page Design Service | Web Growth",
  description: pageDescription,
  path: "/services/landing-page-design/",
  keywords: [
    "landing page design service",
    "landing page design Nigeria",
    "high converting landing page design",
    "landing page designer",
    "sales page design service",
    "lead generation landing page",
    "conversion-focused landing page",
    "landing page for business",
    "landing page design for small business",
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
      name: "Landing Page Design Service",
      description: pageDescription,
      url: canonicalUrl,
      serviceType: "Landing Page Design Service",
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
      { name: "Services", path: "/services/" },
      { name: "Landing Page Design", path: "/services/landing-page-design/" },
    ]),
  ];

  return (
    <>
      <StructuredData data={schema} />

      <main className="relative overflow-x-clip bg-black text-white">
        <HeroSection
          eyebrow="Landing Page Design Service"
          title="Landing Page Design Service for Businesses That Need More Conversions"
          description="Web Growth designs focused landing pages that explain one offer clearly, build trust quickly, and guide visitors toward enquiries, bookings, signups, or sales."
          primaryLabel="Request a Landing Page Review"
          primaryHref="/contact/"
          secondaryLabel="View Website Audit Service"
          secondaryHref="/services/website-audit/"
          trustLine="One-offer page structure | Conversion-focused copy flow | Mobile-first layout | Fast-loading build | Clear CTA path"
          locationNote="This service is for businesses that need a conversion asset, not just a simple one-page design. A strong landing page should help the right visitor understand the offer quickly and move toward one clear action."
          fitTags={[
            "Landing page design Nigeria",
            "Lead generation landing page",
            "Conversion-focused landing page",
          ]}
          asideTitle="Built to support"
          asideItems={[
            "Clearer offer communication for one focused service, product, campaign, or next step.",
            "Stronger trust through tighter copy flow, cleaner structure, and clearer proof sections.",
            "Better action flow for businesses that need enquiries, bookings, signups, or sales from one page.",
          ]}
          imageAlt="Landing page design service page for Web Growth"
        />

        <AnswerHighlightsSection
          eyebrow="The conversion problem"
          title="Most Landing Pages Fail Because They Try to Say Too Much"
          description="Weak landing pages usually miss the point. The offer is unclear, the page has too many distractions, the CTA is buried, the form feels confusing, and visitors do not quickly understand why they should act now."
          items={problemItems}
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Conversion essentials
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                What Makes a Landing Page Convert
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                A landing page design service should give the visitor less to think
                about and a clearer reason to act.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {conversionElements.map((item) => (
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
                A Landing Page Built to Turn Attention Into Action
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                A high converting landing page design should make the offer easier to
                understand, the page easier to trust, and the next step easier to take.
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
          title="What Your Landing Page Can Include"
          description="A landing page can include the sections, trust points, and call-to-action flow needed to explain one offer clearly and support action."
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Use cases
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                When a Landing Page Makes Sense
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                A landing page for business makes sense when one offer needs a tighter
                message and a stronger conversion path than a general website page can
                provide.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {useCases.map((item) => (
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
                href="/services/business-website-design/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Business Website Design
              </Link>
              <Link
                href="/services/ecommerce-website-design/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Ecommerce Website Design
              </Link>
              <Link
                href="/local-business/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Local Business
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
                A Clear Landing Page Process From Offer to Launch
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The page is built around one offer, one main action, and a clearer
                conversion path from the start.
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
                Request a Landing Page Review
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
                Why Build Your Landing Page With Web Growth
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Web Growth builds landing pages around one clear offer, a cleaner
                conversion path, and a more focused user journey.
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
          eyebrow="Selected landing page work"
          title="Selected Website and Landing Page Work"
          description="Explore selected Web Growth website builds, landing-page work, and conversion-focused layouts without relying on invented claims or fake results."
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
                If the business needs a broader conversion or website improvement, these
                are the closest next services to consider.
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
          title="Landing Page Design Service FAQs"
          description="Helpful answers for businesses comparing landing pages, full websites, ads support, mobile readiness, and improvements to existing pages."
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
                    Need a Landing Page That Makes Your Offer Clear?
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                    Send your offer or existing page link and we&apos;ll review what the
                    page needs to explain, prove, and guide visitors toward action.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/contact/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                  >
                    Request a Landing Page Review
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
