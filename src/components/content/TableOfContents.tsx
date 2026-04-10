type TocItem = {
  id: string;
  text: string;
};

type TableOfContentsProps = {
  items: TocItem[];
};

export default function TableOfContents({ items }: TableOfContentsProps) {
  if (!items.length) return null;

  return (
    <aside className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85">Table of Contents</p>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="text-sm text-white/72 transition hover:text-white">
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
