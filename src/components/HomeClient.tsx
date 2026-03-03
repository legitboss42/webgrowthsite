import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const HomeAnimations = dynamic(() => import("@/components/HomeAnimations"), {
  ssr: false,
});

const CodeRain = dynamic(() => import("@/components/CodeRain"), {
  ssr: false,
});

const CONTACT_EMAIL = "admin@webgrowth.info";
const WHATSAPP_NUMBER = "2348066706336";
const WHATSAPP_DISPLAY = "+234 806 670 6336";
const WHATSAPP_MESSAGE =
  "Hello, I want to launch my website in 48 hours. What do you need from me?";
const PRIMARY_CTA_HREF = "/contact";

const WHAT_YOU_GET = [
  {
    title: "Domain setup guidance",
    description:
      "I guide you step-by-step on buying your domain and connecting everything correctly.",
  },
  {
    title: "Hosting + SSL",
    description:
      "Hosting and SSL configured so your website is secure, credible, and ready to launch.",
  },
  {
    title: "1-page website structure",
    description:
      "A conversion-focused page structure: hero, services, social proof, FAQ, and contact.",
  },
  {
    title: "Contact form + WhatsApp link",
    description:
      "Two direct enquiry paths so qualified leads can submit details or message instantly.",
  },
  {
    title: "Basic SEO setup",
    description:
      "Essential launch SEO: titles, meta description, sitemap checks, and indexability validation.",
  },
];

const PROCESS_STEPS = [
  {
    title: "Day 1: Strategy + setup",
    detail:
      "We lock your offer, messaging, contact flow, and launch assets in one focused pass.",
  },
  {
    title: "Day 1-2: Build + structure",
    detail:
      "Your one-page site is built mobile-first with conversion sections and technical setup.",
  },
  {
    title: "Day 2: Review + go live",
    detail:
      "Final QA, approvals, and deployment so your site can start converting immediately.",
  },
];

const PRICING_TIERS = [
  {
    name: "Launch",
    price: "$150",
    summary: "1 page",
    details: [
      "High-converting one-page website",
      "Mobile-first layout",
      "Contact form + WhatsApp conversion path",
      "Basic SEO launch setup",
    ],
    featured: true,
  },
  {
    name: "Launch + Blog",
    price: "$250",
    summary: "1 page + blog setup + 1 post migrated",
    details: [
      "Everything in Launch",
      "Blog structure configured",
      "1 post migrated",
      "Publishing handoff",
    ],
    featured: false,
  },
];

const SHOWCASE_PORTFOLIOS = [
  {
    title: "Clinic Website Refresh",
    category: "Redesign",
    detail:
      "Rebuilt for stronger trust signals, cleaner service flow, and better mobile conversion.",
    imageUrl: "/images/portfolio/portfolio-1.webp",
  },
  {
    title: "Campaign Landing Page",
    category: "Landing Page",
    detail:
      "Focused campaign page with tighter messaging and a lead-ready conversion path.",
    imageUrl: "/images/portfolio/portfolio-2.webp",
  },
  {
    title: "Business Website Build",
    category: "Business Site",
    detail:
      "Premium business website designed for clarity, authority, and direct enquiries.",
    imageUrl: "/images/portfolio/portfolio-5.webp",
  },
];

const FAQS = [
  {
    question: "How fast can this go live?",
    answer:
      "If your core details are ready, your website can go live within 48 hours.",
  },
  {
    question: "What do you need from me?",
    answer:
      "Your offer details, logo/assets, brand direction, and contact information.",
  },
  {
    question: "How many revisions are included?",
    answer: "Two focused revision rounds are included.",
  },
  {
    question: "Do I own my domain and hosting?",
    answer: "Yes. You own both. I guide setup and delivery.",
  },
  {
    question: "Do you offer ongoing support?",
    answer: "Yes. Ongoing support can be added after launch.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Refunds are not offered after build starts, but scope is confirmed before kickoff.",
  },
];

function buildWhatsAppUrl() {
  const text = encodeURIComponent(WHATSAPP_MESSAGE);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export default function HomeClient() {
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#050806] text-white">
      <HomeAnimations />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:42px_42px] opacity-25" />

      <section id="home-hero" className="relative overflow-hidden border-b border-white/10">
        <Image
          src="/images/hero/Hero-Image-1.webp"
          alt="Modern business website launch workspace"
          fill
          priority
          quality={68}
          sizes="100vw"
          className="absolute inset-0 object-cover object-center opacity-55"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(16,185,129,0.18),transparent_42%),radial-gradient(circle_at_85%_0%,rgba(16,185,129,0.09),transparent_34%),linear-gradient(180deg,rgba(5,8,6,0.45)_0%,rgba(7,11,9,0.6)_56%,rgba(5,8,6,0.78)_100%)]" />
        <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-45">
          <CodeRain />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-14 md:pt-20">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="text-center lg:text-left">
              <span className="hero-kicker inline-flex rounded-full border border-emerald-400/35 bg-emerald-500/10 px-4 py-2 text-[11px] tracking-[0.18em] uppercase text-emerald-100">
                48-Hour Website Launch
              </span>

              <h1 className="hero-title mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.02em] sm:text-5xl md:text-6xl">
                Get a Professional Website Live in 48 Hours
              </h1>

              <p className="hero-copy mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/75 lg:mx-0 lg:text-xl">
                Domain, hosting, and conversion-focused web design for a one-page launch, delivered for you.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href={PRIMARY_CTA_HREF}
                  className="hero-cta inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600 sm:w-auto"
                >
                  Start Now
                </Link>

                <a
                  href="#inclusions"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50 sm:w-auto"
                >
                  See What&apos;s Included
                </a>
              </div>

              <p className="hero-meta mt-4 text-sm text-white/65">
                Fast turnaround | Mobile-first | Built to convert
              </p>

              <div className="hero-stats mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  ["48 hours", "Launch window"],
                  ["1 page", "Conversion-first structure"],
                  ["$150", "Starting package"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="hero-stat rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-4 py-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
                  >
                    <p className="text-xl font-semibold text-emerald-200">{value}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-white/60">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="hero-aside rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
              <p className="text-xs tracking-[0.18em] uppercase text-emerald-200">
                Launch roadmap
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.01em]">
                Your 48-hour launch sequence
              </h2>

              <ul className="mt-6 space-y-4">
                {PROCESS_STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="rounded-xl border border-white/10 bg-black/35 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-emerald-200/95">
                      {String(index + 1).padStart(2, "0")} {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/70">{step.detail}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                <p className="text-sm leading-6 text-white/80">
                  Prefer to chat first? Get a direct WhatsApp response before you commit.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section
        id="services"
        className="relative overflow-hidden border-b border-white/10 bg-[#060907] py-20"
      >
        <div className="services-bg pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_35%,rgba(16,185,129,0.13),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(16,185,129,0.08),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.48))]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div id="inclusions" className="services-head max-w-3xl">
            <p className="text-xs tracking-[0.2em] uppercase text-emerald-300/80">What you get</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
              Everything required for a fast, credible launch
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
              Built for direct outreach traffic with clear messaging and a clean conversion
              path.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="service-card rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-7 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
              <p className="text-xs tracking-[0.18em] uppercase text-emerald-300/80">
                Inside your one-page site
              </p>
              <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.01em]">
                Structured for one clear action
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-white/80">
                {["Hero", "Services", "Social proof placeholder", "FAQ", "Contact section"].map(
                  (block) => (
                    <li key={block} className="flex items-center gap-3">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      <span>{block}</span>
                    </li>
                  )
                )}
              </ul>

              <div className="mt-6 rounded-xl border border-white/10 bg-black/35 p-4">
                <p className="text-sm leading-6 text-white/70">
                  Your page is structured around one clear outcome: more qualified enquiries.
                </p>
              </div>
            </article>

            <div className="grid gap-4 sm:grid-cols-2">
              {WHAT_YOU_GET.map((item, index) => (
                <article
                  key={item.title}
                  className="service-card rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:border-emerald-500/35"
                >
                  <p className="text-xs tracking-[0.14em] uppercase text-emerald-300/80">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-[-0.01em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/72">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="border-b border-white/10 bg-[#050806] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="about-block max-w-3xl">
            <p className="text-xs tracking-[0.2em] uppercase text-emerald-300/80">Simple pricing</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
              Launch Package - from $150
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
              Start lean, ship quickly, and expand after validation.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {PRICING_TIERS.map((tier) => (
              <article
                key={tier.name}
                className={[
                  "about-block rounded-2xl border p-7 shadow-[0_18px_44px_rgba(0,0,0,0.22)]",
                  tier.featured
                    ? "border-emerald-500/45 bg-[linear-gradient(180deg,rgba(16,185,129,0.22),rgba(16,185,129,0.08))]"
                    : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.01em]">{tier.name}</h3>
                    <p className="mt-1 text-sm text-white/65">{tier.summary}</p>
                  </div>
                  {tier.featured ? (
                    <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                      Most selected
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 text-3xl font-semibold text-emerald-200">{tier.price}</p>

                <ul className="mt-5 space-y-2 text-sm text-white/76">
                  {tier.details.map((detail) => (
                    <li key={detail} className="flex gap-3">
                      <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={PRIMARY_CTA_HREF}
                  className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(5,150,105,0.22)] transition-colors hover:bg-emerald-600 sm:w-auto"
                >
                  Start Now
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="portfolio" className="border-b border-white/10 bg-[#060907] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-xs tracking-[0.2em] uppercase text-emerald-300/80">Social proof</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
              Recent portfolio launches
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {SHOWCASE_PORTFOLIOS.map((item, index) => (
              <article
                key={item.title}
                className="case-card group overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition-all hover:-translate-y-1 hover:border-emerald-500/35"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    loading="lazy"
                    quality={60}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/82 to-black/18" />
                  <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs tracking-[0.12em] uppercase text-emerald-200/90">
                    {item.category}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold tracking-[-0.01em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/72">{item.detail}</p>
                  <Link
                    href="/portfolio"
                    className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    View Portfolio
                  </Link>
                  {index === 0 ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-white/45">
                      Featured sample
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[#050806] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="contact-block max-w-3xl">
            <p className="text-xs tracking-[0.2em] uppercase text-emerald-300/80">FAQ</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
              Common questions
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {FAQS.map((faq) => (
              <article
                key={faq.question}
                className="contact-block rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
              >
                <h3 className="text-lg font-semibold tracking-[-0.01em]">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-white/72">{faq.answer}</p>
              </article>
            ))}
          </div>

          <article className="contact-block mt-10 rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/16 to-black/68 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <h2 className="text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                  Get a Professional Website Live in 48 Hours
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                  Ready to launch? Send your details and get a clear, direct path to go live.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href={PRIMARY_CTA_HREF}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
                >
                  Start Now
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="mt-7 border-t border-white/10 pt-5 text-sm text-white/70">
              <span>Email: </span>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-300 hover:text-emerald-200">
                {CONTACT_EMAIL}
              </a>
              <span className="mx-2 text-white/40">|</span>
              <span>WhatsApp: </span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 hover:text-emerald-200"
              >
                {WHATSAPP_DISPLAY}
              </a>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
