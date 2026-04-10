import Link from "next/link";

type GuideItem = {
  slug: string;
  title: string;
  excerpt: string;
  topic?: string;
  readTime?: string;
};

type RelatedGuidesProps = {
  guides: GuideItem[];
  title?: string;
};

export default function RelatedGuides({
  guides,
  title = "Related Guides",
}: RelatedGuidesProps) {
  if (!guides.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85">{title}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/blog/${guide.slug}`}
            className="rounded-2xl border border-white/10 bg-black/35 p-5 transition hover:border-emerald-400/30"
          >
            <p className="text-xs uppercase tracking-[0.15em] text-emerald-200/85">
              {guide.topic || "Guide"}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">{guide.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/72">{guide.excerpt}</p>
            {guide.readTime ? <p className="mt-3 text-xs text-white/55">{guide.readTime}</p> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
