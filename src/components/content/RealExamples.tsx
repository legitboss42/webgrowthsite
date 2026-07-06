type RealExamplesProps = {
  items: string[];
};

export default function RealExamples({ items }: RealExamplesProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-700">Practical Use Cases</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <article
            key={item}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-600"
          >
            {item}
          </article>
        ))}
      </div>
    </section>
  );
}
