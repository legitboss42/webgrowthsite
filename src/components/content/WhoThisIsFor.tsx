type WhoThisIsForProps = {
  items: string[];
};

export default function WhoThisIsFor({ items }: WhoThisIsForProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">Who This Is For</p>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-white/78">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-[11px] h-2 w-2 rounded-full bg-emerald-400/85" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
