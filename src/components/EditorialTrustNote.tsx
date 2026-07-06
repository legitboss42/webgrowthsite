import Link from "next/link";

type EditorialTrustNoteProps = {
  compact?: boolean;
};

export default function EditorialTrustNote({
  compact = false,
}: EditorialTrustNoteProps) {
  return (
    <div
      className={[
        "rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]",
        compact ? "p-5" : "p-6",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-blue-700">
        <span>Editorial Standard</span>
        <span className="h-1 w-1 rounded-full bg-blue-300" />
        <span>Web Growth</span>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Our articles are written and reviewed in-house using real website launch,
        redesign, technical SEO, and conversion work. We update posts when our
        process changes, and we keep the advice aligned with what we actually
        implement for businesses in Nigeria and remote international markets.
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
        <Link
          href="/about"
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 transition hover:border-blue-200 hover:text-blue-700"
        >
          About Web Growth
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 transition hover:border-blue-200 hover:text-blue-700"
        >
          Contact
        </Link>
        <Link
          href="/services"
          className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
        >
          View Services
        </Link>
      </div>
    </div>
  );
}
