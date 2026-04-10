type WhoThisIsNotForProps = {
  items: string[];
};

export default function WhoThisIsNotFor({ items }: WhoThisIsNotForProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-white/15 bg-black/35 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-white/70">Who This Is Not For</p>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-white/74">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-[11px] h-2 w-2 rounded-full bg-white/55" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
