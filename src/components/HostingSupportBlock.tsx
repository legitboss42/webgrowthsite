import TrackedLink from "@/components/analytics/TrackedLink";

export default function HostingSupportBlock({
  title = "Need a clearer domain and hosting setup before the website goes live?",
  description = "Get practical guidance on the setup choices that affect performance, security, ownership, and long-term website stability.",
  ctaLabel = "Review pricing guidance",
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
        "relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f8f4_100%)] shadow-[0_18px_50px_rgba(15,23,42,0.08)]",
        compact ? "p-6" : "p-8 md:p-10",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(28,122,84,0.06)_0%,transparent_46%,rgba(180,128,47,0.05)_100%)]" />
      <div className="relative z-10">
        <p className="text-xs uppercase tracking-[0.18em] text-blue-700">
          Hosting Support
        </p>
        <h2 className="mt-4 text-balance text-2xl font-semibold leading-tight text-slate-950 md:text-4xl">
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
          {description}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <TrackedLink
            href="/pricing/"
            className="offer-button inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(18,74,56,0.22)] transition-colors hover:bg-blue-800"
            ctaName="pricing"
            ctaLocation={`${pageType}_primary`}
            destination="/pricing/"
            pageType={pageType}
            offerType="pricing"
          >
            <span className="relative z-10">{ctaLabel}</span>
          </TrackedLink>
          <TrackedLink
            href="/contact/"
            className="offer-button-soft inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-3 text-base font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700"
            ctaName="website_review"
            ctaLocation={`${pageType}_secondary`}
            destination="/contact/"
            pageType={pageType}
            offerType="website_review"
          >
            Request a Website Review
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
