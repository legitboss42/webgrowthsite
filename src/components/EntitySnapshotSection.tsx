import Link from "next/link";

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
    <section className="border-b border-white/10 bg-[#060907] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-lg leading-7 text-white/72">{description}</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.title}
              className="relative overflow-hidden rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/74">
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
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-black/35 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-black/50"
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
