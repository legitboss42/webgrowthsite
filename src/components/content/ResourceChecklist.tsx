type ResourceChecklistProps = {
  title: string;
  items: string[];
};

export default function ResourceChecklist({ title, items }: ResourceChecklistProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
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
