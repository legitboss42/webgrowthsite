type GlossaryItem = {
  term: string;
  definition: string;
};

type GlossaryBlockProps = {
  items: GlossaryItem[];
  title?: string;
};

export default function GlossaryBlock({
  items,
  title = "Glossary",
}: GlossaryBlockProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <dl className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.term}>
            <dt className="font-semibold text-white">{item.term}</dt>
            <dd className="mt-1 text-sm leading-7 text-white/74">{item.definition}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
