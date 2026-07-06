type ServiceDeliverablesProps = {
  items: string[];
};

export default function ServiceDeliverables({ items }: ServiceDeliverablesProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-700">What You Actually Receive</p>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-600"
          >
            <span className="mt-[11px] h-2 w-2 rounded-full bg-blue-500/80" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
