import type { Metadata } from "next";
import Link from "next/link";
import ContactThanksTracking from "@/components/ContactThanksTracking";
import TrackedLink from "@/components/analytics/TrackedLink";
import { absoluteUrl, buildWhatsAppUrl } from "@/lib/site";

const whatsappHref = buildWhatsAppUrl(
  "Hello Web Growth, I would like a website review. Here is my website/business detail:"
);

export const metadata: Metadata = {
  title: "Thank You | Web Growth",
  description: "Your request has been received by Web Growth.",
  alternates: {
    canonical: absoluteUrl("/thank-you/"),
  },
  robots: {
    index: false,
    follow: true,
  },
};

const helpfulLinks = [
  { href: "/services/website-audit/", label: "Website Audit" },
  { href: "/services/website-redesign/", label: "Website Redesign" },
  { href: "/services/business-website-design/", label: "Business Website Design" },
  {
    href: "/blog/why-your-website-isnt-getting-leads/",
    label: "Why Your Website Is Not Getting Leads",
  },
  {
    href: "/blog/small-business-website-redesign-checklist/",
    label: "Small Business Website Redesign Checklist",
  },
  {
    href: "/blog/website-redesign-cost-breakdown-nigeria/",
    label: "Website Redesign Cost in Nigeria",
  },
] as const;

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-[#050806] px-6 py-24 text-white">
      <ContactThanksTracking />
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.28)] md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">
            Request received
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
            Thank You — Your Request Has Been Received
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
            We&apos;ll review your details and respond with the next step. If your
            request is urgent, you can also send your website link directly on WhatsApp.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              ctaName="whatsapp"
              ctaLocation="thank_you_primary"
              destination="whatsapp"
              pageType="thank_you"
              offerType="website_review"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Send Website Link on WhatsApp
            </TrackedLink>

            <Link
              href="/contact/"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-black/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-black/45"
            >
              Back to Contact
            </Link>
          </div>
        </div>

        <section className="mt-10 rounded-[28px] border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">
            While you wait
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-white">
            Helpful places to continue
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {helpfulLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-black/25 px-5 py-5 text-sm font-medium text-white/78 transition hover:border-emerald-400/35 hover:bg-black/35 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
