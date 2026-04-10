import FAQAccordion from "@/components/FAQAccordion";

type FAQBlockProps = {
  items: Array<{ question: string; answer: string }>;
  title?: string;
  description?: string;
};

export default function FAQBlock({
  items,
  title = "Frequently Asked Questions",
  description = "Short answers before you commit budget and scope.",
}: FAQBlockProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85">FAQ</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-white/72">{description}</p>
      <div className="mt-5">
        <FAQAccordion items={items} />
      </div>
    </section>
  );
}
