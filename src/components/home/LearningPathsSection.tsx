import Link from "next/link";
import { DollarIcon, GrowthChartIcon, RocketIcon } from "./HomeIcons";
import SectionShell from "./SectionShell";

const paths = [
  {
    title: "Start & Launch",
    description: "Build your foundation the right way.",
    outcome: "8 lessons",
    icon: <RocketIcon />,
    progress: "48%",
  },
  {
    title: "Grow Traffic",
    description: "Increase visibility and attract the right audience.",
    outcome: "12 lessons",
    icon: <GrowthChartIcon />,
    progress: "72%",
  },
  {
    title: "Monetize & Scale",
    description: "Turn traffic into sustainable revenue.",
    outcome: "9 lessons",
    icon: <DollarIcon />,
    progress: "58%",
  },
] as const;

export default function LearningPathsSection() {
  return (
    <SectionShell tone="canvas" spacing="compact">
      <div className="overflow-hidden rounded-[1.7rem] border border-blue-950/60 bg-[radial-gradient(circle_at_100%_0%,rgba(108,84,255,0.45),transparent_30%),linear-gradient(135deg,#091226_0%,#0c1631_44%,#0b1230_100%)] p-5 shadow-[0_26px_70px_rgba(6,14,35,0.28)] md:p-7">
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr_0.92fr_0.92fr]">
          <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.02] p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
              Learning paths
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">
              Guided routes to real results
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Step-by-step learning paths to build, grow, and monetize your
              website with confidence.
            </p>
            <Link
              href="/blog/"
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3557ff_0%,#4f6bff_45%,#7c5cff_100%)] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,107,255,0.24)] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Explore Paths -&gt;
            </Link>
          </div>

          {paths.map((path) => (
            <Link
              key={path.title}
              href="/blog/"
              className="group rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:-translate-y-0.5 hover:border-blue-300/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(79,107,255,0.22),rgba(124,92,255,0.25))] text-blue-100 ring-1 ring-white/10">
                {path.icon}
              </div>
              <h3 className="mt-6 text-[1.7rem] font-semibold tracking-[-0.04em] text-white">
                {path.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">{path.description}</p>
              <p className="mt-6 text-sm font-medium text-slate-200">{path.outcome}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#4f6bff_0%,#7c5cff_100%)]"
                  style={{ width: path.progress }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
