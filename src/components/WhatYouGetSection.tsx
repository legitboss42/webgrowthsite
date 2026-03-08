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
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            What you get
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">{description}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {items.map((item, index) => (
            <article
              key={item.title}
              className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-emerald-400/25 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.23),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.24)] transition-all hover:-translate-y-1 hover:border-emerald-300/45"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(16,185,129,0.08)_0%,transparent_45%,rgba(16,185,129,0.05)_100%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-15" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/75 to-transparent" />

              <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-md border border-white/20 bg-black/45 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-200/95">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
                    Included
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-semibold tracking-[-0.01em] text-white/96">
                  {item.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-white/80">{item.description}</p>

                <div className="mt-5 border-t border-white/15 pt-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/85">
                    Launch-ready
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
