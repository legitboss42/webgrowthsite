type Item = {
  title: string;
  description: string;
};

export default function WhatYouGetSection({
  items,
  title = "Everything required for a fast, credible launch",
  description = "Built for direct outreach traffic with clear messaging, clean conversion flow, and technical setup handled from day one.",
}: {
  items: readonly Item[];
  title?: string;
  description?: string;
}) {
  return (
    <section
      id="inclusions"
      className="relative overflow-hidden border-b border-white/10 bg-[#060907] py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_35%,rgba(16,185,129,0.13),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(16,185,129,0.08),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.48))]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">What you get</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">{description}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {items.map((item, index) => (
            <article
              key={item.title}
              className="rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:border-emerald-500/35"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-300/80">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.01em]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/72">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
