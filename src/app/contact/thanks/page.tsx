"use client";

import { useEffect } from "react";

export default function ContactThanksPage() {
  useEffect(() => {
    // Meta Pixel Lead event
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Lead");
    }

    // Google Tag Manager / GA4 Lead event
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "lead",
        source: "contact_form",
      });
    }
  }, []);

  return (
    <div className="bg-black text-white py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl md:text-5xl font-semibold">
          Request received ✅
        </h1>

        <p className="mt-4 text-white/70 text-lg">
          Thanks for reaching out. We’ve received your message and we’ll reply
          shortly.
        </p>

        <div className="mt-10 space-y-3 rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-white/80">While you wait:</p>
          <ul className="list-disc pl-6 text-white/70 space-y-2">
            <li>Check your email - we may ask 1–2 quick questions.</li>
            <li>If it’s urgent, message us on WhatsApp.</li>
            <li>Review our services to confirm what you want.</li>
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href="/services"
            className="inline-flex items-center justify-center rounded-md bg-white/10 px-6 py-4 text-sm font-semibold text-white hover:bg-white/15 transition"
          >
            View Services
          </a>

          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-6 py-4 text-sm font-semibold text-white hover:bg-emerald-500 transition"
          >
            Back Home
          </a>
        </div>
      </div>
    </div>
  );
}


