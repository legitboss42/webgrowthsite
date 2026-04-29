import { Suspense } from "react";
import Link from "next/link";
import ContactClient from "@/components/ContactClient";
import StructuredData from "@/components/StructuredData";
import TrackedLink from "@/components/analytics/TrackedLink";
import {
  buildFaqSchema,
  buildPageMetadata,
  buildProfessionalServiceSchema,
} from "@/lib/seo";
import { BUSINESS_PHONE_DISPLAY, CONTACT_EMAIL, CONTACT_EMAIL_HREF, buildWhatsAppUrl } from "@/lib/site";

const pageDescription =
  "Request a website review from Web Growth. Send your website link or business details and get guidance on clarity, trust, speed, mobile experience, and enquiry flow.";

const faqs = [
  {
    question: "What should I send for a website review?",
    answer:
      "The fastest start is your website link, what the business does, and the main issue you want fixed. If you do not have a live site yet, business details are enough to begin.",
  },
  {
    question: "Will I get a full audit immediately?",
    answer:
      "Not always. You may receive a quick initial response first. A deeper audit, redesign plan, or implementation quote can be discussed after reviewing your request.",
  },
  {
    question: "Can I use WhatsApp instead of the form?",
    answer:
      "Yes. If you prefer, you can send your website link or business details directly on WhatsApp and continue the conversation there.",
  },
  {
    question: "What kinds of requests fit this page?",
    answer:
      "This page is designed for website reviews, redesigns, new business websites, landing pages, ecommerce website requests, speed improvement work, and cases where you are not sure what the next step should be.",
  },
] as const;

const serviceLinks = [
  { href: "/services/website-audit/", label: "Website Audit" },
  { href: "/services/business-website-design/", label: "Business Website Design" },
  { href: "/services/website-redesign/", label: "Website Redesign" },
  { href: "/services/landing-page-design/", label: "Landing Page Design" },
  { href: "/services/ecommerce-website-design/", label: "Online Store Website Design" },
  { href: "/services/performance-optimisation/", label: "Website Speed Optimization" },
] as const;

export const metadata = buildPageMetadata({
  title: "Contact Web Growth | Request a Website Review",
  description: pageDescription,
  path: "/contact/",
  keywords: [
    "contact web growth",
    "request a website review",
    "website review request",
    "website audit enquiry",
    "website redesign enquiry",
    "website speed review",
  ],
});

export default function ContactPage() {
  const directDeliveryConfigured = Boolean(
    process.env.MAILERSEND_API_TOKEN && process.env.MAILERSEND_FROM_EMAIL
  );
  const whatsappHref = buildWhatsAppUrl(
    "Hello Web Growth, I would like a website review. Here is my website/business detail:"
  );

  return (
    <>
      <StructuredData
        data={[
          buildProfessionalServiceSchema("/contact/", pageDescription),
          buildFaqSchema(faqs),
        ]}
      />

      <main className="bg-[#050806] text-white">
        <section className="relative overflow-hidden border-b border-white/10 py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(16,185,129,0.08),transparent_30%)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.96fr]">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                  Website Review Request
                </p>
                <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-6xl">
                  Request a Website Review
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
                  Send your website link or business details and Web Growth will review
                  what may be affecting trust, clarity, speed, mobile experience, and
                  enquiry flow.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <TrackedLink
                    href="#contact-form"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                    ctaName="website_review"
                    ctaLocation="contact_hero_primary"
                    destination="#contact-form"
                    pageType="contact"
                    offerType="website_review"
                  >
                    Start Website Review
                  </TrackedLink>
                  <TrackedLink
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                    ctaName="whatsapp"
                    ctaLocation="contact_hero_whatsapp"
                    destination="whatsapp"
                    pageType="contact"
                    offerType="website_review"
                  >
                    Send Website Link on WhatsApp
                  </TrackedLink>
                </div>

                <div className="mt-8 rounded-3xl border border-white/10 bg-black/35 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">
                    What this review can help with
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      "Website audit or review",
                      "New business website",
                      "Website redesign",
                      "Landing page",
                      "Online store or ecommerce website",
                      "Website speed improvement",
                      "Not sure yet and need guidance",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm text-white/72"
                      >
                        {item}
                      </div>
                    ))}
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
                        rel="noopener noreferrer"
                        className="text-emerald-300 hover:text-emerald-200"
                      >
                        {BUSINESS_PHONE_DISPLAY}
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
                <ContactClient directDeliveryConfigured={directDeliveryConfigured} />
              </Suspense>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">
                What happens next
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-white">
                What Happens After You Send Your Request?
              </h2>
              <ol className="mt-6 space-y-4 text-sm leading-7 text-white/72">
                <li>1. We review your website or business details.</li>
                <li>
                  2. We identify the likely issues affecting clarity, trust, speed,
                  mobile experience, or enquiry flow.
                </li>
                <li>
                  3. We recommend the best next step: quick fix, website audit,
                  redesign, landing page, online store, or new business website.
                </li>
              </ol>
              <p className="mt-5 text-sm leading-7 text-white/62">
                You may receive a quick initial response first. A deeper audit,
                redesign plan, or implementation quote can be discussed after
                reviewing your request.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/35 p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">
                WhatsApp option
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-white">
                Prefer to Send the Website Link Directly?
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/72">
                If you already have a live website, the fastest path can be a simple
                WhatsApp message with the URL and the main problem you want fixed.
              </p>
              <TrackedLink
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                ctaName="whatsapp"
                ctaLocation="contact_whatsapp_section"
                destination="whatsapp"
                pageType="contact"
                offerType="website_review"
              >
                Send Website Link on WhatsApp
              </TrackedLink>
              <p className="mt-4 text-xs leading-6 text-white/50">
                Use this if your request is urgent or if you would rather start the
                conversation there.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">
              Helpful links
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-white">
              Explore the Core Services Behind the Next Step
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {serviceLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5 text-sm font-medium text-white/78 transition hover:border-emerald-400/35 hover:bg-white/[0.08] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-300/80">
                Selected work
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                You can also explore selected website projects before sending your
                request. The portfolio now shows real desktop, tablet, and mobile
                views from live websites so you can inspect the quality more clearly.
              </p>
              <Link
                href="/portfolio/"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-black/35 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
              >
                Explore selected website projects
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">
                Final reassurance
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-white">
                Clear guidance first, then the right recommendation
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">
                This page is designed to help you start with the right conversation,
                not force you into the wrong service. If the issue is small, that can
                be identified quickly. If the site needs a deeper audit, redesign, or
                rebuild, the recommendation can follow after review.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
