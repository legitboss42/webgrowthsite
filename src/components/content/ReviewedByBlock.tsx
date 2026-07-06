import Link from "next/link";

type ReviewedByBlockProps = {
  reviewerName: string;
  reviewerRole?: string;
};

export default function ReviewedByBlock({
  reviewerName,
  reviewerRole = "Editorial reviewer",
}: ReviewedByBlockProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-700">Reviewed By</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{reviewerName}</p>
      <p className="text-sm text-slate-500">{reviewerRole}</p>
      <Link
        href="/editorial-policy/"
        className="mt-3 inline-flex text-xs font-medium text-blue-700 transition hover:text-blue-800"
      >
        Review standards
      </Link>
    </section>
  );
}
