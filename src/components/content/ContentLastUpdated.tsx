type ContentLastUpdatedProps = {
  publishedAt: string;
  updatedAt?: string;
  lastReviewedAt?: string;
};

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ContentLastUpdated({
  publishedAt,
  updatedAt,
  lastReviewedAt,
}: ContentLastUpdatedProps) {
  const published = formatDate(publishedAt);
  const updated = formatDate(updatedAt);
  const reviewed = formatDate(lastReviewedAt);

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85">Article History</p>
      <div className="mt-3 grid gap-2 text-sm text-white/72 sm:grid-cols-3">
        <p>Published: <span className="text-white">{published || "N/A"}</span></p>
        <p>Updated: <span className="text-white">{updated || "Not updated yet"}</span></p>
        <p>Reviewed: <span className="text-white">{reviewed || "Not reviewed yet"}</span></p>
      </div>
    </section>
  );
}
