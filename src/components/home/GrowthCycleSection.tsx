import Link from "next/link";
import Reveal from "@/components/platform/Reveal";
import OrbitGrowthDiagram from "@/components/platform/OrbitGrowthDiagram";
import SectionHeading from "./SectionHeading";
import SectionShell from "./SectionShell";

const cycleSteps = [
  {
    title: "Plan around the business goal",
    text: "Start with positioning, buyer questions, page priorities, and the traffic model before visual decisions take over.",
  },
  {
    title: "Build the site as a growth asset",
    text: "Design, UX, trust, and technical foundations are built to support search, leads, and future monetization from day one.",
  },
  {
    title: "Grow with structured demand capture",
    text: "Academy content, SEO, internal links, and tools create repeatable discovery instead of one-time launch noise.",
  },
  {
    title: "Monetize without degrading quality",
    text: "Services, lead magnets, products, partnerships, and AdSense-safe publishing fit into one disciplined platform model.",
  },
] as const;

export default function GrowthCycleSection() {
  return (
    <SectionShell tone="dark" spacing="default" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(148,163,184,0.35),transparent)]" />
        <div className="absolute left-[-8%] top-[12%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.25),transparent_68%)]" />
        <div className="absolute right-[-6%] bottom-[-8%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.22),transparent_70%)]" />
      </div>

      <div className="relative">
        <Reveal>
          <SectionHeading
            eyebrow="Website growth cycle"
            title="Cinematic strategy, not random website activity."
            description="Web Growth is built around a connected operating model: structure the platform, strengthen the site, capture demand, and monetize with discipline."
            invert
            density="feature"
          />
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <Reveal className="order-2 lg:order-1">
            <div className="grid gap-4">
              {cycleSteps.map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-[1.7rem] border border-white/10 bg-white/6 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.24)] backdrop-blur"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(79,107,255,0.9),rgba(124,92,255,0.88))] text-sm font-bold text-white shadow-[0_12px_32px_rgba(79,107,255,0.3)]">
                      0{index + 1}
                    </span>
                    <div>
                      <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                        {item.title}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-slate-300">{item.text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>

          <Reveal className="order-1 lg:order-2" y={54}>
            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.7),rgba(15,23,42,0.44))] p-4 shadow-[0_34px_100px_rgba(2,6,23,0.34)] backdrop-blur md:p-6">
              <OrbitGrowthDiagram />
              <div className="mt-6 flex flex-col gap-3 rounded-[1.6rem] border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between">
                <p className="max-w-2xl text-sm leading-7 text-slate-300">
                  The same system shapes homepage UX, service architecture, Academy
                  discovery, case-study proof, and future tools. Nothing is meant to
                  feel bolted on.
                </p>
                <Link
                  href="/services/"
                  className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300"
                >
                  See how services fit
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
