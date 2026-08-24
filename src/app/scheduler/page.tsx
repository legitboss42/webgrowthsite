import type { Metadata } from "next";
import Link from "next/link";
import { getAccountDeletionRequestNotice } from "@/lib/scheduler/accountActionPresentation";
import { getSchedulerLaunchState } from "@/lib/scheduler/launch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TikTok Scheduler for Original Content | Web Growth",
  description:
    "Learn how Web Growth's creator scheduler handles TikTok sign-in, content responsibility, approval, and rollout access.",
  alternates: { canonical: "https://webgrowth.info/scheduler/" },
  robots: { index: true, follow: true },
};

const steps = [
  {
    number: "01",
    title: "Connect your TikTok account",
    detail: "Use TikTok Login Kit. Web Growth does not offer a separate email-and-password account for this scheduler.",
  },
  {
    number: "02",
    title: "Review the post you control",
    detail: "You provide the original or authorised content, select the available options, and remain responsible for what you submit.",
  },
  {
    number: "03",
    title: "Schedule with a clear record",
    detail: "The scheduler records the approved request and reports its status; delivery remains subject to the access and settings available at that time.",
  },
];

type SchedulerLandingProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SchedulerLanding({ searchParams }: SchedulerLandingProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const accountNotice = getAccountDeletionRequestNotice(resolvedSearchParams["account-deletion"]);
  const launch = getSchedulerLaunchState();
  const publicPostingNote = launch.publicPosting
    ? "Public visibility options are shown only when the current provider access and your account settings allow them."
    : "Public posting is not available through this scheduler at this time.";

  return (
    <section className="relative isolate overflow-hidden px-5 py-14 sm:py-20" aria-labelledby="scheduler-title">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_10%,rgba(98,245,230,.12),transparent_25%),radial-gradient(circle_at_88%_25%,rgba(255,82,105,.1),transparent_28%)]"
      />
      {accountNotice ? (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="mx-auto mb-8 max-w-7xl border-l-2 border-[#62f5e6] bg-[#62f5e6]/[0.07] px-5 py-4"
        >
          <p className="font-bold text-[#d6fffa]">{accountNotice.title}</p>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-white/70">{accountNotice.detail}</p>
        </div>
      ) : null}
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)] lg:items-end">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.26em] text-[#62f5e6]">Creator publishing utility</p>
          <h1 id="scheduler-title" className="mt-5 font-serif text-5xl leading-[.98] sm:text-6xl lg:text-7xl">
            A deliberate route from original content to a scheduled TikTok request.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
            Web Growth helps creators prepare original video or photo content, review the available choices, and keep a clear record of a scheduled request. It is not endorsed by TikTok or Google.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            {launch.publicEnrollment ? (
              <Link
                href="/scheduler/sign-in/"
                className="inline-flex items-center rounded-full bg-[#62f5e6] px-6 py-3 font-bold text-[#071111] transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#62f5e6]"
              >
                Continue with TikTok
              </Link>
            ) : (
              <Link
                href="/scheduler/terms/"
                className="inline-flex items-center rounded-full border border-[#62f5e6]/60 px-6 py-3 font-bold text-[#d6fffa] transition-colors hover:border-[#62f5e6] hover:bg-[#62f5e6]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#62f5e6]"
              >
                TikTok access opening after approval
              </Link>
            )}
            <a
              href="#how-it-works"
              className="rounded-full px-5 py-3 text-sm font-medium text-white/75 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#62f5e6]"
            >
              How it works
            </a>
          </div>
        </div>

        <aside className="border-l border-white/15 py-1 pl-6 sm:pl-8" aria-label="Current scheduler access status">
          <p className="font-mono text-[0.68rem] uppercase tracking-[.2em] text-[#ff8b9a]">Current access status</p>
          <p className="mt-4 font-serif text-3xl leading-tight">
            {launch.publicEnrollment ? "Creator enrollment is open." : "Creator enrollment is pending approval."}
          </p>
          <dl className="mt-7 space-y-5 text-sm leading-6">
            <div>
              <dt className="font-medium text-white">Sign-in</dt>
              <dd className="mt-1 text-white/60">TikTok-only authentication; no email or password account is created here.</dd>
            </div>
            <div>
              <dt className="font-medium text-white">Posting visibility</dt>
              <dd className="mt-1 text-white/60">{publicPostingNote}</dd>
            </div>
            <div>
              <dt className="font-medium text-white">Media retention</dt>
              <dd className="mt-1 text-white/60">Original media is removed seven days after publication, cancellation, or terminal failure.</dd>
            </div>
          </dl>
        </aside>
      </div>

      <section id="how-it-works" className="mx-auto mt-20 max-w-7xl border-t border-white/10 pt-8 sm:mt-24 sm:pt-10" aria-labelledby="how-it-works-title">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-[#62f5e6]">How it works</p>
          <h2 id="how-it-works-title" className="mt-3 font-serif text-3xl sm:text-4xl">Your choices remain visible in the flow.</h2>
        </div>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.number} className="bg-[#080b0c] p-6 sm:p-8">
              <span className="font-mono text-xs tracking-[.18em] text-[#ff8b9a]">{step.number}</span>
              <h3 className="mt-10 font-serif text-2xl">{step.title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/65">{step.detail}</p>
            </li>
          ))}
        </ol>
        <p className="mt-7 max-w-3xl text-sm leading-7 text-white/55">
          Access to TikTok features, including any publishing capability, depends on TikTok&apos;s current requirements and the connected account. Read the <Link className="text-white underline decoration-[#62f5e6]/60 underline-offset-4 hover:text-[#d6fffa]" href="/scheduler/terms/">Scheduler Terms and Privacy summary</Link> before you continue.
        </p>
      </section>
    </section>
  );
}
