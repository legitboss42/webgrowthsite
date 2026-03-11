import { Suspense } from "react";
import ContactClient from "@/components/ContactClient";
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
  "Contact Web Growth to start a fast website launch for your business in Nigeria or remotely, with direct WhatsApp access, email, and a simple lead form.";

export const metadata = buildPageMetadata({
  title: "Contact Web Growth",
  description: pageDescription,
  path: "/contact",
  keywords: [
    "contact web designer nigeria",
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
                  If you want a professional site live fast for Nigeria-based or international customers, send the basics and get a direct response.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#contact-form"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                  >
                    Get Started
                  </a>
                  <a
                    href={BOOKING_URL}
                    target={BOOKING_URL.startsWith("http") ? "_blank" : undefined}
                    rel={BOOKING_URL.startsWith("http") ? "noreferrer" : undefined}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                  >
                    Book a Call
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      "Hello, I want to discuss my website project."
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                  >
                    Chat on WhatsApp
                  </a>
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

        <PricingSection
          tiers={pricingTiers}
          title="Pick the package before you submit"
          description="This keeps the enquiry clear and speeds up the reply."
        />
        <FinalCTASection title="Need a faster path than email?" />
      </main>
    </>
  );
}
