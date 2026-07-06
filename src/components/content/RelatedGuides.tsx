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
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9ff_100%)] px-6 py-6 md:px-8">
        <p className="text-xs uppercase tracking-[0.18em] text-blue-700">{title}</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
          Keep building context, not just page views
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
          These Academy guides expand the same implementation path so readers can move from
          strategy to action without losing momentum.
        </p>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/blog/${guide.slug}`}
            className="group rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(79,107,255,0.10)]"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.15em] text-blue-700">
                {guide.topic || "Guide"}
              </p>
              {guide.readTime ? <p className="text-xs text-slate-500">{guide.readTime}</p> : null}
            </div>
            <h3 className="mt-3 text-lg font-semibold leading-7 text-slate-950 group-hover:text-blue-800">
              {guide.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{guide.excerpt}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
              Read guide
              <span aria-hidden="true" className="transition group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
