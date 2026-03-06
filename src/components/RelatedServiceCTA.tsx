"use client";

import Link from "next/link";

export default function RelatedServiceCTA() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
      <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">Related service</div>
      <h3 className="mt-3 text-xl font-semibold text-white">
        Launch in 48 hours without dragging the project out
      </h3>
      <p className="mt-3 text-sm leading-6 text-white/72">
        The 48-hour launch offer is built for businesses that need a clean, mobile-first site live fast with pricing, CTA flow, and basic SEO already handled.
      </p>
      <Link
        href="/launch"
        className="mt-5 inline-flex items-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
      >
        View the website design in 48 hours offer
      </Link>
    </div>
  );
}
