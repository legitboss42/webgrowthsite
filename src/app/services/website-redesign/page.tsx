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

const canonicalUrl = "https://webgrowth.info/services/website-redesign/";
const pageDescription =
  "Redesign your outdated business website into a faster, clearer, conversion-focused site built to improve trust, user experience, and enquiries.";

const problemItems = [
  {
    title: "Outdated design weakens the first impression",
    answer:
      "When the website feels dated, generic, or poorly presented, visitors can lose trust before they even understand the offer.",
  },
  {
    title: "Slow pages and poor mobile use push people away",
    answer:
      "A business website redesign should address slow loading speed and awkward mobile experiences because buyers often judge the business from those first moments.",
  },
  {
    title: "Weak CTAs and confusing structure reduce enquiries",
    answer:
      "If the service messaging is unclear, calls to action are hidden, or the page structure is confusing, visitors leave without taking the next step.",
  },
  {
    title: "The website stops supporting business growth",
    answer:
      "A redesign outdated website project is often needed when the current site no longer reflects the business clearly or helps support trust and enquiries.",
    href: "/services/website-audit/",
    hrefLabel: "Find Out What Is Holding Your Website Back",
  },
] as const;

const warningSigns = [
  "Visitors leave without enquiring",
  "The site looks outdated compared to competitors",
  "Pages load slowly",
  "The homepage does not explain your offer clearly",
  "The mobile version feels difficult to use",
  "Your CTAs are weak or hidden",
  "Your services are not structured properly",
  "You are embarrassed to send people your website link",
] as const;

const outcomes = [
  {
    title: "Clearer message",
    description:
      "A business website redesign should help visitors understand what you do faster, who you help, and why they should trust the offer.",
  },
  {
    title: "Stronger trust",
    description:
      "Better structure, visuals, proof, and messaging are designed to improve clarity and trust rather than simply refresh the appearance.",
  },
  {
    title: "Better conversion flow",
    description:
      "Calls to action and page sections are built to support enquiries, bookings, or purchases without leaving the visitor unsure what to do next.",
  },
  {
    title: "Faster performance",
    description:
      "Speed improvements support a cleaner experience and help the business feel more credible from the first visit.",
  },
  {
    title: "Better mobile experience",
    description:
      "A conversion-focused website redesign should feel easier to use on phones where many visitors first encounter the business.",
  },
] as const;

const includedItems = [
  {
    title: "Homepage redesign",
    description:
      "This can include a clearer homepage structure that explains the offer faster and makes the main next step easier to find.",
  },
  {
    title: "Service page restructuring",
    description:
      "Service sections can be reorganized so the business website redesign supports better messaging, stronger hierarchy, and easier scanning.",
  },
  {
    title: "Mobile layout improvement",
    description:
      "The redesign can improve how the site feels on smaller screens so key information, proof, and CTAs are easier to use.",
  },
  {
    title: "CTA and navigation cleanup",
    description:
      "Calls to action, contact paths, and navigation can be cleaned up so visitors are guided more clearly toward enquiry.",
  },
  {
    title: "Speed and SEO foundation cleanup",
    description:
      "Speed and performance optimisation, metadata cleanup, and cleaner page structure can be included as part of the redesign.",
  },
  {
    title: "Proof, FAQ, and contact paths",
    description:
      "Portfolio sections, FAQ blocks, contact forms, WhatsApp CTAs, and analytics-ready setup can be included where appropriate.",
  },
] as const;

const audienceItems = [
  {
    title: "Businesses with outdated websites",
    description:
      "This website redesign service is for businesses whose current site no longer reflects the quality of the business or the standard they want people to see.",
  },
  {
    title: "Small businesses with traffic but weak enquiries",
    description:
      "If people are visiting but not contacting, the issue may be clarity, trust, speed, or conversion flow rather than traffic alone.",
  },
  {
    title: "Service businesses with unclear messaging",
    description:
      "This also suits businesses changing their offer, improving positioning, or trying to present a more professional online presence.",
  },
] as const;

const processSteps = [
  {
    step: "1",
    title: "Website Review",
    description:
      "We review the current website, offer, audience, goals, and the weak points affecting trust, speed, clarity, and enquiry flow.",
  },
  {
    step: "2",
    title: "Redesign Strategy",
    description:
      "We decide what needs to change across structure, content, calls to action, speed, and the overall user journey.",
  },
  {
    step: "3",
    title: "Page Structure and Copy Direction",
    description:
      "The page sections are reworked so visitors can understand the offer faster and move more naturally toward the next step.",
  },
  {
    step: "4",
    title: "Design and Build",
    description:
      "The redesigned website is built as a cleaner, faster, mobile-friendly experience that treats redesign as business improvement, not decoration alone.",
  },
  {
    step: "5",
    title: "SEO, Speed, and Mobile Checks",
    description:
      "Metadata, page structure, speed, mobile usability, and the key technical basics are checked before launch.",
  },
  {
    step: "6",
    title: "Launch and Handover",
    description:
      "The redesigned site is deployed and important pages, forms, and CTAs are confirmed to be working properly.",
  },
] as const;

const whyItems = [
  {
    title: "Redesign around business goals, not decoration",
    description:
      "Web Growth approaches website redesign service work as a business improvement service focused on trust, clarity, and conversion flow.",
  },
  {
    title: "Improve page structure before visuals",
    description:
      "We improve structure, service hierarchy, and CTA placement before chasing visual polish, because that is what improves the user journey.",
  },
  {
    title: "Keep the site SEO-friendly",
    description:
      "The redesign is structured for stronger search visibility with a clean SEO foundation instead of unnecessary complexity.",
  },
  {
    title: "Focus on trust, speed, and usability",
    description:
      "We make CTAs easier to find, improve the mobile experience, and keep performance in mind so the site feels more credible and easier to use.",
  },
] as const;

const relatedServices = [
  { title: "Business Website Design", href: "/services/business-website-design/" },
  { title: "Website Audit", href: "/services/website-audit/" },
  { title: "Landing Page Design", href: "/services/landing-page-design/" },
  { title: "Performance Optimisation", href: "/services/performance-optimisation/" },
  { title: "Ecommerce Website Design", href: "/services/ecommerce-website-design/" },
] as const;

const faqs = [
  {
    question: "How do I know if my website needs a redesign?",
    answer:
      "A redesign may be needed if the site looks outdated, loads slowly, is hard to use on mobile, or does not explain the offer clearly enough to support enquiries.",
  },
  {
    question: "Will redesigning my website help me get more enquiries?",
    answer:
      "A redesign can improve clarity, trust, speed, user experience, and conversion flow, which may support better enquiries, but it does not guarantee them.",
  },
  {
    question: "Can you redesign my existing website without changing my brand completely?",
    answer:
      "Yes. The brand can often be refined and presented more clearly without changing everything completely, especially when the main issue is structure, clarity, or usability.",
  },
  {
    question: "How long does a website redesign take?",
    answer:
      "Timeline depends on scope, number of pages, content readiness, revision rounds, and technical requirements. Smaller redesigns usually move faster than broader rebuilds.",
  },
  {
    question: "Will my old pages and SEO be affected?",
    answer:
      "Existing SEO should be handled carefully. If URLs or page structure change, redirects, canonicals, and metadata may need to be managed properly during the redesign.",
  },
  {
    question: "Can you improve website speed during the redesign?",
    answer:
      "Yes. Speed improvements can be included depending on the current site, platform, and how much technical cleanup is needed during the redesign.",
  },
  {
    question: "Can you redesign only selected pages?",
    answer:
      "Yes. In some cases, selected-page redesigns are possible when a full rebuild is not necessary and the biggest issues are concentrated on a few key pages.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Website Redesign Service in Nigeria | Web Growth",
  description: pageDescription,
  path: "/services/website-redesign/",
  keywords: [
    "website redesign service in Nigeria",
    "website redesign service",
    "business website redesign",
    "website redesign for small business",
    "redesign outdated website",
    "website redesign company in Nigeria",
    "improve website conversion",
    "website not generating leads",
    "website redesign Nigeria",
    "conversion-focused website redesign",
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
      name: "Website Redesign Service",
      description: pageDescription,
      url: canonicalUrl,
      serviceType: "Website Redesign Service",
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
      { name: "Website Redesign", path: "/services/website-redesign/" },
    ]),
  ];

  return (
    <>
      <StructuredData data={schema} />

      <main className="relative overflow-x-clip bg-black text-white">
        <HeroSection
          eyebrow="Website Redesign Service"
          title="Website Redesign Service in Nigeria for Businesses That Need Better Results"
          description="Web Growth redesigns outdated, unclear, or low-converting websites into faster, cleaner, conversion-focused websites built to create trust and support more enquiries."
          primaryLabel="Request a Website Redesign Review"
          primaryHref="/contact/"
          secondaryLabel="View Website Audit Service"
          secondaryHref="/services/website-audit/"
          trustLine="Clarity-first redesigns | Mobile-first layouts | Speed and performance improvements | SEO-friendly structure | Conversion-focused CTAs"
          locationNote="This service is for businesses that need more than a visual refresh. A website redesign Nigeria project should improve trust, clarity, speed, and the user journey so the website supports better results."
          fitTags={[
            "Website redesign service in Nigeria",
            "Business website redesign",
            "Conversion-focused website redesign",
          ]}
          asideTitle="Redesign focus"
          asideItems={[
            "Improve how quickly visitors understand the offer and why the business is worth contacting.",
            "Refine structure, trust signals, and CTA flow so the site feels clearer and easier to act on.",
            "Support better mobile usability and speed for businesses whose current site is not generating leads consistently.",
          ]}
          imageAlt="Website redesign service page for Web Growth"
        />

        <AnswerHighlightsSection
          eyebrow="The business problem"
          title="Your Website May Be Costing You Trust Before Customers Contact You"
          description="Many outdated or unclear websites create the wrong first impression. The design feels old, the message is hard to follow, the mobile experience is weak, and the calls to action do not guide people clearly enough toward enquiry."
          items={problemItems}
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Warning signs
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Signs Your Business Website Needs a Redesign
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                A website redesign service becomes the right next step when the site is
                not helping the business make a strong first impression or guide
                visitors toward action.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {warningSigns.map((item) => (
                <article
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/10 text-xs text-emerald-200">
                      ✓
                    </span>
                    <p className="text-sm leading-6 text-white/80">{item}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/contact/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
              >
                Request a Website Redesign Review
              </Link>
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
                A Redesign Should Improve More Than How the Website Looks
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                A good redesign outdated website project should improve clarity, trust,
                usability, and the conversion path rather than only making the site
                look newer.
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
          title="What Your Website Redesign Can Include"
          description="A business website redesign can include the structure, messaging, contact paths, and technical cleanup needed to make the site clearer and more useful."
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Before vs after
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                From Outdated Website to Clearer Sales Asset
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Website redesign for small business should improve business clarity,
                trust, speed, and conversion flow, not just apply a visual refresh.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-white/10 bg-black/30 p-7 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">Before</p>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-white/78">
                  {[
                    "Generic homepage",
                    "Weak CTA",
                    "Slow pages",
                    "Poor mobile layout",
                    "Confusing services",
                    "Low trust",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-white/45" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-3xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-7 shadow-[0_16px_36px_rgba(0,0,0,0.22)]">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">After</p>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-white/82">
                  {[
                    "Clear offer and positioning",
                    "Strong enquiry path",
                    "Faster user experience",
                    "Mobile-first structure",
                    "Clear service sections",
                    "Stronger proof and credibility",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-300/85" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
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
                A Clear Redesign Process From Audit to Launch
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                This process is built to help business owners understand what will
                change, why it matters, and how the redesign will support a better user
                journey.
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
                Request a Website Redesign Review
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Who this is for
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Who This Website Redesign Service Is For
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                This website redesign company in Nigeria service is for businesses that
                need a more professional online presence and a clearer path to
                enquiries.
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
                href="/services/business-website-design/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Business Website Design
              </Link>
              <Link
                href="/services/website-audit/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Website Audit
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
                Why Web Growth
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Why Redesign With Web Growth
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Web Growth approaches redesign as a business improvement service built
                to improve clarity and trust, not as a decorative exercise.
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
          eyebrow="Selected redesign work"
          title="Selected Website Redesign Work"
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
                If you need supporting work around the redesign, these services are the
                closest next steps.
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
          title="Website Redesign Service FAQs"
          description="Helpful answers for businesses comparing scope, timing, speed improvements, SEO handling, and whether a full or partial redesign makes sense."
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
                    Is Your Current Website Holding Your Business Back?
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                    Send your website link and we&apos;ll review the main issues
                    affecting trust, speed, clarity, and enquiry flow.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/contact/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                  >
                    Request a Website Redesign Review
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
