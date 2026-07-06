import { finalCtaLinks } from "@/lib/launchOffer";
import TrackedLink from "@/components/analytics/TrackedLink";

export default function FinalCTASection({
  title = "Website Design in 48 Hours | Get a Professional Website Live Fast",
  description = "Ready to launch? Send your details and move from idea to live website without dragging the project out for weeks.",
  pageType = "final_cta_section",
}: {
  title?: string;
  description?: string;
  pageType?: string;
}) {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#eff4ff_0%,#ffffff_42%,#f4efff_100%)] p-8 shadow-[0_24px_60px_rgba(15,23,42,0.10)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                Next step
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] text-slate-950 md:text-5xl">
                {title}
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{description}</p>

              <div className="mt-6 flex flex-wrap gap-2 text-sm text-slate-500">
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Fast delivery</span>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2">USD pricing</span>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Nigeria + remote clients</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <TrackedLink
                href={finalCtaLinks.primaryHref}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4f6bff_0%,#7c5cff_100%)] px-8 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(79,107,255,0.24)] transition hover:-translate-y-0.5 hover:brightness-105"
                ctaName="start_your_website"
                ctaLocation={`${pageType}_primary`}
                destination={finalCtaLinks.primaryHref}
                pageType={pageType}
                offerType="website_launch"
              >
                Start Your Website
              </TrackedLink>

              <TrackedLink
                href={finalCtaLinks.bookingHref}
                target={finalCtaLinks.bookingHref.startsWith("http") ? "_blank" : undefined}
                rel={finalCtaLinks.bookingHref.startsWith("http") ? "noreferrer" : undefined}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
                ctaName="booking"
                ctaLocation={`${pageType}_booking`}
                destination="booking"
                pageType={pageType}
                offerType="consultation"
              >
                Book a Call
              </TrackedLink>

              <TrackedLink
                href={finalCtaLinks.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                ctaName="whatsapp"
                ctaLocation={`${pageType}_whatsapp`}
                destination="whatsapp"
                pageType={pageType}
                offerType="consultation"
              >
                Chat on WhatsApp
              </TrackedLink>
            </div>
          </div>

          <div className="mt-7 border-t border-slate-200 pt-5 text-sm text-slate-500">
            <span>Email: </span>
            <a href={finalCtaLinks.emailHref} className="font-medium text-blue-700 hover:text-blue-800">
              {finalCtaLinks.emailLabel}
            </a>
            <span className="mx-2 text-slate-300">|</span>
            <span>WhatsApp: </span>
            <a
              href={finalCtaLinks.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-700 hover:text-blue-800"
            >
              {finalCtaLinks.whatsappLabel}
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
