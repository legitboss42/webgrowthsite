import TrackedLink from "@/components/analytics/TrackedLink";

export default function HostingSupportBlock({
  title = "Need reliable hosting before you launch?",
  description = "Compare the shared hosting offer, save 68%, and start your business website with a stronger foundation.",
  ctaLabel = "View Hosting Offer",
  compact = false,
  pageType = "hosting_support_block",
}: {
  title?: string;
  description?: string;
  ctaLabel?: string;
  compact?: boolean;
  pageType?: string;
}) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-3xl border border-emerald-400/24 bg-[radial-gradient(circle_at_14%_-20%,rgba(16,185,129,0.2),rgba(4,16,13,0.9)_45%,rgba(2,8,7,0.98)_100%)] shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
        compact ? "p-6" : "p-8 md:p-10",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
      <div className="relative z-10">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/85">
          Hosting Support
        </p>
        <h2 className="mt-4 text-balance text-2xl font-semibold leading-tight md:text-4xl">
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/72 md:text-lg">
          {description}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <TrackedLink
            href="/hosting-offer"
            className="offer-button inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
            ctaName="hosting_offer"
            ctaLocation={`${pageType}_primary`}
            destination="/hosting-offer"
            pageType={pageType}
            offerType="hosting"
          >
            <span className="relative z-10">{ctaLabel}</span>
          </TrackedLink>
          <TrackedLink
            href="/launch"
            className="offer-button-soft inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
            ctaName="start_your_website"
            ctaLocation={`${pageType}_secondary`}
            destination="/launch"
            pageType={pageType}
            offerType="website_launch"
          >
            Start Your Website
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
