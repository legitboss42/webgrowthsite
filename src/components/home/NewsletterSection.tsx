import Link from "next/link";
import { IconBadge, MailIcon } from "./HomeIcons";
import SectionShell from "./SectionShell";

export default function NewsletterSection() {
  return (
    <SectionShell tone="canvas" spacing="compact">
      <div className="border-t border-slate-200 pt-6">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="flex items-start gap-4">
            <IconBadge tone="purple" shape="circle" className="h-16 w-16 shrink-0">
              <MailIcon />
            </IconBadge>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Stay ahead
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Growth insights. Delivered weekly.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Actionable strategies on SEO, content, and monetization.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="email"
              placeholder="Enter your email address"
              aria-label="Email address"
              disabled
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-500 shadow-sm disabled:cursor-not-allowed disabled:opacity-100"
            />
            <button
              type="button"
              disabled
              className="min-h-12 rounded-xl bg-[linear-gradient(135deg,#3557ff_0%,#4f6bff_45%,#7c5cff_100%)] px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,107,255,0.22)] disabled:cursor-not-allowed disabled:opacity-100"
            >
              Subscribe
            </button>
            <p className="text-xs leading-6 text-slate-500 sm:col-span-2">
              Signup UI is shown as part of the rebuild direction. The live submission
              flow will only be enabled when the backend and onboarding sequence are
              ready.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Link
            href="/blog/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            Explore the Academy
          </Link>
          <Link
            href="/contact/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            Request a Website Review
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}
