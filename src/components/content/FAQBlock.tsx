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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-700">FAQ</p>
      <h3 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      <div className="mt-5">
        <FAQAccordion items={items} />
      </div>
    </section>
  );
}
