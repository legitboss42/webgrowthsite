import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import TrackedLink from "@/components/analytics/TrackedLink";
import { Suspense } from "react";
import ContactClient from "@/components/ContactClient";
import CorePageLinks from "@/components/CorePageLinks";
import PricingSection from "@/components/PricingSection";
import FinalCTASection from "@/components/FinalCTASection";
import StructuredData from "@/components/StructuredData";
import { pricingTiers } from "@/lib/launchOffer";
import { buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";
import {
  BOOKING_URL,
  buildWhatsAppUrl,
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
} from "@/lib/site";

const pageDescription =
  "Contact Web Growth to start a fast website launch for your business in Lagos, the United Kingdom, or remotely, with direct WhatsApp access, email, and a simple lead form.";

const contactAnswers = [
  {
    title: "What happens after I submit?",
    answer:
      "You get a direct response with likely scope, what we need from you, and the clearest next step instead of a vague autoresponder.",
    href: "/pricing",
    hrefLabel: "Review packages first",
  },
  {
    title: "What should I include in the message?",
    answer:
      "The business type, what page or website you need, whether you already have a domain, and the timeline you are working with.",
    href: "/get-started",
    hrefLabel: "Use the intake flow",
  },
  {
    title: "What if I want the fastest path?",
    answer:
      "Use the form if you want us to review the project quickly, or use WhatsApp if you want a direct conversation before you submit the details.",
    href: "/launch",
    hrefLabel: "See the launch offer",
  },
  {
    title: "What if I am still comparing options?",
    answer:
      "That is fine. Review pricing, the launch offer, and the FAQ first, then submit when you know which path feels right for your business.",
    href: "/faq",
    hrefLabel: "Read the FAQ",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Contact Web Growth",
  description: pageDescription,
  path: "/contact",
  keywords: [
    "contact web designer nigeria",
    "contact web designer lagos",
    "contact web designer uk",
    "request website launch quote",
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
                  Start your fast website launch
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                  If you want a professional site live fast for Lagos, United Kingdom, or remote customers, send the basics and get a direct response.
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
                    Get Started
                  </TrackedLink>
                  <TrackedLink
                    href={BOOKING_URL}
                    target={BOOKING_URL.startsWith("http") ? "_blank" : undefined}
                    rel={BOOKING_URL.startsWith("http") ? "noreferrer" : undefined}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                    ctaName="booking"
                    ctaLocation="contact_hero_booking"
                    destination="booking"
                    pageType="contact"
                    offerType="consultation"
                  >
                    Book a Call
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
                    Chat on WhatsApp
                  </TrackedLink>
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">Direct contact</p>
                  <p className="mt-3 text-sm leading-6 text-white/75">
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
          title="The quick answers that make the contact step easier"
          description="These remove the common hesitation points so you can choose the fastest path and send a clearer request."
          items={contactAnswers}
        />

        <CorePageLinks
          eyebrow="Useful next steps"
          title="Choose the path that fits how ready you are"
          description="Some people want to submit now. Some want pricing, launch details, or a guided intake first. These links keep the next step obvious."
          links={[
            {
              href: "/get-started",
              label: "Intake",
              title: "Want a guided project intake?",
              description:
                "Use the multi-step get-started flow if you want a cleaner way to send your project details.",
            },
            {
              href: "/launch",
              label: "Offer",
              title: "Want the fastest service overview?",
              description:
                "Read the launch page if you want to confirm what the 48-hour website service includes before submitting.",
            },
            {
              href: "/pricing",
              label: "Pricing",
              title: "Want to compare package options first?",
              description:
                "Review pricing before you contact us if you want to submit with clearer scope and budget context.",
            },
          ]}
        />

        <PricingSection
          tiers={pricingTiers}
          title="Pick the package before you submit"
          description="This keeps the enquiry clear and speeds up the reply."
          pageType="contact_pricing"
        />
        <FinalCTASection title="Need a faster path than email?" pageType="contact_final_cta" />
      </main>
    </>
  );
}
