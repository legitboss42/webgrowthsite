import PremiumButton from "@/components/platform/PremiumButton";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  aside?: React.ReactNode;
  chips?: string[];
  theme?: "light" | "dark";
};

export default function PageHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  aside,
  chips,
  theme = "light",
}: PageHeroProps) {
  const isDark = theme === "dark";

  return (
    <section
      className={[
        "relative overflow-hidden border-b",
        isDark ? "border-white/10 bg-[#0f172a] text-white" : "border-slate-200 bg-[#f7f8fc] text-slate-950",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={[
            "absolute left-[-8%] top-[-10%] h-72 w-72 rounded-full",
            isDark
              ? "bg-[radial-gradient(circle,rgba(79,107,255,0.18),transparent_70%)]"
              : "bg-[radial-gradient(circle,rgba(79,107,255,0.14),transparent_70%)]",
          ].join(" ")}
        />
        <div
          className={[
            "absolute right-[-10%] top-[8%] h-[28rem] w-[28rem] rounded-full",
            isDark
              ? "bg-[radial-gradient(circle,rgba(124,92,255,0.14),transparent_72%)]"
              : "bg-[radial-gradient(circle,rgba(124,92,255,0.12),transparent_72%)]",
          ].join(" ")}
        />
      </div>

      <div className="relative mx-auto grid max-w-[1240px] gap-10 px-5 py-16 sm:px-6 md:grid-cols-[1.02fr_0.98fr] md:items-center md:py-20">
        <div className="max-w-3xl">
          <p
            className={[
              "inline-flex rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]",
              isDark
                ? "border-white/15 bg-white/5 text-blue-200"
                : "border-blue-100 bg-white/90 text-blue-700 shadow-sm",
            ].join(" ")}
          >
            {eyebrow}
          </p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[0.94] tracking-[-0.05em] md:text-[3.85rem]">
            {title}
          </h1>
          <p
            className={[
              "mt-6 max-w-2xl text-lg leading-8",
              isDark ? "text-white/72" : "text-slate-600",
            ].join(" ")}
          >
            {description}
          </p>

          {chips?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
                    isDark
                      ? "border-white/10 bg-white/5 text-white/75"
                      : "border-slate-200 bg-white text-slate-600",
                  ].join(" ")}
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          {(primaryCta || secondaryCta) && (
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {primaryCta ? (
                <PremiumButton href={primaryCta.href}>{primaryCta.label}</PremiumButton>
              ) : null}
              {secondaryCta ? (
                <PremiumButton href={secondaryCta.href} variant={isDark ? "secondary" : "secondary"}>
                  {secondaryCta.label}
                </PremiumButton>
              ) : null}
            </div>
          )}
        </div>

        <div>{aside}</div>
      </div>
    </section>
  );
}
