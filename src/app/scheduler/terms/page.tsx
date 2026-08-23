import type { Metadata } from "next";
import Link from "next/link";
import {
  CURRENT_SCHEDULER_PRIVACY_VERSION,
  CURRENT_SCHEDULER_TERMS_VERSION,
} from "@/lib/scheduler/legalVersions";

export const metadata: Metadata = {
  title: "Scheduler Terms and Privacy Summary | Web Growth",
  description: "Read the content, authentication, retention, and privacy terms for the Web Growth TikTok scheduler.",
  alternates: { canonical: "https://webgrowth.info/scheduler/terms/" },
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: "Your content and permissions",
    body: "Only upload content you created or have the right to use. You remain responsible for captions, disclosures, rights, audience choices, and the content you submit through the scheduler. Do not use the service for unlawful, infringing, deceptive, harmful, or rights-violating content.",
  },
  {
    title: "TikTok-only authentication",
    body: "TikTok-only authentication means that TikTok Login Kit is the only sign-in method for this scheduler. Web Growth does not collect or store a TikTok password. A TikTok connection or any available publishing permission can be disconnected through the scheduler controls when offered to your account. For account controls or support, use the scheduler controls available to your account.",
  },
  {
    title: "Media retention",
    body: "Original media is retained for seven days after publication, cancellation, or terminal failure, then scheduled for deletion. Abandoned, unapproved uploads are scheduled for deletion after 24 hours. Limited operational records may remain without retaining the underlying media, tokens, or secrets unnecessarily.",
  },
  {
    title: "Availability and provider access",
    body: "The scheduler does not guarantee a particular publishing outcome, timing, visibility, or TikTok feature. Available options depend on the connected account, your selections, and TikTok's current requirements. Web Growth is not endorsed by TikTok or Google.",
  },
];

export default function SchedulerTermsPage() {
  return (
    <article className="mx-auto max-w-4xl px-5 py-14 sm:py-20" aria-labelledby="scheduler-terms-title">
      <header className="max-w-3xl border-b border-white/10 pb-10">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#62f5e6]">Scheduler agreement</p>
        <h1 id="scheduler-terms-title" className="mt-5 font-serif text-5xl leading-[.98] sm:text-6xl">Terms and privacy, in plain language.</h1>
        <p className="mt-6 text-base leading-8 text-white/70">
          These terms apply to the Web Growth TikTok scheduler in addition to the site-wide <Link className="text-white underline decoration-[#62f5e6]/60 underline-offset-4 hover:text-[#d6fffa]" href="/terms/">Terms of Service</Link> and <Link className="text-white underline decoration-[#62f5e6]/60 underline-offset-4 hover:text-[#d6fffa]" href="/privacy/">Privacy Policy</Link>.
        </p>
        <p className="mt-5 font-mono text-xs uppercase tracking-[.16em] text-white/45">
          Terms version {CURRENT_SCHEDULER_TERMS_VERSION} · Privacy version {CURRENT_SCHEDULER_PRIVACY_VERSION}
        </p>
      </header>

      <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
        {sections.map((section, index) => (
          <section key={section.title} className="grid gap-4 py-8 sm:grid-cols-[7rem_1fr] sm:gap-8">
            <p className="font-mono text-xs tracking-[.18em] text-[#ff8b9a]">0{index + 1}</p>
            <div>
              <h2 className="font-serif text-2xl">{section.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">{section.body}</p>
            </div>
          </section>
        ))}
      </div>

      <aside className="mt-10 rounded-2xl border border-[#62f5e6]/25 bg-[#62f5e6]/[0.05] p-6" aria-labelledby="before-you-upload-title">
        <h2 id="before-you-upload-title" className="font-serif text-2xl">Before you upload</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
          Check that you have the right to use every asset, understand the available TikTok settings, and are comfortable with the seven-day terminal-media retention period. The scheduler will ask for the required acknowledgements before you create or schedule a post.
        </p>
      </aside>
    </article>
  );
}
