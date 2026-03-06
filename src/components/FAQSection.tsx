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
    <section className="border-b border-white/10 bg-[#050806] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">FAQ</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">{description}</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.question}
              className="rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
            >
              <h3 className="text-lg font-semibold tracking-[-0.01em]">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-white/72">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
