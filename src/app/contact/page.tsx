import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import TrackedLink from "@/components/analytics/TrackedLink";
import { Suspense } from "react";
import ContactClient from "@/components/ContactClient";
import StructuredData from "@/components/StructuredData";
import { buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";
import {
  buildWhatsAppUrl,
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
} from "@/lib/site";

const pageDescription =
  "Contact Victor Chinukwue at Web Growth to ask about a new website, a redesign, or a landing page project.";

const contactAnswers = [
  {
    title: "What happens after I submit?",
    answer:
      "You get a direct reply from Victor with what makes sense, what is needed, and what the next step should be.",
    href: "/about",
    hrefLabel: "See who you will work with",
  },
  {
    title: "What should I include in the message?",
    answer:
      "The business type, what page or website you need, whether you already have a domain, and the timeline you are working with.",
    href: "/get-started",
    hrefLabel: "Use the intake flow",
  },
  {
    title: "Who am I speaking with?",
    answer:
      "You are speaking directly with Victor Chinukwue, founder of Web Growth. I handle the strategy, design, and build myself.",
    href: "/portfolio",
    hrefLabel: "See real projects",
  },
  {
    title: "What if I am still comparing options?",
    answer:
      "If you are still comparing, send the project anyway. It is better to get a direct fit check than keep guessing from generic package pages.",
    href: "/pricing",
    hrefLabel: "Review pricing",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Contact Web Growth | Request a Website Quote",
  description: pageDescription,
  path: "/contact",
  keywords: [
    "website quote lagos",
    "contact web designer lagos",
    "contact victor chinukwue",
    "request website quote",
    "contact web growth",
  ],
});

export default function ContactPage() {
  return (
    <>
      <StructuredData data={buildProfessionalServiceSchema("/contact", pageDescription)} />

      <main className="bg-[#050806] text-white">
        <section className="border-b border-white/10 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Contact</p>
                <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-6xl">
                  Talk directly with the person building the site
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                  If you need a redesign, a landing page, or a new business website,
                  send the basics and I will get back to you directly.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <TrackedLink
                    href="#contact-form"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                    ctaName="get_started"
                    ctaLocation="contact_hero_primary"
                    destination="#contact-form"
                    pageType="contact"
                    offerType="website_launch"
                  >
                    Send Project Details
                  </TrackedLink>
                  <TrackedLink
                    href={buildWhatsAppUrl(
                      "Hello, I want to discuss my website project."
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                    ctaName="whatsapp"
                    ctaLocation="contact_hero_whatsapp"
                    destination="whatsapp"
                    pageType="contact"
                    offerType="consultation"
                  >
                    Message on WhatsApp
                  </TrackedLink>
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">Why this feels simpler</p>
                  <p className="mt-3 text-sm leading-6 text-white/75">
                    You are not going through a sales team. You are messaging Victor directly, so the reply is usually simple and practical.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/72">
                      Same-day response in most cases
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/72">
                      Strategy, design, and development handled directly
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-white/75">
                    Email:{" "}
                    <a href={CONTACT_EMAIL_HREF} className="text-emerald-300 hover:text-emerald-200">
                      {CONTACT_EMAIL}
                    </a>
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/75">
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

              <Suspense
                fallback={
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
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
          title="The quick answers that remove hesitation"
          description="A few quick answers so you know what happens next and who you are dealing with."
          items={contactAnswers}
        />
      </main>
    </>
  );
}
