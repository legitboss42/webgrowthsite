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
    <section id="inclusions" className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            What you get
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] text-slate-950 md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{description}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item, index) => (
            <article
              key={item.title}
              className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                  Included
                </span>
              </div>

              <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-slate-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
