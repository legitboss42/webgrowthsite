import Link from "next/link";

type InternalResourceCalloutProps = {
  title: string;
  description: string;
  href: string;
  label?: string;
};

export default function InternalResourceCallout({
  title,
  description,
  href,
  label = "Read Resource",
}: InternalResourceCalloutProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85">Internal Resource</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/74">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-black/40 px-5 py-2 text-sm font-semibold text-white/90 transition hover:border-white/35 hover:text-white"
      >
        {label}
      </Link>
    </section>
  );
}
