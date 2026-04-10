import Link from "next/link";

type DownloadableChecklistCardProps = {
  title: string;
  description: string;
  href: string;
};

export default function DownloadableChecklistCard({
  title,
  description,
  href,
}: DownloadableChecklistCardProps) {
  return (
    <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">Downloadable Checklist</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/78">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
      >
        Download Checklist
      </Link>
    </section>
  );
}
