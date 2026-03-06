type PricingTier = {
  name: string;
  price: string;
  summary: string;
  details: readonly string[];
  startNowHref: string;
};

const sectionPillars = [
  "Launch-first scope",
  "USD pricing",
  "Clear deliverables",
  "Expansion-ready structure",
];

export default function PricingSection({
  tiers,
  title = "Launch package - starting at $150",
  description = "Clear pricing in USD for Nigeria-based and international clients who want a fast, focused launch.",
}: {
  tiers: readonly PricingTier[];
  title?: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_26%)]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            Simple pricing
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
            {description}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/68">
          {sectionPillars.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-black/25 px-4 py-2"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {tiers.map((tier, index) => (
            <article
              key={tier.name}
              className={[
                "relative flex h-full flex-col overflow-hidden rounded-3xl border p-7 shadow-[0_18px_44px_rgba(0,0,0,0.22)]",
                index === 0
                  ? "border-emerald-500/45 bg-[linear-gradient(180deg,rgba(16,185,129,0.24),rgba(16,185,129,0.08))]"
                  : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))]",
              ].join(" ")}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.01em]">
                    {tier.name}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">
                    {tier.summary}
                  </p>
                </div>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    index === 0
                      ? "border border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
                      : "border border-white/10 bg-black/35 text-white/78",
                  ].join(" ")}
                >
                  {index === 0 ? "Fastest path" : "SEO-ready"}
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-white/55">
                  Package total
                </p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <p className="text-4xl font-semibold text-emerald-200">{tier.price}</p>
                  <p className="text-sm text-white/55">One-time build fee</p>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-white/76">
                {tier.details.map((detail) => (
                  <li key={detail} className="flex gap-3">
                    <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>

              <a
                href={tier.startNowHref}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(5,150,105,0.22)] transition-colors hover:bg-emerald-600"
              >
                Start Now
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
