"use client";

import Link from "next/link";
import { BOOKING_URL, buildWhatsAppUrl } from "@/lib/site";

const launchHref = "/contact";
const whatsappHref = buildWhatsAppUrl(
  "Hello, I want to ask about website design in 48 hours."
);

export default function BlogInlineCTA({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-emerald-400/20 bg-emerald-500/10",
        compact ? "p-5" : "p-6",
      ].join(" ")}
    >
      <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">Launch offer</div>
      <h3 className={compact ? "mt-2 text-lg font-semibold text-white" : "mt-2 text-2xl font-semibold text-white"}>
        Need website design in 48 hours?
      </h3>
      <p className="mt-3 text-sm leading-6 text-white/75">
        If you need a professional website live fast for Nigeria-based or international clients, the launch offer is built for that exact use case.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={launchHref}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          Contact Us
        </Link>
        <a
          href={BOOKING_URL}
          target={BOOKING_URL.startsWith("http") ? "_blank" : undefined}
          rel={BOOKING_URL.startsWith("http") ? "noreferrer" : undefined}
          className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-black/30 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
        >
          Book a Call
        </a>
      </div>
      <div className="mt-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
        >
          Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
