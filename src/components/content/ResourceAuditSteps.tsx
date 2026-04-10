type ResourceAuditStepsProps = {
  title?: string;
  steps: string[];
};

export default function ResourceAuditSteps({
  title = "Audit Steps",
  steps,
}: ResourceAuditStepsProps) {
  if (!steps.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white/76">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/45 text-xs text-emerald-200/95">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
