"use client";

import Link from "next/link";

export default function RelatedServiceCTA() {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
      <div className="text-xs uppercase tracking-[0.18em] text-blue-700">Related service</div>
      <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">
        Get a website review before you invest in the wrong fix.
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        If your site needs a clearer plan around structure, content, UX, SEO, or conversion flow, a website review is the best starting point.
      </p>
      <Link
        href="/services/website-audit/"
        className="mt-5 inline-flex items-center rounded-xl bg-[linear-gradient(135deg,#4f6bff_0%,#7c5cff_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(79,107,255,0.22)] transition hover:brightness-105"
      >
        Review the website audit service
      </Link>
    </div>
  );
}
