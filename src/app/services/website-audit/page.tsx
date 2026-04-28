import Link from "next/link";
import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import FAQSection from "@/components/FAQSection";
import HeroSection from "@/components/HeroSection";
import StructuredData from "@/components/StructuredData";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import GeneratedSectionBackground from "@/components/GeneratedSectionBackground";
import { buildBreadcrumbSchema, buildFaqSchema, buildPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const canonicalUrl = "https://webgrowth.info/services/website-audit/";
const pageDescription =
  "Get a practical website audit that identifies issues affecting trust, speed, clarity, SEO foundation, and enquiry flow on your business website.";

const problemItems = [
  {
    title: "Visitors do not understand the offer quickly",
    answer:
      "Many websites fail because the value is not clear fast enough. Visitors land on the page, hesitate, and leave before they understand what the business actually offers.",
  },
  {
    title: "Weak trust and weak CTAs create friction",
    answer:
      "Hidden calls to action, an outdated feel, unclear service structure, and missing buyer reassurance can weaken confidence before someone decides to enquire.",
  },
  {
    title: "Mobile and speed issues reduce response",
    answer:
      "Poor mobile experience and slow-loading pages create extra friction for people who may already be unsure about contacting the business.",
  },
  {
    title: "Deeper issues need a clearer diagnosis",
    answer:
      "A website audit service helps identify what is affecting trust, clarity, speed, mobile usability, and enquiry flow before you spend money on the wrong fix.",
    href: "/services/website-redesign/",
    hrefLabel: "See How a Redesign Can Fix Deeper Website Issues",
  },
] as const;

const auditChecks = [
  {
    title: "Clarity",
    description:
      "Whether visitors can quickly understand what the business does, who it helps, and what action to take next.",
  },
  {
    title: "Trust",
    description:
      "Whether the page has enough proof, structure, polish, and credibility to reduce doubt and feel more trustworthy.",
  },
  {
    title: "Conversion flow",
    description:
      "Whether calls to action, forms, WhatsApp links, and page sections guide visitors toward enquiry clearly.",
  },
  {
    title: "Mobile experience",
    description:
      "Whether the website is easy to read, navigate, and act on from a phone where many visitors first see the business.",
  },
  {
    title: "Speed and performance",
    description:
      "Whether slow loading or heavy pages may be hurting user experience and adding friction before the visitor reaches the CTA.",
  },
  {
    title: "SEO foundation",
    description:
      "Whether important pages have clear titles, descriptions, headings, internal links, and a crawlable structure.",
  },
  {
    title: "Content structure",
    description:
      "Whether the homepage and service pages answer buyer questions properly and support a cleaner enquiry path.",
  },
] as const;

const deliverables = [
  {
    title: "Summary of key website issues",
    description:
      "A clear overview of the most important problems affecting trust, clarity, speed, and enquiry flow.",
  },
  {
    title: "Trust and clarity observations",
    description:
      "Notes on what may be creating hesitation, confusion, or a weak first impression for visitors.",
  },
  {
    title: "CTA and enquiry-flow recommendations",
    description:
      "Practical suggestions on how the website can guide people more clearly toward enquiry, booking, or contact.",
  },
  {
    title: "Mobile and speed observations",
    description:
      "Useful observations about mobile usability, loading behavior, and areas where friction may be hurting response.",
  },
  {
    title: "SEO foundation notes",
    description:
      "A review of the core SEO basics such as titles, descriptions, headings, internal links, and crawlable page structure.",
  },
  {
    title: "Priority fixes and next steps",
    description:
      "The issues are organized by importance, with practical next steps that may include small fixes, page improvements, or redesign direction.",
  },
] as const;

const audienceItems = [
  {
    title: "Businesses getting traffic but few enquiries",
    description:
      "This fits businesses that get visitors but do not understand why those visits are not turning into calls, messages, or form submissions.",
  },
  {
    title: "Business owners planning a redesign",
    description:
      "It also suits owners who need to understand what is actually wrong before committing to a bigger redesign or rebuild.",
  },
  {
    title: "Local, service, and product businesses",
    description:
      "Local businesses, service businesses, and ecommerce brands can all benefit when the website has weak messaging, weak trust signals, or too much friction.",
  },
] as const;

const commonIssues = [
  "Unclear homepage headline",
  "Weak or missing CTA",
  "Too much generic copy",
  "Poor mobile spacing",
  "Slow-loading images or scripts",
  "Confusing service structure",
  "Missing trust signals",
  "Missing FAQs",
  "Weak meta titles or descriptions",
  "Poor internal linking",
  "Contact form or WhatsApp friction",
] as const;

const processSteps = [
  {
    step: "1",
    title: "Send Your Website Link",
    description:
      "You send the website URL and any concerns about low enquiries, weak trust, poor mobile experience, or confusing page performance.",
  },
  {
    step: "2",
    title: "Website Review",
    description:
      "Web Growth reviews clarity, trust, speed, mobile experience, SEO foundation, and enquiry flow from a business perspective.",
  },
  {
    step: "3",
    title: "Findings and Priorities",
    description:
      "The most important issues are organized by impact and urgency so you can see what matters first.",
  },
  {
    step: "4",
    title: "Recommendation",
    description:
      "You receive practical next steps, which may include smaller fixes, page improvements, or a deeper redesign direction if needed.",
  },
] as const;

const whyItems = [
  {
    title: "Business and conversion perspective",
    description:
      "Web Growth reviews websites from a business and conversion angle, not only from a visual or technical perspective.",
  },
  {
    title: "Focus on clarity, trust, speed, and enquiry flow",
    description:
      "The audit looks at the issues that may affect buyer confidence, usability, and whether people know how to take the next step.",
  },
  {
    title: "Practical next steps instead of vague advice",
    description:
      "The goal is to give practical recommendations you can understand and act on, rather than abstract comments that do not help decisions.",
  },
  {
    title: "Support beyond the audit",
    description:
      "If needed, Web Growth can also help implement fixes, page improvements, or redesign work after the audit is complete.",
  },
] as const;

const relatedServices = [
  { title: "Website Redesign", href: "/services/website-redesign/" },
  { title: "Business Website Design", href: "/services/business-website-design/" },
  { title: "Landing Page Design", href: "/services/landing-page-design/" },
  { title: "Online Store Website Design", href: "/services/ecommerce-website-design/" },
  { title: "Performance Optimisation", href: "/services/performance-optimisation/" },
] as const;

const faqs = [
  {
    question: "What is a website audit?",
    answer:
      "A website audit reviews the website to identify issues affecting trust, clarity, speed, SEO foundation, mobile experience, and enquiry flow.",
  },
  {
    question: "Who needs a website audit?",
    answer:
      "It is useful for businesses with low enquiries, outdated websites, poor mobile experience, unclear messaging, or uncertainty about what needs fixing first.",
  },
  {
    question: "Will a website audit fix my website automatically?",
    answer:
      "No. The audit identifies issues and recommendations. Implementation is a separate step unless we agree to carry out the fixes afterward.",
  },
  {
    question: "What areas do you check during the audit?",
    answer:
      "The review covers clarity, calls to action, trust signals, speed, mobile experience, SEO basics, page structure, and contact paths.",
  },
  {
    question: "Can the audit help before a redesign?",
    answer:
      "Yes. It can help you understand what should change first and whether the business needs smaller fixes or a broader redesign.",
  },
  {
    question: "Can you audit ecommerce or online store websites?",
    answer:
      "Yes. Online store audits can review product presentation, trust, mobile shopping flow, and checkout or enquiry friction.",
  },
  {
    question: "What happens after the audit?",
    answer:
      "After the audit, you can choose to act on the recommendations with smaller fixes, page improvements, or a redesign or rebuild if that makes more sense.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Website Audit Service | Web Growth",
  description: pageDescription,
  path: "/services/website-audit/",
  keywords: [
    "website audit service",
    "website audit Nigeria",
    "website review service",
    "website conversion audit",
    "website performance audit",
    "website SEO audit",
    "website not getting leads",
    "website usability audit",
    "website speed audit",
    "website enquiry audit",
  ],
  image: "/images/hero/Hero-Image-1.webp",
});

export default function Page() {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: "Website Audit Service",
      description: pageDescription,
      url: canonicalUrl,
      serviceType: "Website Audit Service",
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
      { name: "Website Audit", path: "/services/website-audit/" },
    ]),
  ];

  return (
    <>
      <StructuredData data={schema} />

      <main className="relative overflow-x-clip bg-black text-white">
        <HeroSection
          eyebrow="Website Audit Service"
          title="Website Audit Service for Businesses Not Getting Enough Enquiries"
          description="Web Growth reviews your website to identify the issues affecting trust, speed, clarity, mobile experience, SEO foundation, and enquiry flow."
          primaryLabel="Request a Website Audit"
          primaryHref="/contact/"
          secondaryLabel="View Website Redesign Service"
          secondaryHref="/services/website-redesign/"
          trustLine="Trust and clarity review | Speed and mobile checks | SEO foundation review | CTA and enquiry flow review | Practical recommendations"
          locationNote="This is a low-friction entry service for businesses that want to understand what is stopping their website from performing better before committing to bigger changes."
          fitTags={[
            "Website audit service",
            "Website conversion audit",
            "Website review service",
          ]}
          asideTitle="Audit focus"
          asideItems={[
            "Identify what may be affecting trust, clarity, and the first impression your website creates.",
            "Review how speed, mobile experience, CTAs, and contact paths may be adding friction.",
            "Give practical next steps before you spend on fixes, ads, or a larger redesign.",
          ]}
          imageAlt="Website audit service page for Web Growth"
        />

        <AnswerHighlightsSection
          eyebrow="The enquiry problem"
          title="If Your Website Gets Visitors but Few Enquiries, Something Is Blocking Trust"
          description="Many websites underperform because visitors do not understand the offer quickly, calls to action are weak, the site feels outdated, or the contact path creates more friction than confidence."
          items={problemItems}
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Audit areas
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                What the Website Audit Checks
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                This is a business-friendly website review service designed to show what
                may be hurting clarity, trust, user experience, and enquiry flow.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {auditChecks.map((item) => (
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

        <WhatYouGetSection
          items={deliverables}
          title="What You Receive After the Audit"
          description="The audit is designed to give practical, understandable findings and next steps rather than overwhelm you with technical noise."
        />

        <section className="relative overflow-hidden border-b border-white/10 bg-[#060907] py-20">
          <GeneratedSectionBackground variant="service" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Who this is for
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Who This Website Audit Is For
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                This audit fits businesses that suspect something is off with the
                website but need a clearer diagnosis before deciding on the next move.
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
                href="/local-business/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Local Business
              </Link>
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
                href="/services/business-website-design/"
                className="inline-flex rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/85 transition hover:border-emerald-400/35 hover:text-emerald-200"
              >
                Business Website Design
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
          <GeneratedSectionBackground variant="snapshot" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Common findings
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                Common Website Issues an Audit Can Reveal
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                These are the kinds of issues a website enquiry audit often uncovers
                when a site feels busy but underperforms where it matters.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {commonIssues.map((item) => (
                <article
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-300/85" />
                    <p className="text-sm leading-6 text-white/80">{item}</p>
                  </div>
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
                Process
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                A Simple Audit Process
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The audit is designed to feel straightforward and low-friction so you
                can understand the real issues before choosing the next step.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-4">
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
                Request a Website Audit
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
                Why Let Web Growth Audit Your Website
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                The audit is designed to improve clarity and trust by identifying what
                may be affecting the user journey, not by throwing technical jargon at
                you.
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
                If the audit reveals broader needs, these are the most likely next
                services to consider.
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
          title="Website Audit Service FAQs"
          description="Helpful answers for businesses comparing audits, redesign planning, ecommerce review needs, and what happens after the findings are delivered."
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
                    Find Out What Is Stopping Your Website From Getting Enquiries
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                    Send your website link and we&apos;ll review the issues affecting
                    trust, speed, clarity, mobile experience, SEO foundation, and
                    enquiry flow.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/contact/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                  >
                    Request a Website Audit
                  </Link>
                  <Link
                    href="/services/website-redesign/"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                  >
                    Explore Website Redesign
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
