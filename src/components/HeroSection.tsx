"use client";

import Image from "next/image";
import TrackedLink from "@/components/analytics/TrackedLink";

type HeroSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  trustLine: string;
  locationNote: string;
  fitTags?: string[];
  asideTitle: string;
  asideItems: string[];
  imageSrc?: string;
  imageAlt?: string;
  showCodeRain?: boolean;
  showHomeAnimations?: boolean;
  pageType?: string;
};

function ActionLink({
  href,
  label,
  primary = false,
  ctaName,
  ctaLocation,
  destination,
  pageType,
  offerType,
}: {
  href: string;
  label: string;
  primary?: boolean;
  ctaName: string;
  ctaLocation: string;
  destination: string;
  pageType: string;
  offerType?: string;
}) {
  return (
    <TrackedLink
      href={href}
      className={
        primary
          ? "inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4f6bff_0%,#7c5cff_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(79,107,255,0.24)] transition hover:-translate-y-0.5 hover:brightness-105 sm:w-auto"
          : "inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 sm:w-auto"
      }
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      ctaName={ctaName}
      ctaLocation={ctaLocation}
      destination={destination}
      pageType={pageType}
      offerType={offerType}
    >
      {label}
    </TrackedLink>
  );
}

export default function HeroSection({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  trustLine,
  locationNote,
  fitTags = ["Nigeria", "Remote", "International"],
  asideTitle,
  asideItems,
  imageSrc = "/images/hero/Hero-Image-1.webp",
  imageAlt = "Modern business website launch workspace",
  pageType = "homepage",
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#f7f8fc]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.14),transparent_70%)]" />
        <div className="absolute right-[-12%] top-[4%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.12),transparent_72%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-6 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.06fr_0.94fr] lg:items-start">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              {eyebrow}
            </span>

            <h1 className="mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[0.96] tracking-[-0.05em] text-slate-950 sm:text-5xl md:text-6xl">
              {title}
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 lg:text-xl">
              {description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ActionLink
                href={primaryHref}
                label={primaryLabel}
                primary
                ctaName="get_started"
                ctaLocation={`${pageType}_hero_primary`}
                destination={primaryHref}
                pageType={pageType}
                offerType="website_growth"
              />
              <ActionLink
                href={secondaryHref}
                label={secondaryLabel}
                ctaName="secondary"
                ctaLocation={`${pageType}_hero_secondary`}
                destination={secondaryHref}
                pageType={pageType}
                offerType="website_growth"
              />
            </div>

            <p className="mt-4 text-sm text-slate-500">{trustLine}</p>

            <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
              <div className="relative aspect-[16/9]">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  priority
                  quality={60}
                  sizes="(max-width: 768px) 100vw, 720px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/8 to-transparent" />
              </div>
              <div className="grid gap-4 border-t border-slate-200 px-5 py-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                    Best fit
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{locationNote}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fitTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.12)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                {asideTitle}
              </p>
            </div>
            <div className="grid gap-4 p-6">
              {asideItems.map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] p-4 shadow-sm"
                >
                  <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
