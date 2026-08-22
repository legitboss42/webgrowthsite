import {
  CodeWindowIcon,
  DollarIcon,
  GrowthChartIcon,
  IconBadge,
  SearchIcon,
  ShieldIcon,
} from "@/components/home/HomeIcons";

const steps = [
  { title: "Plan", text: "Research, strategy, and site planning", icon: <ShieldIcon />, position: "top-[6%] left-[50%] -translate-x-1/2" },
  { title: "Build", text: "Design and develop high-converting pages", icon: <CodeWindowIcon />, position: "top-[24%] right-[2%]" },
  { title: "Optimize", text: "SEO, speed, and user experience", icon: <SearchIcon />, position: "bottom-[28%] right-[4%]" },
  { title: "Attract", text: "Content, SEO, and demand capture", icon: <GrowthChartIcon />, position: "bottom-[5%] left-[50%] -translate-x-1/2" },
  { title: "Convert", text: "Turn visitors into leads and customers", icon: <CodeWindowIcon />, position: "bottom-[28%] left-[2%]" },
  { title: "Monetize", text: "Services, products, and AdSense-safe revenue", icon: <DollarIcon />, position: "top-[24%] left-[4%]" },
];

export default function OrbitGrowthDiagram() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[40rem]">
      <div className="absolute inset-[14%] rounded-full border border-blue-200/80" />
      <div className="absolute inset-[18%] rounded-full border border-dashed border-slate-200" />
      <div className="absolute inset-[14%] rounded-full bg-[conic-gradient(from_160deg,#1c7a54_0deg,#124a38_120deg,#1c7a54_240deg,#1c7a54_360deg)] opacity-15 blur-xl" />
      <div className="absolute inset-[23%] rounded-full border border-slate-100 bg-white/80 shadow-[0_20px_60px_rgba(18,74,56,0.12)] backdrop-blur">
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Growth OS</p>
          <h3 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 md:text-4xl">
            The Website
            <br />
            Growth Cycle
          </h3>
          <p className="mt-4 max-w-xs text-sm leading-7 text-slate-600">
            A better website becomes the system that supports traffic, trust, leads, and revenue.
          </p>
        </div>
      </div>

      {steps.map((step) => (
        <div
          key={step.title}
          className={["absolute w-32 md:w-40", step.position].join(" ")}
        >
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="mx-auto mb-2 flex justify-center">
              <IconBadge tone="blue">{step.icon}</IconBadge>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{step.title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{step.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
