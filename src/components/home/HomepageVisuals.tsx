import {
  AuditIcon,
  BuildIcon,
  CapIcon,
  DollarIcon,
  GrowthChartIcon,
  IconBadge,
  LightbulbIcon,
  MailIcon,
  MonetizeIcon,
  PlanIcon,
  SearchIcon,
  SitemapIcon,
  SpeedIcon,
  TagIcon,
} from "./HomeIcons";

export function BrowserFrameMockup() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.10)]"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <div className="ml-3 h-8 flex-1 rounded-full border border-slate-200 bg-white px-4 text-xs text-slate-400">
          <span className="inline-flex h-full items-center">webgrowth.info/audit</span>
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <div className="rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_100%)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                Audit Summary
              </p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                14 improvements found
              </p>
            </div>
            <IconBadge tone="blue" shape="circle" className="h-11 w-11">
              <AuditIcon />
            </IconBadge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["SEO", "Needs work"],
              ["Speed", "Recoverable"],
              ["Leads", "Opportunity"],
            ].map(([title, value]) => (
              <div key={title} className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {title}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Traffic Trend
              </p>
              <IconBadge tone="purple" shape="square" className="h-10 w-10">
                <GrowthChartIcon />
              </IconBadge>
            </div>
            <div className="mt-4 flex h-32 items-end gap-2">
              {[28, 44, 38, 58, 61, 74, 86].map((height, index) => (
                <div key={index} className="flex flex-1 items-end">
                  <div
                    className="w-full rounded-t-xl bg-[linear-gradient(180deg,#7c5cff_0%,#4f6bff_100%)]"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Priority Stack
            </p>
            <div className="mt-4 space-y-3">
              {[
                { label: "Fix indexation", Icon: PlanIcon },
                { label: "Improve speed", Icon: SpeedIcon },
                { label: "Tighten metadata", Icon: TagIcon },
              ].map(({ label, Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
                >
                  <IconBadge tone="slate" shape="square" className="h-10 w-10">
                    <Icon />
                  </IconBadge>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ToolPreviewCard() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Tool Preview
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">Audit workflow</p>
        </div>
        <IconBadge tone="green" shape="square" className="h-10 w-10">
          <SearchIcon />
        </IconBadge>
      </div>

      <div className="mt-4 space-y-3">
        {[
          { label: "Scan pages", Icon: SearchIcon },
          { label: "Read meta tags", Icon: TagIcon },
          { label: "Map sitemap", Icon: SitemapIcon },
          { label: "Suggest fixes", Icon: LightbulbIcon },
        ].map(({ label, Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-100">
            <IconBadge tone="blue" shape="square" className="h-9 w-9">
              <Icon />
            </IconBadge>
            <span className="text-sm text-slate-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProofDeviceMockup() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-full w-full max-w-[34rem]">
      <div className="absolute left-10 right-12 top-10 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_26px_70px_rgba(15,23,42,0.14)]">
        <BrowserFrameMockup />
      </div>

      <div className="absolute -bottom-2 right-0 w-40 rounded-[2rem] border border-slate-200 bg-slate-950 p-2 shadow-[0_24px_65px_rgba(15,23,42,0.2)]">
        <div className="overflow-hidden rounded-[1.6rem] bg-white">
          <div className="h-6 bg-slate-950" />
          <div className="space-y-3 p-3">
            <div className="h-20 rounded-2xl bg-[linear-gradient(135deg,#eff6ff_0%,#f5f3ff_100%)]" />
            <div className="grid gap-2">
              <div className="h-2 rounded-full bg-slate-200" />
              <div className="h-2 w-5/6 rounded-full bg-slate-200" />
              <div className="h-2 w-2/3 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 top-0 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
          Growth stack
        </p>
        <div className="mt-3 flex gap-2">
          <IconBadge tone="blue" shape="square" className="h-10 w-10">
            <BuildIcon />
          </IconBadge>
          <IconBadge tone="purple" shape="square" className="h-10 w-10">
            <GrowthChartIcon />
          </IconBadge>
          <IconBadge tone="green" shape="square" className="h-10 w-10">
            <MonetizeIcon />
          </IconBadge>
        </div>
      </div>
    </div>
  );
}

export function LearningMetaChips({
  items,
}: {
  items: ReadonlyArray<{ label: string; icon: "cap" | "growth" | "money" | "mail" }>;
}) {
  const iconMap = {
    cap: CapIcon,
    growth: GrowthChartIcon,
    money: DollarIcon,
    mail: MailIcon,
  } as const;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => {
        const Icon = iconMap[item.icon];

        return (
          <span
            key={item.label}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}
