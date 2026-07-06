type BeforeAfterResultsProps = {
  items: Array<{ before: string; after: string }>;
};

export default function BeforeAfterResults({ items }: BeforeAfterResultsProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-700">Before / After Pattern</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((item, index) => (
          <article
            key={`${item.before}-${index}`}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Before</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{item.before}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-blue-700">After</p>
            <p className="mt-2 text-sm leading-7 text-slate-900">{item.after}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
