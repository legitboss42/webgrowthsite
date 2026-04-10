type ServiceDeliverablesProps = {
  items: string[];
};

export default function ServiceDeliverables({ items }: ServiceDeliverablesProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85">What You Actually Receive</p>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white/76">
            <span className="mt-[11px] h-2 w-2 rounded-full bg-emerald-400/80" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
