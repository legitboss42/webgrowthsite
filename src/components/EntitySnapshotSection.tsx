import Link from "next/link";
import GeneratedSectionBackground from "@/components/GeneratedSectionBackground";

type SnapshotItem = {
  title: string;
  description: string;
};

type SnapshotLink = {
  href: string;
  label: string;
};

export default function EntitySnapshotSection({
  eyebrow = "Web Growth at a glance",
  title,
  description,
  items,
  links = [],
}: {
  eyebrow?: string;
  title: string;
  description: string;
  items: readonly SnapshotItem[];
  links?: readonly SnapshotLink[];
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f8f4_100%)] py-16 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <GeneratedSectionBackground variant="snapshot" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-700">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] text-slate-950 md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-lg leading-7 text-slate-600">{description}</p>
        </div>

        <div className="mt-10 grid gap-5 md:auto-rows-fr md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.title}
              className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(28,122,84,0.06)_0%,transparent_46%,rgba(180,128,47,0.05)_100%)]" />
              <div className="relative z-10 flex h-full flex-1 flex-col">
                <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        {links.length ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
