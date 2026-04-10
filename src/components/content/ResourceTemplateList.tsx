import Link from "next/link";

type TemplateItem = {
  title: string;
  description: string;
  href: string;
};

type ResourceTemplateListProps = {
  title?: string;
  templates: TemplateItem[];
};

export default function ResourceTemplateList({
  title = "Templates",
  templates,
}: ResourceTemplateListProps) {
  if (!templates.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <div className="mt-4 grid gap-3">
        {templates.map((template) => (
          <Link
            key={template.href}
            href={template.href}
            className="rounded-xl border border-white/10 bg-black/30 p-4 transition hover:border-emerald-400/30"
          >
            <p className="font-semibold text-white">{template.title}</p>
            <p className="mt-1 text-sm text-white/72">{template.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
