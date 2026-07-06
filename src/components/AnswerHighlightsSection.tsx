import Link from "next/link";

type AnswerItem = {
  title: string;
  answer: string;
  href?: string;
  hrefLabel?: string;
};

export default function AnswerHighlightsSection({
  eyebrow = "Quick answers",
  title,
  description,
  items,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  items: readonly AnswerItem[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#f4f7ff] py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(59,130,246,0.08),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.08),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] text-slate-950 md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-slate-600">
            {description}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:auto-rows-fr md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.title}
              className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.03),transparent_44%,rgba(139,92,246,0.05)_100%)]" />
              <div className="relative z-10 flex h-full flex-1 flex-col">
                <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.answer}
                </p>
                {item.href && item.hrefLabel ? (
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex text-sm font-semibold text-blue-700 transition hover:text-blue-800 md:mt-auto"
                  >
                    {item.hrefLabel}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
