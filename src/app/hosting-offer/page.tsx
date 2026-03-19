import Link from "next/link";
import FAQSection from "@/components/FAQSection";
import HostingSupportBlock from "@/components/HostingSupportBlock";
import StructuredData from "@/components/StructuredData";
import {
  buildFaqSchema,
  buildHostingOfferSchema,
  buildPageMetadata,
} from "@/lib/seo";

const HOSTING_LINK = "https://namecheap.pxf.io/c/6943664/3793820/5618";

const pageDescription =
  "Save 68% on shared web hosting and get reliable hosting for your business website before you launch.";

const benefits = [
  {
    title: "Keeps your site online",
    description:
      "Reliable web hosting helps your website stay available when customers visit, click, or try to contact you.",
  },
  {
    title: "Improves speed",
    description:
      "Good website hosting supports faster page loads, which helps with user experience, trust, and conversion.",
  },
  {
    title: "Supports growth",
    description:
      "The right hosting plan gives you room to grow traffic, add pages, and expand your business website later.",
  },
  {
    title: "Protects your setup",
    description:
      "A solid hosting provider makes it easier to manage security, uptime, backups, and future website changes.",
  },
];

const fitCards = [
  {
    title: "Get your business online faster",
    description:
      "Start with hosting that lets you move from idea to live website without wasting time on the wrong setup.",
  },
  {
    title: "Look more professional instantly",
    description:
      "Reliable hosting gives your website a stronger foundation, which helps your business feel more serious from day one.",
  },
  {
    title: "Create a stronger first impression",
    description:
      "A smoother, faster website experience helps visitors trust you sooner and stay on the page longer.",
  },
  {
    title: "Build on reliable hosting from the start",
    description:
      "Starting with dependable hosting reduces avoidable launch problems and gives you a cleaner path to grow later.",
  },
];

const selectionCards = [
  {
    title: "Prioritize uptime",
    description:
      "Choose business web hosting that is known for stability so your site is available when customers need it.",
  },
  {
    title: "Check speed support",
    description:
      "Fast hosting matters if you want your website to feel responsive and load well on mobile devices.",
  },
  {
    title: "Look for simple management",
    description:
      "Good hosting should make setup, SSL, backups, and domain connection easier, not harder.",
  },
  {
    title: "Pick room to scale",
    description:
      "Your hosting should still work as your website grows, adds content, or starts getting more traffic.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Choose the right hosting deal",
    description:
      "Pick a plan that helps you launch properly instead of settling for the weakest option available.",
  },
  {
    step: "02",
    title: "Claim it before the price changes",
    description:
      "Lock in the offer while it is still available so your website setup can move forward without delay.",
  },
  {
    step: "03",
    title: "Use it to launch with confidence",
    description:
      "Use that hosting as the base for your domain, website, and business presence so you start on stronger footing.",
  },
];

const hostingFaqs = [
  {
    question: "What is the best web hosting for a small business website?",
    answer:
      "The best web hosting for a small business is usually reliable, fast, easy to manage, and strong enough to support your site as it grows.",
  },
  {
    question: "Do I need hosting before I build my website?",
    answer:
      "Yes. You need website hosting in place before your site can go live, and choosing the right hosting early makes setup smoother.",
  },
  {
    question: "Why is web hosting important for business websites?",
    answer:
      "Web hosting affects uptime, speed, security, and how stable your website feels to customers. It is one of the foundations of a professional online presence.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Save 68% on Shared Web Hosting | Best Hosting for Business Websites",
  description: pageDescription,
  path: "/hosting-offer",
  keywords: [
    "shared web hosting offer",
    "best web hosting",
    "web hosting for small business",
    "best hosting for business website",
    "reliable web hosting",
    "save on shared hosting",
    "fast web hosting",
    "hosting deal",
  ],
});

function PrimaryHostingButton({ label }: { label: string }) {
  return (
    <a
      href={HOSTING_LINK}
      target="_blank"
      rel="noreferrer sponsored"
      className="offer-button inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
    >
      <span className="relative z-10">{label}</span>
    </a>
  );
}

export default function HostingOfferRoute() {
  return (
    <>
      <StructuredData
        data={[buildFaqSchema(hostingFaqs), buildHostingOfferSchema()]}
      />

      <main className="relative overflow-x-clip bg-[#050806] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />

        <section className="relative overflow-hidden border-b border-white/10 py-20 md:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(16,185,129,0.1),transparent_28%),linear-gradient(180deg,rgba(5,8,6,0.95)_0%,rgba(5,8,6,0.98)_100%)]" />

          <div className="relative mx-auto max-w-6xl px-6">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="max-w-3xl">
                <div className="hero-fall-in inline-flex items-center gap-3 rounded-full border border-emerald-300/30 bg-emerald-500/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200 shadow-[0_10px_26px_rgba(5,150,105,0.16)]">
                  <span>Limited Offer</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  <span>Save 68% on Shared Hosting</span>
                </div>
                <h1 className="hero-fall-in hero-fall-delay-1 mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-6xl">
                  Start Your Business Website Today (Save 68% on Hosting)
                </h1>
                <p className="hero-fall-in hero-fall-delay-2 mt-4 text-xl font-medium text-emerald-100/90">
                  Get fast, reliable hosting and launch your website the right way, without paying full price.
                </p>
                <p className="hero-fall-in hero-fall-delay-3 mt-5 max-w-2xl text-lg leading-7 text-white/72">
                  This hosting deal helps small businesses get online faster with reliable infrastructure, cleaner setup, and a better foundation for the website they want to launch.
                </p>

                <div className="hero-fall-in hero-fall-delay-4 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <PrimaryHostingButton label="Get Hosting Now" />
                </div>

                <p className="hero-fall-in hero-fall-delay-5 mt-4 text-sm text-white/62">
                  Limited-time offer. Pricing may change anytime.
                </p>

                <div className="hero-fall-in hero-fall-delay-5 mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.2),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/85">Discount</p>
                    <p className="mt-3 text-3xl font-semibold text-white">68% off</p>
                    <p className="mt-2 text-sm leading-6 text-white/68">Shared hosting deal</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.2),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/85">Best for</p>
                    <p className="mt-3 text-2xl font-semibold text-white">Business sites</p>
                    <p className="mt-2 text-sm leading-6 text-white/68">Fast launch foundation</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.2),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/85">Action</p>
                    <p className="mt-3 text-2xl font-semibold text-white">Grab it now</p>
                    <p className="mt-2 text-sm leading-6 text-white/68">Before pricing changes</p>
                  </div>
                </div>
              </div>

              <aside className="relative overflow-hidden rounded-3xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.21),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
                <div className="relative z-10">
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/85">Why act now</p>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5"><p className="text-sm leading-7 text-white/78">The 68% discount may not stay available, so waiting can mean paying more for the same starting point.</p></div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5"><p className="text-sm leading-7 text-white/78">Weak hosting causes avoidable speed, uptime, and trust issues that make launching harder than it needs to be.</p></div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5"><p className="text-sm leading-7 text-white/78">Starting right gives your website a cleaner foundation and saves you from fixing basic infrastructure problems later.</p></div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#050806] py-14">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Outcome</p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-4xl">What this helps you do</h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">A simple hosting deal only matters if it helps you launch faster, look more credible, and start with fewer problems.</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {fitCards.map((item) => (
                <article key={item.title} className="relative overflow-hidden rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.22)]">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/72">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-white/10 bg-[#060907] py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_85%_25%,rgba(16,185,129,0.07),transparent_24%)]" />
          <div className="mx-auto max-w-6xl px-6">
            <div className="relative max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Why it matters</p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">Why choosing the right web hosting is important</h2>
              <p className="mt-4 text-lg leading-7 text-white/72">Hosting is not just a background decision. It affects how confidently your website launches, how professional it feels, and how stable it stays.</p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {benefits.map((benefit) => (
                <article key={benefit.title} className="relative overflow-hidden rounded-2xl border border-emerald-400/18 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.12),rgba(3,14,11,0.92)_46%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_18px_38px_rgba(0,0,0,0.24)]">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(16,185,129,0.06)_0%,transparent_48%,rgba(255,255,255,0.02)_100%)]" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent" />
                  <h3 className="text-xl font-semibold text-white">{benefit.title}</h3>
                  <p className="relative mt-3 text-sm leading-7 text-white/72">{benefit.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-white/10 py-16">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,10,8,0.98)_0%,rgba(5,8,6,1)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:38px_38px] opacity-20" />
          <div className="mx-auto max-w-6xl px-6">
            <div className="relative max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Pick the right setup</p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">What to look for before you choose website hosting</h2>
              <p className="mt-4 text-lg leading-7 text-white/72">Keep the decision simple. You want hosting that is stable, fast enough, and easy to manage from day one.</p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {selectionCards.map((card) => (
                <article key={card.title} className="relative overflow-hidden rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(7,18,14,0.9)_0%,rgba(2,8,7,0.96)_100%)] p-6 shadow-[0_18px_36px_rgba(0,0,0,0.24)]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.09),transparent_36%)]" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                  <h3 className="relative text-xl font-semibold text-white">{card.title}</h3>
                  <p className="relative mt-3 text-sm leading-7 text-white/72">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-white/10 py-18">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(16,185,129,0.11),transparent_26%),linear-gradient(180deg,rgba(4,10,8,0.98)_0%,rgba(5,8,6,1)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:44px_44px] opacity-15" />
          <div className="mx-auto max-w-6xl px-6">
            <div className="relative max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Simple process</p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">Get hosting sorted in three simple steps</h2>
              <p className="mt-4 text-lg leading-7 text-white/72">Choose the plan, secure it, and use it as the base for getting your website online properly.</p>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {processSteps.map((step) => (
                <article key={step.step} className="relative overflow-hidden rounded-3xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.22),rgba(3,14,11,0.94)_42%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_22px_44px_rgba(0,0,0,0.28)]">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(16,185,129,0.07)_0%,transparent_45%,rgba(255,255,255,0.02)_100%)]" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
                  <div className="relative inline-flex rounded-md border border-white/20 bg-black/45 px-2 py-1 text-[11px] font-semibold tracking-[0.18em] text-emerald-200/95">{step.step}</div>
                  <h3 className="relative mt-4 text-2xl font-semibold text-white">{step.title}</h3>
                  <p className="relative mt-3 text-sm leading-7 text-white/76">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <div className="rounded-3xl border border-emerald-400/24 bg-[radial-gradient(circle_at_14%_-20%,rgba(16,185,129,0.24),rgba(4,16,13,0.9)_45%,rgba(2,8,7,0.98)_100%)] p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.25)] md:p-10">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/85">Main action</p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight md:text-5xl">Compare hosting and choose a setup you can rely on</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-7 text-white/72">Get your website started with reliable hosting, lower your upfront cost, and avoid fixing basic setup mistakes later.</p>
              <div className="mt-8"><PrimaryHostingButton label="Claim This Hosting Deal" /></div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#060907] py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-3xl border border-white/10 bg-black/35 p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">Setup help</p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight md:text-4xl">Don&apos;t want to set it up yourself?</h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">I can help you get online with a clean, professional website in 48 hours.</p>
              <div className="mt-8">
                <Link href="/launch" className="offer-button-soft inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50">
                  Start Your Website
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <HostingSupportBlock
              compact
              title="Want hosting sorted before the website build starts?"
              description="Use the hosting offer first if you want a clean starting point, then move into the website setup when you are ready."
              ctaLabel="Launch with Reliable Hosting"
            />
          </div>
        </section>

        <FAQSection items={hostingFaqs} title="Web hosting questions people usually ask first" description="Short answers to help you choose hosting for your business website without overcomplicating the basics." />

        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Final step</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight md:text-5xl">Launch with Reliable Hosting</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-7 text-white/72">Claim the discount, start with stronger hosting, and give your business website a cleaner path online.</p>
            <div className="mt-8"><PrimaryHostingButton label="Get Hosting Now" /></div>
          </div>
        </section>
      </main>
    </>
  );
}
