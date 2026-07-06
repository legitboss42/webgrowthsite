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
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-700">Article History</p>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
        <p>
          Published: <span className="font-medium text-slate-950">{published || "N/A"}</span>
        </p>
        <p>
          Updated: <span className="font-medium text-slate-950">{updated || "Not updated yet"}</span>
        </p>
        <p>
          Reviewed: <span className="font-medium text-slate-950">{reviewed || "Not reviewed yet"}</span>
        </p>
      </div>
    </section>
  );
}
