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
    <section className="border-b border-white/10 bg-[#060907] py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
            {description}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:auto-rows-fr md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.title}
              className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
              <div className="relative z-10 flex h-full flex-1 flex-col">
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/74">
                  {item.answer}
                </p>
                {item.href && item.hrefLabel ? (
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex text-sm font-semibold text-emerald-200 transition hover:text-emerald-100 md:mt-auto"
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
