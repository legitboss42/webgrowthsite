type ProcessStepsProps = {
  items: string[];
};

export default function ProcessSteps({ items }: ProcessStepsProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85">Process Steps</p>
      <ol className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white/76">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/45 text-xs text-emerald-200/95">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
