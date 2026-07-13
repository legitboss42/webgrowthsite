import { CapIcon, CheckIcon, GrowthChartIcon, IconBadge, TargetIcon, WrenchIcon } from "./HomeIcons";

const benefits = [
  ["Practical & actionable", "No fluff. Only what works.", CheckIcon, "blue"],
  ["Beginner to advanced", "Step-by-step learning paths.", CapIcon, "purple"],
  ["Free tools", "Powerful tools to grow faster.", WrenchIcon, "green"],
  ["Documented process", "Clear decisions, evidence, and practical next steps.", TargetIcon, "amber"],
  ["Built for progress", "Stronger foundations for traffic, trust, and action.", GrowthChartIcon, "blue"],
] as const;

export default function TrustBenefitStrip() {
  return (
    <section className="bg-[#f7f8fc] pb-8">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:grid-cols-5">
          {benefits.map(([title, description, Icon, tone]) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-xl px-3 py-3 md:border-r md:border-slate-100 last:md:border-r-0"
            >
              <IconBadge tone={tone} className="mt-0.5 h-11 w-11 shrink-0">
                <Icon />
              </IconBadge>
              <div>
                <p className="text-sm font-semibold text-slate-950">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
