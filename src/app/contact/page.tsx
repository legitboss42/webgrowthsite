import { Suspense } from "react";
import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import ContactClient from "@/components/ContactClient";
import StructuredData from "@/components/StructuredData";
import TrackedLink from "@/components/analytics/TrackedLink";
import { buildFaqSchema, buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF, buildWhatsAppUrl } from "@/lib/site";

const pageDescription =
  "Request a premium website quote from Web Growth and get a direct reply on scope, timing, and the right Next.js build for your business.";

const faqs = [
  {
    question: "What happens after I reach out?",
    answer:
      "You get a direct reply on fit, likely scope, timing, and the best next step for the project.",
  },
  {
    question: "Do I need everything figured out first?",
    answer:
      "No. A clear summary of the business, the problem, and what you think you need is enough to start the conversation properly.",
  },
  {
    question: "Do you work with redesigns?",
    answer:
      "Yes. Redesigns are a strong fit, especially when the current website feels slow, dated, hard to trust, or weak on conversion.",
  },
  {
    question: "What kinds of businesses are the best fit?",
    answer:
      "The best fit is high-end service businesses, clinics, premium local brands, and ambitious e-commerce businesses that care about quality and performance.",
  },
] as const;

const answerCards = [
  {
    title: "What happens after I reach out?",
    answer: faqs[0].answer,
    href: "/about",
    hrefLabel: "See who you will work with",
  },
  {
    title: "Do I need everything figured out first?",
    answer: faqs[1].answer,
    href: "/launch",
    hrefLabel: "See the launch package",
  },
  {
    title: "Do you work with redesigns?",
    answer: faqs[2].answer,
    href: "/portfolio",
    hrefLabel: "Review recent work",
  },
  {
    title: "What businesses are the best fit?",
    answer: faqs[3].answer,
    href: "/pricing",
    hrefLabel: "See package pricing",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Request a Premium Website Quote | Web Growth",
  description: pageDescription,
  path: "/contact",
  keywords: [
    "request a premium website quote",
    "request website quote",
    "contact web design agency",
    "website project inquiry",
    "next.js website quote",
    "website redesign inquiry",
  ],
});

export default function ContactPage() {
  return (
    <>
      <StructuredData
        data={[
          buildProfessionalServiceSchema("/contact", pageDescription),
          buildFaqSchema(faqs),
        ]}
      />

      <main className="bg-[#050806] text-white">
        <section className="relative overflow-hidden border-b border-white/10 py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(16,185,129,0.08),transparent_30%)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr]">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                  Contact
                </p>
                <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-6xl">
                  Start with a direct technical review of your website project
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
                  If you need a premium redesign, a high-performance launch, or a
                  conversion-focused landing page, send the brief and get a clear
                  reply on fit, scope, and next steps.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <TrackedLink
                    href="#contact-form"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                    ctaName="contact_form"
                    ctaLocation="contact_hero_primary"
                    destination="#contact-form"
                    pageType="contact"
                    offerType="website_project"
                  >
                    Request a Premium Website Quote
                  </TrackedLink>
                  <TrackedLink
                    href={buildWhatsAppUrl("Hello, I want to discuss my website project.")}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                    ctaName="whatsapp"
                    ctaLocation="contact_hero_whatsapp"
                    destination="whatsapp"
                    pageType="contact"
                    offerType="website_project"
                  >
                    Message on WhatsApp
                  </TrackedLink>
                </div>

                <div className="mt-8 rounded-3xl border border-white/10 bg-black/35 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">
                    A low-friction start
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/75">
                    You are not entering a sales pipeline. Serious enquiries get a
                    direct response with a practical recommendation instead of vague
                    back-and-forth.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm text-white/72">
                      Same-day response in most cases
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm text-white/72">
                      Strategy, design, and development handled directly
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-white/72">
                    <p>
                      Email:{" "}
                      <a href={CONTACT_EMAIL_HREF} className="text-emerald-300 hover:text-emerald-200">
                        {CONTACT_EMAIL}
                      </a>
                    </p>
                    <p>
                      WhatsApp:{" "}
                      <a
                        href="https://wa.me/2348066706336"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-300 hover:text-emerald-200"
                      >
                        https://wa.me/2348066706336
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <Suspense
                fallback={
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
                    Loading form...
                  </div>
                }
              >
                <ContactClient />
              </Suspense>
            </div>
          </div>
        </section>

        <AnswerHighlightsSection
          eyebrow="Before you submit"
          title="The quick answers serious buyers usually want before they enquire"
          description="A few crisp answers so you know how the process starts, what kind of projects fit best, and how little friction there is to begin."
          items={answerCards}
        />
      </main>
    </>
  );
}
