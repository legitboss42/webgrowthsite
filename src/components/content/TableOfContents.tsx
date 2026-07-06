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
    <aside className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_24px_55px_rgba(15,23,42,0.07)]">
      <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,255,0.95),rgba(255,255,255,0.98))] px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">
          Table of Contents
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Jump through the article without losing the main thread.
        </p>
      </div>

      <ul className="space-y-2 px-4 py-4">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="group flex items-start gap-3 rounded-2xl px-3 py-3 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-200 transition group-hover:bg-blue-500" />
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
