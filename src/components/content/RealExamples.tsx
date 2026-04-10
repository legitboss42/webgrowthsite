type RealExamplesProps = {
  items: string[];
};

export default function RealExamples({ items }: RealExamplesProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85">Real Examples</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <article key={item} className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white/76">
            {item}
          </article>
        ))}
      </div>
    </section>
  );
}
