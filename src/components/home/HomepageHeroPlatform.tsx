import Link from "next/link";
import CinematicOrbitScene from "./CinematicOrbitScene";
import {
  AttractIcon,
  BuildIcon,
  ConvertIcon,
  GrowthChartIcon,
  IconBadge,
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
    angleClass: "-rotate-90",
    cardClass: "-translate-x-1/2 -translate-y-[26%]",
    icon: <PlanIcon />,
  },
  {
    number: "2",
    title: "Build",
    description: "Premium builds engineered for trust and conversion.",
    angleClass: "-rotate-[35deg]",
    cardClass: "translate-x-[24%] -translate-y-[30%]",
    icon: <BuildIcon />,
  },
  {
    number: "3",
    title: "Optimize",
    description: "SEO, speed, analytics, and UX refinement.",
    angleClass: "rotate-[35deg]",
    cardClass: "translate-x-[25%] -translate-y-[30%]",
    icon: <OptimizeIcon />,
  },
  {
    number: "4",
    title: "Attract",
    description: "Content systems that attract the right audience.",
    angleClass: "rotate-90",
    cardClass: "-translate-x-1/2 -translate-y-[26%]",
    icon: <AttractIcon />,
  },
  {
    number: "5",
    title: "Convert",
    description: "Turn more visits into qualified leads and customers.",
    angleClass: "rotate-[145deg]",
    cardClass: "-translate-x-[125%] -translate-y-[30%]",
    icon: <ConvertIcon />,
  },
  {
    number: "6",
    title: "Monetize",
    description: "Services, digital assets, and AdSense-safe revenue paths.",
    angleClass: "-rotate-[145deg]",
    cardClass: "-translate-x-[124%] -translate-y-[30%]",
    icon: <MonetizeIcon />,
  },
] as const;

const valueCards = [
  {
    title: "Build a better website foundation",
    text: "Premium design, clearer offers, better trust, and stronger structure from the start.",
    stat: "Build",
    accent: "from-blue-500/20 via-blue-100/60 to-white",
    lines: ["Offer clarity", "Trust UX"],
    cta: "Learn more",
    icon: <BuildIcon />,
    picture: (
      <div className="relative h-16 overflow-hidden rounded-2xl border border-white/70 bg-[linear-gradient(135deg,#eef4ff_0%,#ffffff_52%,#ede9ff_100%)]">
        <div className="absolute left-3 top-3 h-3 w-20 rounded-full bg-blue-200" />
        <div className="absolute left-3 top-9 h-9 w-24 rounded-2xl bg-blue-600/85" />
        <div className="absolute right-3 top-4 h-12 w-16 rounded-[1.25rem] bg-white shadow-[0_14px_28px_rgba(79,107,255,0.18)]" />
        <div className="absolute right-6 top-8 h-2 w-8 rounded-full bg-slate-200" />
        <div className="absolute right-6 top-[3.4rem] h-2 w-6 rounded-full bg-slate-100" />
      </div>
    ),
  },
  {
    title: "Grow traffic and monetize responsibly",
    text: "SEO, speed, lead generation, and AdSense-safe monetization that support long-term growth.",
    stat: "Grow + Monetize",
    accent: "from-violet-500/18 via-blue-100/55 to-white",
    lines: ["SEO systems", "Lead capture"],
    cta: "Learn more",
    icon: <SearchIcon />,
    picture: (
      <div className="relative h-16 overflow-hidden rounded-2xl border border-white/70 bg-[linear-gradient(135deg,#f3edff_0%,#ffffff_52%,#eef4ff_100%)]">
        {[36, 58, 42, 70, 82].map((height, index) => (
          <div
            key={height}
            className="absolute bottom-3 rounded-t-xl bg-[linear-gradient(180deg,#7c5cff_0%,#4f6bff_100%)]"
            style={{
              left: `${14 + index * 14}%`,
              width: "9%",
              height: `${height}%`,
            }}
          />
        ))}
        <div className="absolute inset-x-3 top-4 h-px bg-slate-200" />
      </div>
    ),
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

export default function HomepageHeroPlatform() {
  return (
    <SectionShell
      tone="canvas"
      spacing="hero"
      className="relative overflow-hidden"
      innerClassName="relative"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
        <div className="absolute left-[-8%] top-[-10%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.16),transparent_68%)]" />
        <div className="absolute right-[-4%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.14),transparent_70%)]" />
        <div className="absolute inset-x-0 top-6 h-px bg-[linear-gradient(90deg,transparent,rgba(79,107,255,0.16),transparent)]" />
      </div>

      <CinematicOrbitScene className="relative">
        <div className="grid gap-5 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
          <div className="relative z-10 pt-4">
            <p className="inline-flex rounded-full border border-blue-100 bg-white/92 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700 shadow-sm">
              The platform for website growth
            </p>

            <h1 className="mt-4 text-balance text-[3.95rem] font-semibold leading-[0.85] tracking-[-0.075em] text-slate-950 md:text-[5.9rem]">
              Build.
              <br />
              Grow.
              <br />
              <span className="bg-[linear-gradient(90deg,#3557ff_0%,#7c5cff_60%,#5e7cff_100%)] bg-clip-text text-transparent">
                Monetize.
              </span>
            </h1>

            <p className="mt-4 max-w-[31rem] text-[1.02rem] leading-8 text-slate-600">
              Web Growth combines premium builds, search growth systems, Academy
              guidance, and monetization-aware strategy so your website becomes a
              stronger business asset, not a static brochure.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3557ff_0%,#7c5cff_100%)] px-6 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(79,107,255,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
              >
                Start With a Website Review
              </Link>
              <Link
                href="/blog/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-white px-6 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
              >
                Explore the Academy
              </Link>
            </div>

            <div className="mt-5 grid gap-3 md:max-w-[34rem] md:grid-cols-2">
              {valueCards.map((card) => (
                <article
                  key={card.title}
                  data-float-card
                  className="group rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(79,107,255,0.08)]"
                >
                  <div className={`rounded-[0.95rem] bg-gradient-to-br p-2 ${card.accent}`}>
                    {card.picture}
                  </div>
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <IconBadge tone="blue" className="h-10 w-10 rounded-[1rem]">
                      {card.icon}
                    </IconBadge>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                        {card.stat}
                      </p>
                      <h2 className="text-[0.92rem] font-semibold leading-5 text-slate-950">
                        {card.title}
                      </h2>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[0.87rem] leading-6 text-slate-600">{card.text}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {card.lines.map((line) => (
                      <span
                        key={line}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3.5 text-sm font-semibold text-blue-700">{card.cta} -&gt;</p>
                </article>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3.5">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((item) => (
                  <span
                    key={item}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(135deg,#dbeafe_0%,#ede9fe_100%)] text-[11px] font-bold text-blue-700 shadow-sm"
                  >
                    WG
                  </span>
                ))}
              </div>
              <p className="max-w-[18rem] text-[0.92rem] leading-6 text-slate-600">
                Built for website redesign, SEO growth, lead generation, and
                monetization systems that do not undermine trust.
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="relative mx-auto flex w-full max-w-[47rem] translate-x-4 items-center justify-center lg:mt-0 lg:translate-x-6">
              <div className="relative aspect-square w-full">
                <div
                  data-orbit-glow
                  className="pointer-events-none absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.2)_0%,rgba(124,92,255,0.16)_38%,transparent_72%)] blur-3xl"
                />
                <div
                  data-orbit-ring
                  className="pointer-events-none absolute inset-[0.2%] rounded-full border border-blue-100/70"
                />
                <div
                  data-orbit-ring
                  className="pointer-events-none absolute inset-[3.5%] rounded-full border border-dashed border-violet-200/70"
                />
                <div
                  data-orbit-ring
                  className="pointer-events-none absolute inset-[7.5%] rounded-full border-2 border-blue-500/80 border-r-violet-500 border-b-blue-300"
                />
                <div
                  data-orbit-ring
                  className="pointer-events-none absolute inset-[15.5%] rounded-full border border-blue-100/70"
                />
                <div
                  data-orbit-ring
                  className="pointer-events-none absolute inset-[23%] rounded-full border border-dashed border-slate-200"
                />

                <div className="absolute left-1/2 top-1/2 z-20 flex h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/97 text-center shadow-[0_24px_60px_rgba(15,23,42,0.09)]">
                  <div className="px-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                      Web Growth
                    </p>
                    <p className="mt-2 text-[2.15rem] font-semibold leading-tight tracking-[-0.055em] text-slate-950">
                      Website
                      <br />
                      Growth
                      <br />
                      Cycle
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                      <IconBadge tone="blue" shape="circle" className="h-9 w-9">
                        <GrowthChartIcon className="h-4 w-4" />
                      </IconBadge>
                      <IconBadge tone="purple" shape="circle" className="h-9 w-9">
                        <MonetizeIcon className="h-4 w-4" />
                      </IconBadge>
                    </div>
                  </div>
                </div>

                {orbitSteps.map((step) => (
                  <div
                    key={step.number}
                    data-orbit-track
                    className={["absolute inset-[0.5%]", step.angleClass].join(" ")}
                  >
                    <div className="relative h-full w-full">
                      <div
                        data-orbit-card
                        className={[
                          "absolute left-1/2 top-0 w-[7rem] md:w-[7.7rem]",
                          step.cardClass,
                        ].join(" ")}
                      >
                        <div className="rounded-[1.35rem] border border-white/85 bg-white/96 p-2.5 text-center shadow-[0_12px_24px_rgba(79,107,255,0.06)] backdrop-blur">
                          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-[1rem] border border-blue-100 bg-[linear-gradient(135deg,#eef4ff_0%,#f5efff_100%)] text-sm font-bold text-blue-700 shadow-sm">
                            {step.icon}
                          </div>
                          <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.18em] text-blue-700">
                            {step.number}
                          </p>
                          <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-950">
                            {step.title}
                          </p>
                          <p className="mt-1 text-[9px] leading-4 text-slate-500">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 rounded-[1.4rem] border border-slate-200/80 bg-white/88 p-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur md:grid-cols-3">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="rounded-[1rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,249,255,0.98))] px-3 py-2.5"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#eef4ff_0%,#f3edff_100%)] text-sm font-bold text-blue-700 ring-1 ring-blue-100">
                  {item.icon}
                </span>
                <div>
                  <p className="text-[0.95rem] font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-[0.8rem] leading-5 text-slate-600">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CinematicOrbitScene>
    </SectionShell>
  );
}
