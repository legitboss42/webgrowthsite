type BeforeAfterResultsProps = {
  items: Array<{ before: string; after: string }>;
};

export default function BeforeAfterResults({ items }: BeforeAfterResultsProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85">Before / After Results</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((item, index) => (
          <article key={`${item.before}-${index}`} className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-white/60">Before</p>
            <p className="mt-2 text-sm leading-7 text-white/74">{item.before}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-emerald-200/85">After</p>
            <p className="mt-2 text-sm leading-7 text-white/84">{item.after}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
