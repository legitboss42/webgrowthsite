type WhatYouNeedProps = {
  items: string[];
  title?: string;
};

export default function WhatYouNeed({
  items,
  title = "What You Will Need",
}: WhatYouNeedProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85">{title}</p>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-white/76">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-[10px] h-2 w-2 rounded-full bg-emerald-400/80" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
