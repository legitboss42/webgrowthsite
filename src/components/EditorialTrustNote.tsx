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
        "rounded-2xl border border-white/10 bg-white/5",
        compact ? "p-5" : "p-6",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-emerald-300/80">
        <span>Editorial Note</span>
        <span className="h-1 w-1 rounded-full bg-emerald-400/60" />
        <span>Web Growth</span>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72">
        Our articles are written and reviewed in-house using real website launch,
        redesign, technical SEO, and conversion work. We update posts when our
        process changes, and we keep the advice aligned with what we actually
        implement for businesses in Nigeria and remote international markets.
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/70">
        <Link
          href="/about"
          className="rounded-full border border-white/12 bg-black/25 px-3 py-1.5 transition hover:border-white/20 hover:text-white"
        >
          About Web Growth
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-white/12 bg-black/25 px-3 py-1.5 transition hover:border-white/20 hover:text-white"
        >
          Contact
        </Link>
        <Link
          href="/launch"
          className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-100 transition hover:border-emerald-300/35 hover:bg-emerald-500/15"
        >
          Website design in 48 hours
        </Link>
      </div>
    </div>
  );
}
