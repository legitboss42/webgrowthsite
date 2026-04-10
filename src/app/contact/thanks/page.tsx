import type { Metadata } from "next";
import Link from "next/link";
import ContactThanksTracking from "@/components/ContactThanksTracking";

export const metadata: Metadata = {
  title: "Request Received",
  description: "Confirmation page for submitted website project enquiries.",
  robots: { index: false, follow: false },
};

export default function ContactThanksPage() {
  return (
    <div className="bg-black py-24 text-white">
      <ContactThanksTracking />
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl font-semibold md:text-5xl">Request received</h1>

        <p className="mt-4 text-lg text-white/70">
          Thanks for reaching out. We have received your message and will reply shortly.
        </p>

        <div className="mt-10 space-y-3 rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-white/80">While you wait:</p>
          <ul className="list-disc space-y-2 pl-6 text-white/70">
            <li>Check your email. We may ask one or two quick questions.</li>
            <li>If it is urgent, message us on WhatsApp.</li>
            <li>Review our services to confirm your preferred scope.</li>
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/services"
            className="inline-flex items-center justify-center rounded-md bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            View Services
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}

