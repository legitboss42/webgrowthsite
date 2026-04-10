type TroubleshootingItem = {
  issue: string;
  fix: string;
};

type TroubleshootingSectionProps = {
  items: TroubleshootingItem[];
  title?: string;
};

export default function TroubleshootingSection({
  items,
  title = "Troubleshooting",
}: TroubleshootingSectionProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article
            key={item.issue}
            className="rounded-xl border border-white/10 bg-black/30 p-4"
          >
            <p className="font-semibold text-white">{item.issue}</p>
            <p className="mt-2 text-sm leading-7 text-white/74">{item.fix}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
