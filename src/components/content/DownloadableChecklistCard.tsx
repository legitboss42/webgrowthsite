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
    <section className="rounded-3xl border border-purple-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,243,255,0.98))] p-6 shadow-[0_18px_40px_rgba(139,92,246,0.08)]">
      <p className="text-xs uppercase tracking-[0.18em] text-purple-700">Downloadable Checklist</p>
      <h3 className="mt-3 text-xl font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2563eb,#8b5cf6)] px-5 py-2 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(79,70,229,0.28)] transition hover:shadow-[0_18px_34px_rgba(79,70,229,0.34)]"
      >
        Download Checklist
      </Link>
    </section>
  );
}
