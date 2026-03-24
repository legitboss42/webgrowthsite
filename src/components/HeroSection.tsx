"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HomeAnimations = dynamic(() => import("@/components/HomeAnimations"), {
  ssr: false,
});

const CodeRain = dynamic(() => import("@/components/CodeRain"), {
  ssr: false,
});

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
  asideTitle: string;
  asideItems: string[];
  imageSrc?: string;
  imageAlt?: string;
  showCodeRain?: boolean;
  showHomeAnimations?: boolean;
};

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  const className = primary
    ? "inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600 sm:w-auto"
    : "inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50 sm:w-auto";
  const isInternalRoute = href.startsWith("/");
  const isInPageAnchor = href.startsWith("#") || /^\/[^?#]*#/.test(href);
  const isDirectAction = href.startsWith("mailto:") || href.startsWith("tel:");

  if (isInternalRoute && !isInPageAnchor) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  if (isInPageAnchor || isDirectAction) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <a href={href} className={className} target="_blank" rel="noreferrer">
      {label}
    </a>
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
  asideTitle,
  asideItems,
  imageSrc = "/images/hero/Hero-Image-1.webp",
  imageAlt = "Modern business website launch workspace",
  showCodeRain = false,
  showHomeAnimations = false,
}: HeroSectionProps) {
  const [effectsReady, setEffectsReady] = useState(false);

  useEffect(() => {
    if (!showCodeRain && !showHomeAnimations) return;
    if (typeof window === "undefined") return;

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const enableEffects = () => {
      if (!cancelled) {
        setEffectsReady(true);
      }
    };

    const schedule = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(enableEffects, { timeout: 1800 });
        return;
      }

      timeoutId = setTimeout(enableEffects, 900);
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      const onLoad = () => schedule();
      window.addEventListener("load", onLoad, { once: true });
      return () => {
        cancelled = true;
        window.removeEventListener("load", onLoad);
        if (timeoutId) clearTimeout(timeoutId);
        if (idleId && "cancelIdleCallback" in window) {
          window.cancelIdleCallback(idleId);
        }
      };
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (idleId && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [showCodeRain, showHomeAnimations]);

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      {showHomeAnimations && effectsReady ? <HomeAnimations /> : null}

      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        quality={60}
        sizes="100vw"
        className="absolute inset-0 object-cover object-center opacity-55"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(16,185,129,0.18),transparent_42%),radial-gradient(circle_at_85%_0%,rgba(16,185,129,0.09),transparent_34%),linear-gradient(180deg,rgba(5,8,6,0.45)_0%,rgba(7,11,9,0.6)_56%,rgba(5,8,6,0.84)_100%)]" />
      {showCodeRain && effectsReady ? (
        <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-45">
          <CodeRain />
        </div>
      ) : null}
      <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-14 md:pt-20">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="text-center lg:text-left">
            <span className="hero-kicker inline-flex rounded-full border border-emerald-400/35 bg-emerald-500/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-emerald-100">
              {eyebrow}
            </span>

            <h1 className="hero-title mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.02em] sm:text-5xl md:text-6xl">
              {title}
            </h1>

            <p className="hero-copy mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/75 lg:mx-0 lg:text-xl">
              {description}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <div className="hero-cta w-full sm:w-auto">
                <ActionLink href={primaryHref} label={primaryLabel} primary />
              </div>
              <ActionLink href={secondaryHref} label={secondaryLabel} />
            </div>

            <p className="hero-meta mt-4 text-sm text-white/65">{trustLine}</p>

            <div className="hero-stat relative mt-8 max-w-2xl overflow-hidden rounded-2xl border border-emerald-400/30 bg-[radial-gradient(circle_at_14%_-20%,rgba(16,185,129,0.26),rgba(4,18,14,0.9)_45%,rgba(2,8,7,0.98)_100%)] p-5 text-left shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-15" />

              <div className="relative z-10">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-200">
                  [ BEST FIT ]
                </p>
                <p className="mt-2 text-sm leading-7 text-white/82">{locationNote}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/25 bg-black/45 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-white/80">
                    Nigeria
                  </span>
                  <span className="rounded-full border border-white/25 bg-black/45 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-white/80">
                    Remote
                  </span>
                  <span className="rounded-full border border-white/25 bg-black/45 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-white/80">
                    International
                  </span>
                </div>
              </div>
            </div>
          </div>

          <aside className="hero-aside relative overflow-hidden rounded-2xl border border-emerald-400/28 bg-[radial-gradient(circle_at_14%_-20%,rgba(16,185,129,0.24),rgba(4,16,13,0.9)_45%,rgba(2,8,7,0.98)_100%)] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:22px_22px] opacity-15" />

            <p className="relative z-10 font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-200/95">
              [ {asideTitle} ]
            </p>
            <ul className="mt-6 space-y-4">
              {asideItems.map((item, index) => (
                <li
                  key={item}
                  className="relative overflow-hidden rounded-xl border border-emerald-400/22 bg-black/35 shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.03)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:20px_20px] opacity-15" />
                  <div className="relative z-10 px-4 py-3">
                    <span className="inline-flex items-center rounded-md border border-white/20 bg-black/45 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-200/95">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-2 text-sm leading-6 text-white/84">{item}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
