import type { ReactNode } from "react";
import TrackedLink from "@/components/analytics/TrackedLink";

type HeroAction = {
  label: string;
  href: string;
  ctaName: string;
  destination: string;
};

type CinematicHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  pageType: string;
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
  aside?: ReactNode;
  footer?: ReactNode;
  variant?: "split" | "editorial" | "utility" | "case-study";
};

export default function CinematicHero({
  eyebrow,
  title,
  description,
  pageType,
  primaryAction,
  secondaryAction,
  aside,
  footer,
  variant = "split",
}: CinematicHeroProps) {
  const isEditorial = variant === "editorial";
  const isUtility = variant === "utility";

  return (
    <section
      className={[
        "relative isolate overflow-hidden border-b border-[#23402f] bg-[#0e1a14] text-text-primary",
        isUtility ? "py-14 md:py-18" : "py-20 md:py-28",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(28,122,84,0.3),transparent_28%),radial-gradient(circle_at_20%_85%,rgba(180,128,47,0.18),transparent_30%),linear-gradient(115deg,rgba(12,51,39,0.75),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(219,231,222,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(219,231,222,.08)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div
        className={[
          "relative mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:px-8",
          isEditorial
            ? "lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,.65fr)] lg:items-end"
            : isUtility
              ? "lg:grid-cols-[minmax(0,.72fr)_minmax(22rem,1.28fr)] lg:items-center"
              : "lg:grid-cols-[minmax(0,.9fr)_minmax(24rem,1.1fr)] lg:items-center",
        ].join(" ")}
      >
        <div className={isUtility ? "lg:order-2" : ""}>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#7cc6a2]">{eyebrow}</p>
          <h1
            className={[
              "mt-5 max-w-4xl text-balance font-display font-normal leading-[0.96] tracking-[-0.045em]",
              isUtility ? "text-4xl md:text-5xl" : isEditorial ? "text-5xl md:text-7xl" : "text-5xl md:text-6xl lg:text-7xl",
            ].join(" ")}
          >
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-text-muted md:text-lg">{description}</p>

          {primaryAction || secondaryAction ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryAction ? (
                <TrackedLink
                  href={primaryAction.href}
                  ctaName={primaryAction.ctaName}
                  ctaLocation="cinematic_hero"
                  destination={primaryAction.destination}
                  pageType={pageType}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#124a38] px-6 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(18,74,56,.24)] transition hover:-translate-y-0.5 hover:bg-[#1c7a54] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7cc6a2]"
                >
                  {primaryAction.label}
                </TrackedLink>
              ) : null}
              {secondaryAction ? (
                <TrackedLink
                  href={secondaryAction.href}
                  ctaName={secondaryAction.ctaName}
                  ctaLocation="cinematic_hero"
                  destination={secondaryAction.destination}
                  pageType={pageType}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#2d6a57] bg-white/[0.04] px-6 text-sm font-semibold text-text-primary transition hover:border-[#7cc6a2] hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7cc6a2]"
                >
                  {secondaryAction.label}
                </TrackedLink>
              ) : null}
            </div>
          ) : null}
        </div>

        {aside ? <div className={isUtility ? "lg:order-1" : ""}>{aside}</div> : null}
      </div>
      {footer ? <div className="relative mx-auto mt-12 max-w-7xl px-5 sm:px-6 lg:px-8">{footer}</div> : null}
    </section>
  );
}
