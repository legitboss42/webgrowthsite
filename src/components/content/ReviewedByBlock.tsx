type ReviewedByBlockProps = {
  reviewerName: string;
  reviewerRole?: string;
};

export default function ReviewedByBlock({
  reviewerName,
  reviewerRole = "Editorial reviewer",
}: ReviewedByBlockProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">Reviewed By</p>
      <p className="mt-2 text-base font-semibold text-white">{reviewerName}</p>
      <p className="text-sm text-white/66">{reviewerRole}</p>
    </section>
  );
}
