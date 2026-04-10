import Link from "next/link";
import CaseStudyCard from "@/components/CaseStudyCard";
import StructuredData from "@/components/StructuredData";
import TrackedLink from "@/components/analytics/TrackedLink";
import { portfolioCases } from "@/lib/portfolioCases";
import {
  buildFaqSchema,
  buildLocalBusinessServiceSchema,
  buildPageMetadata,
  buildProfessionalServiceSchema,
} from "@/lib/seo";
import { BOOKING_URL } from "@/lib/site";

const pageDescription =
  "Websites for local service businesses that need more calls, stronger local trust, better mobile speed, and pages built to turn local traffic into booked jobs.";

const painPoints = [
  "The site looks weak on mobile, which is where a lot of local searches happen.",
  "The page does not make the business feel trustworthy enough to call.",
  "Google traffic lands, but the site does not turn visits into calls or quote requests.",
  "The structure is too vague, too slow, or too generic to help local SEO do its job.",
] as const;

const outcomes = [
  "More calls from a cleaner, more obvious contact path",
  "Stronger local trust from a sharper first impression",
  "Pages that support local SEO instead of getting in the way",
  "A faster mobile experience for people searching on the move",
] as const;

const inclusions = [
  "A clear local-service homepage or landing page",
  "Prominent call, form, and WhatsApp actions",
  "Trust blocks built around service area, process, and proof",
  "Fast mobile layout and cleaner page structure",
  "Metadata and page basics that support local SEO",
] as const;

const process = [
  {
    title: "Clarify the offer",
    text: "We tighten the message so people immediately understand what you do, where you work, and why they should contact you.",
  },
  {
    title: "Build the page",
    text: "The site is designed around mobile trust, local search intent, and a cleaner path to calls or quote requests.",
  },
  {
    title: "Launch and refine",
    text: "Once the page is live, you can keep using it for search, ads, or direct outreach without the usual clutter and confusion.",
  },
] as const;

const faqs = [
  {
    question: "Who is this for?",
    answer:
      "Local service businesses like plumbers, roofers, electricians, contractors, and other businesses that rely on calls, enquiries, and booked jobs.",
  },
  {
    question: "Can this help local SEO too?",
    answer:
      "Yes. A stronger page structure, better mobile experience, and clearer trust signals all support local SEO better than a weak generic site.",
  },
  {
    question: "Do I need a huge website first?",
    answer:
      "No. A strong local-business site often starts with one or a few focused pages before you expand later.",
  },
  {
    question: "What matters most on these pages?",
    answer:
      "Clarity, trust, speed, and a simple next step. If those are weak, more traffic will not fix the problem.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Web Design for Local Service Businesses | Web Growth",
  description: pageDescription,
  path: "/local-business",
  keywords: [
    "local business website design",
    "contractor website design",
    "plumber website design",
    "roofer website design",
    "local service business web design",
  ],
  image: "/images/portfolio/tlc-interiors-desktop.jpg",
});

export default function LocalBusinessPage() {
  const featuredCases = portfolioCases
    .filter((item) => item.status !== "Proposal")
    .slice(0, 3);

  return (
    <>
      <StructuredData
        data={[
          buildProfessionalServiceSchema("/local-business", pageDescription),
          buildLocalBusinessServiceSchema(),
          buildFaqSchema(faqs),
        ]}
      />

      <main className="bg-[#050806] text-white">
        <section className="relative overflow-hidden border-b border-white/10 py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.2),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(16,185,129,0.1),transparent_28%)]" />
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/85">
                Local-business websites
              </p>
              <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-6xl">
                Websites for local businesses that need more calls and booked jobs
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
                If your business depends on local trust, mobile speed, and getting
                people to call, the website has to do more than sit there looking
                acceptable. It needs to help turn local traffic into action.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="/contact?service=Local Business Website"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white transition hover:bg-emerald-600"
                  ctaName="request_quote"
                  ctaLocation="local_business_hero_primary"
                  destination="/contact?service=Local Business Website"
                  pageType="local_business"
                  offerType="local_business"
                >
                  Get My Website Quote
                </TrackedLink>
                <TrackedLink
                  href={BOOKING_URL}
                  target={BOOKING_URL.startsWith("http") ? "_blank" : undefined}
                  rel={BOOKING_URL.startsWith("http") ? "noreferrer" : undefined}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition hover:border-white/40 hover:bg-black/50"
                  ctaName="booking"
                  ctaLocation="local_business_hero_secondary"
                  destination="booking"
                  pageType="local_business"
                  offerType="local_business"
                >
                  Book a Call
                </TrackedLink>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/70">
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                  Built for calls
                </span>
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                  Mobile-first
                </span>
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                  Local SEO support
                </span>
              </div>
              <p className="mt-4 text-sm text-white/64">
                Need a broader mixed-audience build? See{" "}
                <Link href="/website-build" className="text-emerald-200 hover:text-emerald-100">
                  website design and redesign services
                </Link>
                .
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-7 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-200/95">
                [ Why local pages fail ]
              </p>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-white/78">
                {painPoints.map((item, index) => (
                  <li key={item} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <span className="inline-flex rounded-md border border-white/20 bg-black/45 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-200/95">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-3">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#060907] py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-4 md:grid-cols-4">
              {outcomes.map((item) => (
                <article
                  key={item}
                  className="rounded-2xl border border-emerald-400/22 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.2),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_14px_30px_rgba(0,0,0,0.22)]"
                >
                  <p className="text-sm leading-7 text-white/80">{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-black py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                What&apos;s included
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
                What a strong local-business website should already have
              </h2>
              <p className="mt-4 text-lg leading-7 text-white/72">
                The basics need to be right before local SEO or paid traffic can do much for you.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {inclusions.map((item, index) => (
                <article
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/35 p-5 shadow-[0_14px_30px_rgba(0,0,0,0.2)]"
                >
                  <span className="inline-flex rounded-md border border-white/20 bg-black/45 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-200/95">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-4 text-sm leading-7 text-white/78">{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#060907] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Proof
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
                A few projects that show the level of work
              </h2>
              <p className="mt-4 text-lg leading-7 text-white/72">
                These are not all local-trades sites, but they show the same things that matter here: clarity, trust, and mobile presentation.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {featuredCases.map((item) => (
                <CaseStudyCard
                  key={item.title}
                  title={item.title}
                  client={item.client}
                  status={item.status}
                  summary={item.summary}
                  results={item.results}
                  imageUrl={item.imageUrl}
                  imageAlt={item.imageAlt}
                  href={item.liveUrl}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-black py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Process
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
                A simple process built around getting jobs, not just getting pages live
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {process.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-3xl border border-white/10 bg-black/40 p-7 shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
                >
                  <span className="inline-flex rounded-md border border-white/20 bg-black/45 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-200/95">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/72">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#060907] py-24">
          <div className="mx-auto max-w-4xl px-6">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
              FAQ
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
              Questions local businesses usually ask first
            </h2>

            <div className="mt-10 space-y-4">
              {faqs.map((item) => (
                <article
                  key={item.question}
                  className="rounded-2xl border border-white/10 bg-black/40 p-6"
                >
                  <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/72">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-3xl border border-emerald-500/35 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(8,12,10,0.96)_55%,rgba(0,0,0,0.9))] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                    Ready
                  </p>
                  <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
                    Need a local-business website that helps bring in more calls?
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                    If the current site is weak on mobile, hard to trust, or not helping turn local traffic into jobs, fix that first.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <TrackedLink
                    href="/contact?service=Local Business Website"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white transition hover:bg-emerald-600"
                    ctaName="request_quote"
                    ctaLocation="local_business_final_primary"
                    destination="/contact?service=Local Business Website"
                    pageType="local_business"
                    offerType="local_business"
                  >
                    Get My Website Quote
                  </TrackedLink>
                  <Link
                    href="/website-build"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition hover:border-white/40 hover:bg-black/50"
                  >
                    See Full Website Build Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
