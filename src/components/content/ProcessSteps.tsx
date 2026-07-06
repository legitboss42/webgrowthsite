type ProcessStepsProps = {
  items: string[];
};

export default function ProcessSteps({ items }: ProcessStepsProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-700">Process Steps</p>
      <ol className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li
            key={item}
            className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-600"
          >
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
