type FAQItem = {
  question: string;
  answer: string;
};

export default function FAQSection({
  items,
  title = "Questions before you launch",
  description = "Short answers so you can decide fast without guessing what is included.",
}: {
  items: readonly FAQItem[];
  title?: string;
  description?: string;
}) {
  return (
    <section className="bg-[#f7f8fc] py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">FAQ</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] text-slate-950 md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{description}</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.question}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
            >
              <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
