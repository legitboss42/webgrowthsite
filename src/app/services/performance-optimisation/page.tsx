import Link from "next/link";
import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import FAQSection from "@/components/FAQSection";
import HeroSection from "@/components/HeroSection";
import StructuredData from "@/components/StructuredData";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import GeneratedSectionBackground from "@/components/GeneratedSectionBackground";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const canonicalUrl = "https://webgrowth.info/services/performance-optimisation/";
const pageDescription =
  "Fix slow website pages with a practical speed optimization service focused on loading speed, mobile experience, Core Web Vitals, and user trust.";

const problemItems = [
  {
    title: "Visitors leave before the page feels ready",
    answer:
      "A slow website can make people leave before they properly engage with the offer, especially on mobile where patience is lower and friction shows faster.",
  },
  {
    title: "Slow pages weaken trust and first impression",
    answer:
      "If the site feels heavy, awkward, or unresponsive, the business can look less reliable even when the offer itself is strong.",
  },
  {
    title: "Performance issues create conversion friction",
    answer:
      "Speed problems can make enquiries, checkouts, forms, or WhatsApp actions feel frustrating and reduce how smoothly people move through the page.",
  },
  {
    title: "The real cause is often unclear",
    answer:
      "A website speed optimization service helps identify what is slowing key pages down before time is wasted on the wrong fix.",
    href: "/services/website-audit/",
    hrefLabel: "Check What Is Slowing Your Website Down",
  },
] as const;

const slowCauses = [
  {
    title: "Heavy images",
    description:
      "Oversized or uncompressed images can make important pages load slowly and feel heavier than they need to.",
  },
  {
    title: "Too many scripts",
    description:
      "Excess plugins, tracking tools, third-party scripts, or animation-heavy setups can add weight and delay the page experience.",
  },
  {
    title: "Poor mobile optimisation",
    description:
      "A site may seem fine on desktop but feel slow or difficult on phones where many business visitors actually browse.",
  },
  {
    title: "Bloated templates or builders",
    description:
      "Some websites carry unnecessary code, effects, or page-builder output that slows the experience without helping the user.",
  },
  {
    title: "Weak hosting or setup",
    description:
      "Hosting, caching, delivery setup, and general configuration can all affect loading speed and responsiveness.",
  },
  {
    title: "Layout and asset issues",
    description:
      "Fonts, videos, sliders, and oversized visual sections can slow first load and make the page feel less responsive.",
  },
] as const;

const improvements = [
  {
    title: "Loading speed",
    description:
      "Improve how quickly key pages load and feel usable so visitors can get to the important message and CTA faster.",
  },
  {
    title: "Mobile experience",
    description:
      "Improve the experience for visitors browsing from phones where speed and usability issues show up more clearly.",
  },
  {
    title: "Core Web Vitals awareness",
    description:
      "Review signals like loading, responsiveness, and visual stability where applicable without overpromising fixed scores.",
  },
  {
    title: "Image and asset handling",
    description:
      "Improve how images, scripts, fonts, and other assets affect page weight and overall user experience.",
  },
  {
    title: "Enquiry and checkout flow",
    description:
      "Reduce speed-related friction around forms, calls to action, checkout paths, or WhatsApp actions.",
  },
  {
    title: "User trust",
    description:
      "Help the site feel more polished, responsive, and reliable, which supports trust before the visitor decides to act.",
  },
] as const;

const reviewItems = [
  {
    title: "Homepage and key page review",
    description:
      "This can include the homepage, major service pages, product pages, or other important pages where speed friction matters most.",
  },
  {
    title: "Mobile performance review",
    description:
      "The review can include how the website behaves on phones, where many visitors first experience the business.",
  },
  {
    title: "Image, font, and asset checks",
    description:
      "Image size and format checks, font loading observations, and broader asset review can be included where they are affecting page weight.",
  },
  {
    title: "Script and tracking review",
    description:
      "The speed review can include a look at scripts, tracking tools, or other add-ons that may be slowing the page down.",
  },
  {
    title: "Core Web Vitals and friction notes",
    description:
      "Core Web Vitals observations, CTA and form friction notes, and basic technical recommendations can be included where appropriate.",
  },
  {
    title: "Priority fix list and support",
    description:
      "The result can include a priority fix list and implementation support where appropriate, depending on the agreed scope.",
  },
] as const;

const audienceItems = [
  {
    title: "Businesses with slow websites",
    description:
      "This service fits businesses that know the site feels slow or heavy and want a clearer path to improving the experience.",
  },
  {
    title: "Service and ecommerce websites losing attention",
    description:
      "It also suits service businesses with heavy homepages and ecommerce brands with slow product pages, carts, or checkout paths.",
  },
  {
    title: "Businesses preparing for growth",
    description:
      "It works well for companies preparing to run ads, improve conversions, or plan a redesign but wanting to understand speed issues first.",
  },
] as const;

const processSteps = [
  {
    step: "1",
    title: "Speed Review",
    description:
      "We review the current website, key pages, mobile experience, and the visible speed issues affecting user experience.",
  },
  {
    step: "2",
    title: "Issue Diagnosis",
    description:
      "We identify what may be slowing the website down, including images, scripts, layout, assets, or setup problems.",
  },
  {
    step: "3",
    title: "Priority Fix Plan",
    description:
      "The fixes are ranked by likely impact, effort, and business importance so you can focus on what matters first.",
  },
  {
    step: "4",
    title: "Implementation",
    description:
      "Where appropriate, agreed improvements are applied across images, assets, scripts, layout, or code-level issues.",
  },
  {
    step: "5",
    title: "Testing and Handover",
    description:
      "Important pages are rechecked and practical notes are provided to help keep the site lighter going forward.",
  },
] as const;

const whyItems = [
  {
    title: "Business and user-experience perspective",
    description:
      "Web Growth looks at speed from a business and user-experience point of view, not only as a technical score problem.",
  },
  {
    title: "Practical fixes instead of vague reports",
    description:
      "The goal is to give practical performance recommendations and improvements, not a report full of vague technical language.",
  },
  {
    title: "Conversion-aware performance work",
    description:
      "We consider mobile experience, calls to action, and enquiry flow so speed improvements support trust and user action.",
  },
  {
    title: "Connected improvement path",
    description:
      "Where needed, speed fixes can also connect into broader audit or redesign recommendations without unnecessary complexity.",
  },
] as const;

const relatedServices = [
  { title: "Website Audit", href: "/services/website-audit/" },
  { title: "Website Redesign", href: "/services/website-redesign/" },
  { title: "Business Website Design", href: "/services/business-website-design/" },
  { title: "Landing Page Design", href: "/services/landing-page-design/" },
  { title: "Online Store Website Design", href: "/services/ecommerce-website-design/" },
] as const;

const faqs = [
  {
    question: "What is website speed optimization?",
    answer:
      "Website speed optimization improves how quickly and smoothly pages load and respond so the site feels lighter, more usable, and more trustworthy.",
  },
  {
    question: "Why does website speed matter for a business?",
    answer:
      "Speed matters because slow pages can reduce trust, frustrate visitors, and create more friction around enquiries, product browsing, or checkout flow.",
  },
  {
    question: "Can you guarantee a perfect Core Web Vitals score?",
    answer:
      "No. Scores depend on hosting, platform, third-party scripts, media, and other technical constraints, so the goal is improvement rather than guaranteed perfection.",
  },
  {
    question: "What pages should be reviewed first?",
    answer:
      "Priority pages usually include the homepage, service pages, product pages, checkout or enquiry pages, and campaign landing pages where speed matters most.",
  },
  {
    question: "Can you fix a slow WordPress website?",
    answer:
      "Where access and setup allow, a WordPress website can be reviewed and improved. The exact fixes depend on how the site is built and what is causing the slowdown.",
  },
  {
    question: "Can speed improvements help ecommerce websites?",
    answer:
      "Yes. Product pages, cart, checkout, and mobile browsing all benefit when the store feels faster and easier to use.",
  },
  {
    question: "What happens after the speed review?",
    answer:
      "After the review, you receive priority fixes and can decide whether to move forward with implementation support where appropriate.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Website Speed Optimization Service | Web Growth",
  description: pageDescription,
  path: "/services/performance-optimisation/",
  keywords: [
    "website speed optimization service",
    "website speed optimisation service",
    "website performance optimization",
    "slow website fix",
    "website speed audit",
    "improve website loading speed",
    "Core Web Vitals optimization",
    "fast business website",
    "website performance optimisation Nigeria",
    "mobile website speed improvement",
  ],
  image: "/images/hero/Hero-Image-1.webp",
});

export default function Page() {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: "Website Speed Optimization Service",
      alternateName: "Website Performance Optimisation",
      description: pageDescription,
      url: canonicalUrl,
      serviceType: "Website Speed Optimization Service",
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
      { name: "Performance Optimisation", path: "/services/performance-optimisation/" },
    ]),
  ];

  return (
    <>
      <StructuredData data={schema} />

      <main className="relative overflow-x-clip bg-black text-white">
        <HeroSection
          eyebrow="Website Speed Optimization Service"
          title="Website Speed Optimization Service for Faster Business Websites"
          description="Web Growth helps businesses improve slow, heavy, or frustrating websites with practical speed, mobile, and performance fixes built to support trust, user experience, and conversions."
          primaryLabel="Request a Website Speed Review"
          primaryHref="/contact/"
          secondaryLabel="View Website Audit Service"
          secondaryHref="/services/website-audit/"
          trustLine="Page speed review | Mobile performance checks | Core Web Vitals awareness | Image and script optimisation | Practical fix recommendations"
          locationNote="This service is designed as a practical performance improvement offer for businesses that need a faster, lighter, and more reliable website experience without turning the project into a huge engineering package."
          fitTags={[
            "Website speed optimization service",
            "Website performance optimisation Nigeria",
            "Fast business website",
          ]}
          asideTitle="Speed focus"
          asideItems={[
            "Identify what is creating speed friction across important pages and mobile browsing.",
            "Improve how the website feels for visitors before they reach the main CTA, form, or checkout step.",
            "Prioritize practical fixes that support trust, usability, and conversion flow rather than technical noise alone.",
          ]}
          imageAlt="Website speed optimization service page for Web Growth"
        />

        <AnswerHighlightsSection
          eyebrow="The performance problem"
          title="A Slow Website Can Make a Good Business Look Unreliable"
          description="When a website loads slowly, feels heavy on mobile, or responds poorly, visitors can leave before they trust the business or take the next step. The issue is not only technical. It affects user experience and confidence."
          items={problemItems}
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Common causes
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                What Usually Slows a Website Down
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Slow website fix work often starts by finding where the real weight and
                friction are coming from across layout, assets, scripts, or setup.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {slowCauses.map((item) => (
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
                Improvements
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                What the Speed Optimization Service Improves
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The goal is to improve loading speed, reduce friction, and help the
                site feel more responsive and reliable without overpromising technical
                perfection.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {improvements.map((item) => (
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
          items={reviewItems}
          title="What Your Website Speed Review Can Include"
          description="The review is built to give practical performance observations and a clearer path to fixes, not an overwhelming technical handoff."
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Who this is for
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Who This Service Is For
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                This service is for businesses that need a faster, smoother, more
                professional website experience before the slow performance costs more
                trust or response.
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
                href="/services/website-redesign/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Website Redesign
              </Link>
              <Link
                href="/services/ecommerce-website-design/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Ecommerce Website Design
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
                A Practical Process for Improving Website Speed
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The process is designed to move from diagnosis into the most useful
                practical fixes without making the project heavier than it needs to be.
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
                Request a Website Speed Review
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
                Why Let Web Growth Improve Your Website Speed
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Web Growth keeps the work practical, conversion-aware, and focused on a
                faster user experience that supports trust and enquiries.
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
                If the performance work reveals broader needs, these are the most
                likely next services to consider.
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
          title="Website Speed Optimization FAQs"
          description="Helpful answers for businesses comparing speed reviews, Core Web Vitals expectations, ecommerce performance needs, and what happens after the recommendations are shared."
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
                    Is a Slow Website Costing You Trust and Enquiries?
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                    Send your website link and we&apos;ll review the main speed,
                    mobile, and performance issues affecting user experience and
                    enquiry flow.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/contact/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                  >
                    Request a Website Speed Review
                  </Link>
                  <Link
                    href="/services/website-audit/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                  >
                    Explore Website Audit
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
