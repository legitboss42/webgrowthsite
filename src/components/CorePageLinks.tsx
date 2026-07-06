import Link from "next/link";

type LinkItem = {
  href: string;
  title: string;
  description: string;
  label: string;
};

export default function CorePageLinks({
  eyebrow = "Explore next",
  title,
  description,
  links,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  links: readonly LinkItem[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#f7f8fc] py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(59,130,246,0.06),transparent_32%),radial-gradient(circle_at_82%_72%,rgba(139,92,246,0.08),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] text-slate-950 md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-slate-600">{description}</p>
        </div>

        <div className="mt-8 grid gap-4 md:auto-rows-fr md:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.03),transparent_44%,rgba(139,92,246,0.05)_100%)]" />
              <div className="relative z-10 flex h-full flex-1 flex-col">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-700">
                  {link.label}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-slate-950 transition group-hover:text-blue-800">
                  {link.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
