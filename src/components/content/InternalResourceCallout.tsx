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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-700">Internal Resource</p>
      <h3 className="mt-3 text-xl font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
      >
        {label}
      </Link>
    </section>
  );
}
