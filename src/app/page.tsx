import Link from "next/link";
import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import FAQSection from "@/components/FAQSection";
import HeroSection from "@/components/HeroSection";
import SocialProofSection from "@/components/SocialProofSection";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import { featuredPortfolioCases } from "@/lib/portfolioCases";
import { buildPageMetadata } from "@/lib/seo";

const pageDescription =
  "Web Growth is a web design agency in Nigeria building fast, conversion-focused websites for businesses that need more trust, enquiries, and online sales.";

const homepageFaqs = [
  {
    question: "How much does a business website cost in Nigeria?",
    answer:
      "Website cost depends on the number of pages, content needs, features, integrations, and project timeline. Smaller brochure-style websites cost less than larger business websites, redesigns, or ecommerce builds.",
  },
  {
    question: "How long does it take to build a website?",
    answer:
      "Timeline depends on scope, content readiness, revisions, and integrations. A focused website project can move faster than a larger redesign or ecommerce website with more pages and technical requirements.",
  },
  {
    question: "Can you redesign my existing website?",
    answer:
      "Yes. Website redesign projects can improve clarity, speed, mobile experience, page structure, trust signals, and the overall conversion flow without changing what makes your business valuable.",
  },
  {
    question: "Do you build ecommerce websites?",
    answer:
      "Yes. Ecommerce website design can include product pages, category structure, trust sections, mobile-friendly browsing, and a cleaner checkout experience built around how people actually shop.",
  },
  {
    question: "Will my website be mobile-friendly?",
    answer:
      "Yes. Every website should be designed mobile-first so visitors can read, trust, and act easily on smaller screens without friction.",
  },
  {
    question: "Can you help me understand why my current website is not getting enquiries?",
    answer:
      "Yes. A website review or audit can identify issues affecting speed, trust, clarity, calls to action, and conversion flow so you know what is holding the site back before rebuilding.",
  },
] as const;

const problemItems = [
  {
    title: "The offer is not clear enough",
    answer:
      "If visitors cannot quickly understand what the business does, who it helps, and why it matters, they leave before trust has time to build.",
  },
  {
    title: "The CTA does not guide action",
    answer:
      "A weak or buried call to action makes people hesitate even when they are interested, because the next step is not obvious enough.",
  },
  {
    title: "Slow mobile pages weaken trust",
    answer:
      "When pages load slowly or feel awkward on mobile, the business can look less established and less reliable than it really is.",
  },
  {
    title: "The page does not build confidence fast",
    answer:
      "If the structure, content, and trust signals do not help visitors feel comfortable quickly, they will not know what to do next.",
    href: "/services/website-audit/",
    hrefLabel: "Find Out What Is Holding Your Website Back",
  },
] as const;

const speedTrustItems = [
  {
    title: "Custom-coded websites",
    description:
      "Web Growth builds custom-coded websites designed around your offer instead of forcing your business into a generic template structure.",
  },
  {
    title: "Fast-loading pages",
    description:
      "Fast business websites help visitors stay engaged longer, understand the offer sooner, and move through the page with less friction.",
  },
  {
    title: "Clear service positioning",
    description:
      "Every page is structured to explain what you do, who it is for, and why a buyer should take the next step.",
  },
  {
    title: "Mobile-first layouts",
    description:
      "Layouts are built to feel clean and credible on mobile because that is where many visitors form their first impression.",
  },
  {
    title: "Conversion-focused CTAs",
    description:
      "Calls to action are placed to support enquiries and reduce hesitation instead of leaving visitors unsure about what to do next.",
  },
  {
    title: "Analytics-ready SEO foundation",
    description:
      "The site structure is built with a clean SEO foundation and measurement-ready setup to support stronger search visibility and clearer decision-making.",
  },
] as const;

const coreServices = [
  {
    title: "Business Website Design",
    description:
      "Business website design Nigeria companies can use to explain their offer clearly, build trust quickly, and support more enquiries.",
    href: "/services/business-website-design/",
  },
  {
    title: "Website Redesign",
    description:
      "Website redesign Nigeria businesses can use to improve structure, speed, messaging, and trust without starting from confusion.",
    href: "/services/website-redesign/",
  },
  {
    title: "Landing Page Design",
    description:
      "Landing page design Nigeria campaigns can rely on when a focused offer needs a clearer message and a stronger CTA path.",
    href: "/services/landing-page-design/",
  },
  {
    title: "Ecommerce Website Design",
    description:
      "Ecommerce website design Nigeria brands can use to improve browsing, trust, and checkout readiness on mobile and desktop.",
    href: "/services/ecommerce-website-design/",
  },
  {
    title: "Website Audit",
    description:
      "A website review that shows what is weakening trust, clarity, speed, and conversion-focused website performance.",
    href: "/services/website-audit/",
  },
  {
    title: "Performance Optimisation",
    description:
      "Speed and UX improvements for businesses that already have traffic but need a faster, stronger website experience.",
    href: "/services/performance-optimisation/",
  },
] as const;

const processSteps = [
  {
    step: "1",
    title: "Website Review",
    description:
      "We look at the current website or project goal and identify the main issues affecting trust, speed, clarity, and conversions.",
  },
  {
    step: "2",
    title: "Strategy and Page Plan",
    description:
      "We define the core pages, message structure, CTAs, and content direction needed to support the business properly.",
  },
  {
    step: "3",
    title: "Design and Build",
    description:
      "The website is designed and built around a clearer user journey, stronger page hierarchy, and a more credible first impression.",
  },
  {
    step: "4",
    title: "SEO and Performance Setup",
    description:
      "Technical foundations are set up to support speed, crawlability, and cleaner search visibility from launch.",
  },
  {
    step: "5",
    title: "Launch and Handover",
    description:
      "The project is reviewed, launched, and handed over with the essentials in place so the business can use the site confidently.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Web Design Agency in Nigeria | Web Growth",
  description: pageDescription,
  path: "/",
  keywords: [
    "web design agency in Nigeria",
    "website design company in Nigeria",
    "website designer in Nigeria",
    "business website design Nigeria",
    "website redesign Nigeria",
    "ecommerce website design Nigeria",
    "landing page design Nigeria",
    "conversion-focused website design",
    "fast business websites",
  ],
  image: "/images/hero/Hero-Image-1.webp",
});

export default function Page() {
  const featuredCases = featuredPortfolioCases;

  return (
    <>
      <main className="relative overflow-x-clip bg-[#050806] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />

        <HeroSection
          eyebrow="Web Design Agency in Nigeria"
          title="Web Design Agency in Nigeria for Fast, Conversion-Focused Websites"
          description="Web Growth is a web design agency in Nigeria helping businesses build fast, modern, conversion-focused websites that create trust and turn visitors into enquiries. We build premium business websites, landing pages, ecommerce websites, and website redesign Nigeria businesses can use to help visitors understand the offer, trust the brand, and take action."
          primaryLabel="Request a Website Review"
          primaryHref="/contact/"
          secondaryLabel="View Website Services"
          secondaryHref="/services/"
          trustLine="Business website design Nigeria | Landing page design Nigeria | Ecommerce website design Nigeria"
          locationNote="Best for business owners who need a website design company in Nigeria that can improve clarity, trust, speed, and conversion flow without turning the project into a technical headache."
          fitTags={["Fast business websites", "Conversion-focused website design", "Nigeria"]}
          asideTitle="What Web Growth builds"
          asideItems={[
            "Business websites designed to make the offer clearer and the next step easier to take.",
            "Website redesign projects that improve structure, trust, and mobile experience without losing commercial focus.",
            "Landing pages and ecommerce websites built to support stronger enquiries, checkout trust, and cleaner user flow.",
          ]}
          imageAlt="Web Growth homepage showing premium website designer in Nigeria positioning"
          showCodeRain
          showHomeAnimations
          pageType="homepage"
        />

        <AnswerHighlightsSection
          eyebrow="The real problem"
          title="A Good-Looking Website Is Not Enough If It Does Not Bring Enquiries"
          description="Many business websites underperform because the offer is unclear, the CTA is weak, the page loads slowly, the mobile experience is poor, and visitors do not get enough trust or direction quickly. A website can look polished and still make it hard for buyers to act."
          items={problemItems}
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(16,185,129,0.16),transparent_40%),radial-gradient(circle_at_82%_80%,rgba(16,185,129,0.08),transparent_34%)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Core website services
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Priority Website Services for Businesses That Need Clarity, Trust, and Action
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Web Growth focuses the homepage on the core services most businesses
                actually need first: business website design, website redesign, landing
                pages, ecommerce builds, website audits, and performance improvements.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {coreServices.map((service) => (
                <article
                  key={service.title}
                  className="relative overflow-hidden rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold text-white">{service.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/76">
                      {service.description}
                    </p>
                    <Link
                      href={service.href}
                      className="mt-5 inline-flex text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
                    >
                      Explore this service
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <Link
                href="/pricing/"
                className="inline-flex rounded-full border border-white/15 bg-black/30 px-4 py-2 text-white/85 transition hover:bg-black/45"
              >
                See pricing
              </Link>
              <Link
                href="/portfolio/"
                className="inline-flex rounded-full border border-white/15 bg-black/30 px-4 py-2 text-white/85 transition hover:bg-black/45"
              >
                Explore selected projects
              </Link>
            </div>
          </div>
        </section>

        <WhatYouGetSection
          items={speedTrustItems}
          title="Built for Speed, Trust, and Conversions"
          description="Web Growth builds websites with a clear commercial purpose: to help visitors understand the offer faster, trust the business sooner, and move toward an enquiry with less hesitation."
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#060907] py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_84%_82%,rgba(16,185,129,0.08),transparent_35%)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Who Web Growth helps
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Websites for Businesses That Need Stronger Sales Support Online
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                We work with service businesses, local businesses, ecommerce brands,
                clinics, consultants, gyms, and growing companies that need a website
                built to support trust, enquiries, and sales instead of just filling a
                space online.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
                <h3 className="text-xl font-semibold">Local businesses</h3>
                <p className="mt-3 text-sm leading-6 text-white/74">
                  For businesses that need clearer positioning, stronger trust, and a
                  better mobile experience for local traffic.
                </p>
                <Link
                  href="/local-business/"
                  className="mt-5 inline-flex text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
                >
                  See local business websites
                </Link>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
                <h3 className="text-xl font-semibold">Ecommerce brands</h3>
                <p className="mt-3 text-sm leading-6 text-white/74">
                  For brands that need cleaner product discovery, trust-building pages,
                  and a stronger ecommerce website design Nigeria visitors can use easily.
                </p>
                <Link
                  href="/ecommerce/"
                  className="mt-5 inline-flex text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
                >
                  See ecommerce website design
                </Link>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
                <h3 className="text-xl font-semibold">Businesses targeting Lagos</h3>
                <p className="mt-3 text-sm leading-6 text-white/74">
                  For businesses that want a website designer in Nigeria with a clearer
                  understanding of premium local positioning and conversion-focused flow.
                </p>
                <Link
                  href="/website-design-lagos/"
                  className="mt-5 inline-flex text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
                >
                  Explore website design Lagos
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(16,185,129,0.16),transparent_40%),radial-gradient(circle_at_85%_82%,rgba(16,185,129,0.08),transparent_34%)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Process
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                A Clear Website Process From Review to Launch
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The process is designed to reduce uncertainty so business owners can see
                what happens next, how decisions are made, and how the website moves from
                review to launch.
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
                  <p className="mt-3 text-sm leading-6 text-white/74">
                    {item.description}
                  </p>
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

        <SocialProofSection
          cards={featuredCases}
          eyebrow="Selected work"
          title="Selected Website Projects and Redesign Work"
          description="Explore selected Web Growth website projects and responsive proof to see how we approach business websites, redesign work, and ecommerce presentation without relying on inflated claims."
        />

        <FAQSection
          items={homepageFaqs}
          title="Homepage Questions Business Owners Usually Ask First"
          description="Short, honest answers to the questions that usually come up before a business decides whether to request a website review."
        />

        <section className="relative overflow-hidden bg-[#050806] py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.1),transparent_32%)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <article className="relative overflow-hidden rounded-3xl border border-emerald-500/35 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(8,12,10,0.96)_55%,rgba(0,0,0,0.9))] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <h2 className="text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                    Not Sure Why Your Website Is Not Bringing Enquiries?
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                    Send your website link and we&apos;ll identify the main issues
                    affecting trust, speed, clarity, and conversions.
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
                    href="/services/website-audit/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                  >
                    View Website Audit Service
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
