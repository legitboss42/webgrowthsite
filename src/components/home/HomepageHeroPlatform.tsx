import Image from "next/image";
import Link from "next/link";
import { getPublicPosts } from "@/lib/posts";
import { NEW_SERVICES_LIST } from "@/lib/newServiceConfigs";
import { PUBLIC_TOOLS } from "@/lib/tools";
import {
  AttractIcon,
  BuildIcon,
  ConvertIcon,
  GrowthChartIcon,
  MonetizeIcon,
  OptimizeIcon,
  PlanIcon,
  SearchIcon,
} from "./HomeIcons";
import SectionShell from "./SectionShell";

const orbitSteps = [
  {
    number: "1",
    title: "Plan",
    description: "Research, positioning, and website architecture.",
    icon: <PlanIcon />,
  },
  {
    number: "2",
    title: "Build",
    description: "Premium builds engineered for trust and conversion.",
    icon: <BuildIcon />,
  },
  {
    number: "3",
    title: "Optimize",
    description: "SEO, speed, analytics, and UX refinement.",
    icon: <OptimizeIcon />,
  },
  {
    number: "4",
    title: "Attract",
    description: "Content systems that attract the right audience.",
    icon: <AttractIcon />,
  },
  {
    number: "5",
    title: "Convert",
    description: "Turn more visits into qualified leads and customers.",
    icon: <ConvertIcon />,
  },
  {
    number: "6",
    title: "Monetize",
    description: "Services, digital assets, and AdSense-safe revenue paths.",
    icon: <MonetizeIcon />,
  },
] as const;

const valueCards = [
  {
    title: "Build a better website foundation",
    text: "Premium design, clearer offers, better trust, and stronger structure from the start.",
    stat: "Build",
    lines: ["Offer clarity", "Trust UX"],
    cta: "Learn more",
    icon: <BuildIcon />,
  },
  {
    title: "Grow traffic and monetize responsibly",
    text: "SEO, speed, lead generation, and AdSense-safe monetization that support long-term growth.",
    stat: "Grow + Monetize",
    lines: ["SEO systems", "Lead capture"],
    cta: "Learn more",
    icon: <SearchIcon />,
  },
] as const;

const trustItems = [
  {
    title: "Policy-first website growth",
    text: "Structure, content depth, and monetization decisions stay aligned from the start.",
    icon: <SearchIcon />,
  },
  {
    title: "AdSense safe by design",
    text: "No fake tools, doorway pages, or made-for-ads shortcuts.",
    icon: <ConvertIcon />,
  },
  {
    title: "Strategy over shortcuts",
    text: "Sustainable growth systems, not quick-fix gimmicks.",
    icon: <BuildIcon />,
  },
] as const;

function GrowthLineHero() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 560 260"
      className="wg-growth-glow absolute inset-x-0 bottom-2 z-0 mx-auto h-[15rem] w-full max-w-[39rem] text-accent-gold opacity-90"
    >
      <path
        data-growth-path
        data-growth-hero="true"
        d="M22 218 C 88 192, 104 148, 158 157 S 246 196, 292 123 S 386 49, 448 73 S 511 69, 538 30"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="4"
      />
      {[
        [158, 157, "Build"],
        [292, 123, "Grow"],
        [538, 30, "Monetize"],
      ].map(([cx, cy, label]) => (
        <g key={label as string}>
          <circle className="growth-dot" cx={cx as number} cy={cy as number} r="6" fill="currentColor" />
          <text
            x={cx as number}
            y={(cy as number) - 16}
            textAnchor="middle"
            className="fill-text-primary text-[13px] font-semibold"
          >
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function HomepageHeroPlatform() {
  const publishedGuideCount = getPublicPosts().length;
  const serviceCount = NEW_SERVICES_LIST.length;
  const toolCount = PUBLIC_TOOLS.length;

  return (
    <>
      <SectionShell
        tone="canvas"
        spacing="hero"
        className="relative overflow-hidden"
        innerClassName="relative"
      >
        <div data-parallax-section className="pointer-events-none absolute inset-0 overflow-hidden">
          <Image
            data-parallax-bg
            src="/images/cinematic/hero-bg.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover opacity-[0.72]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(12,15,20,0.2),rgba(12,15,20,0.9))]" />
          <div className="wg-hairline-grid absolute inset-0 opacity-30" />
        </div>

        <div className="relative grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="relative z-10">
            <p
              data-reveal
              className="inline-flex rounded-full border border-accent-gold/25 bg-white/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-accent-gold"
            >
              The platform for website growth
            </p>

            <h1 className="font-display mt-6 text-balance text-[clamp(64px,9vw,128px)] font-medium leading-[0.78] tracking-[-0.075em] text-text-primary">
              <span data-reveal className="block">Build.</span>
              <span data-reveal className="block">Grow.</span>
              <span data-reveal className="block text-accent-gold">Monetize.</span>
            </h1>

            <p data-reveal className="mt-6 max-w-[35rem] text-[1.05rem] leading-8 text-text-muted">
              Web Growth combines premium builds, search growth systems, Academy
              guidance, and monetization-aware strategy so your website becomes a
              stronger business asset, not a static brochure.
            </p>

            <div data-reveal className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact/"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent-gold px-6 text-sm font-bold text-bg-ink shadow-[0_18px_42px_rgba(232,163,61,0.24)] transition hover:-translate-y-0.5 hover:bg-[#f1b75d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
              >
                Start With a Website Review
              </Link>
              <Link
                href="/blog/"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border-hairline bg-white/[0.04] px-6 text-sm font-semibold text-text-primary transition hover:border-accent-gold/55 hover:text-accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
              >
                Explore the Academy
              </Link>
            </div>

            <div data-stagger className="mt-8 grid gap-3 md:max-w-[36rem] md:grid-cols-2">
              {valueCards.map((card) => (
                <article
                  key={card.title}
                  className="wg-card-hover rounded-[1.35rem] border border-border-hairline bg-[#11161f]/82 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-gold/10 text-accent-gold ring-1 ring-accent-gold/25">
                      {card.icon}
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-gold">
                        {card.stat}
                      </p>
                      <h2 className="font-display mt-1 text-[1.2rem] font-medium leading-6 text-text-primary">
                        {card.title}
                      </h2>
                    </div>
                  </div>
                  <p className="mt-4 text-[0.9rem] leading-6 text-text-muted">{card.text}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.lines.map((line) => (
                      <span
                        key={line}
                        className="rounded-full border border-border-hairline bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-text-muted"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-sm font-semibold text-accent-gold">{card.cta} -&gt;</p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative z-10 min-h-[36rem]">
            <GrowthLineHero />
            <div data-reveal className="relative ml-auto max-w-[42rem] overflow-hidden rounded-[2rem] border border-border-hairline bg-[#11161f]/78 p-4 shadow-[0_34px_90px_rgba(0,0,0,0.34)] backdrop-blur">
              <Image
                src="/images/cinematic/audit-glow.webp"
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 680px"
                className="object-cover opacity-[0.55]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(12,15,20,0.2),rgba(12,15,20,0.9))]" />
              <div className="relative z-10 rounded-[1.45rem] border border-white/8 bg-bg-ink/78 p-5">
                <div className="flex items-center justify-between border-b border-border-hairline pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold">
                      Audit summary
                    </p>
                    <p className="mt-1 text-sm text-text-muted">Live-feeling growth snapshot</p>
                  </div>
                  <span className="rounded-full border border-accent-teal/45 bg-accent-teal/14 px-3 py-1 text-xs font-semibold text-text-primary">
                    Ready
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Academy", publishedGuideCount, "published guides"],
                    ["Services", serviceCount, "live implementation paths"],
                    ["Tools", toolCount, "public utilities live now"],
                  ].map(([label, value, description]) => (
                    <div key={label as string} className="rounded-2xl border border-border-hairline bg-white/[0.035] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-gold">
                        {label}
                      </p>
                      <p className="font-display mt-2 text-3xl font-medium tracking-[-0.04em] text-text-primary">
                        {value}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-border-hairline bg-[#0a0d12] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                    <span className="h-2 w-2 rounded-full bg-accent-gold" />
                    Growth trajectory
                  </div>
                  <div className="mt-5 h-36 overflow-hidden rounded-xl bg-[linear-gradient(180deg,rgba(232,163,61,0.08),rgba(27,110,99,0.06))] p-4">
                    <svg viewBox="0 0 420 120" className="h-full w-full text-accent-gold">
                      <path
                        data-growth-path
                        d="M8 104 C 72 80, 83 94, 128 65 S 202 32, 260 47 S 346 78, 412 14"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="default" className="relative" innerClassName="relative">
        <div data-growth-section data-parallax-section className="relative overflow-hidden rounded-[2rem] border border-border-hairline bg-[#11161f]/78 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.25)] md:p-8">
          <Image
            data-parallax-bg
            src="/images/cinematic/growth-cycle-bg.webp"
            alt=""
            fill
            loading="lazy"
            sizes="(max-width: 1280px) 100vw, 1240px"
            className="scale-110 object-cover opacity-[0.42]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(12,15,20,0.2),rgba(12,15,20,0.9))]" />
          <div
            data-cycle-light
            className="pointer-events-none absolute left-[10%] top-[38%] h-36 w-36 rounded-full bg-accent-gold/22 blur-3xl"
          />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-center">
            <div data-reveal>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold">
                Website Growth Cycle
              </p>
              <h2 className="font-display mt-4 text-4xl font-medium tracking-[-0.05em] text-text-primary md:text-5xl">
                A single line from plan to monetization.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-text-muted">
                The platform connects strategy, build quality, search visibility,
                conversion, and ethical revenue paths into one operating system.
              </p>
            </div>

            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 820 180"
                className="wg-growth-glow absolute left-0 right-0 top-8 hidden h-36 w-full text-accent-gold md:block"
              >
                <path
                  data-growth-path
                  d="M20 150 C 126 126, 156 70, 244 92 S 370 142, 446 76 S 576 18, 676 48 S 770 54, 802 20"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>

              <div data-stagger className="relative z-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {orbitSteps.map((step) => (
                  <article
                    key={step.number}
                    data-cycle-step
                    className="group rounded-[1.35rem] border border-border-hairline bg-bg-ink/70 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition data-[active=true]:border-accent-gold"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent-gold/25 bg-accent-gold/10 text-sm font-bold text-accent-gold transition group-[.is-active]:scale-110 group-[.is-active]:bg-accent-gold group-[.is-active]:text-bg-ink">
                        {step.icon}
                      </span>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-gold">
                          {step.number}
                        </p>
                        <h3 className="font-display mt-1 text-xl font-medium text-text-primary">
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-text-muted">{step.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div data-stagger className="mt-6 grid gap-3 md:grid-cols-3">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.2rem] border border-border-hairline bg-white/[0.035] px-4 py-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-teal/18 text-accent-gold ring-1 ring-accent-teal/35">
                  {item.icon}
                </span>
                <div>
                  <p className="font-display text-[1.08rem] font-medium text-text-primary">{item.title}</p>
                  <p className="mt-1 text-[0.84rem] leading-5 text-text-muted">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionShell>
    </>
  );
}
