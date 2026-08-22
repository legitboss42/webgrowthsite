type WhoThisIsForProps = {
  items: string[];
};

export default function WhoThisIsFor({ items }: WhoThisIsForProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50/70 p-6 shadow-[0_18px_40px_rgba(18,74,56,0.08)]">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-700">Who This Is For</p>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-[11px] h-2 w-2 rounded-full bg-blue-500/85" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
