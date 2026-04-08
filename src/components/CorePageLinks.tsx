import Link from "next/link";
import GeneratedSectionBackground from "@/components/GeneratedSectionBackground";

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
    <section className="relative overflow-hidden border-b border-white/10 bg-[#050806] py-14">
      <GeneratedSectionBackground variant="links" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">{eyebrow}</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">{description}</p>
        </div>

        <div className="mt-8 grid gap-4 md:auto-rows-fr md:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-emerald-300/40"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
              <div className="relative z-10 flex h-full flex-1 flex-col">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/85">
                  {link.label}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-white transition group-hover:text-emerald-100">
                  {link.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-white/72">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
