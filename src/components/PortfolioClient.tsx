"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CTASection from "@/components/CTASection";
import CaseStudyCard from "@/components/CaseStudyCard";
import SectionHeading from "@/components/SectionHeading";
import { portfolioCases, type PortfolioCase } from "@/lib/portfolioCases";

type Filter = "All" | PortfolioCase["type"];

const filterLabels: Record<Filter, string> = {
  All: "All Work",
  "Business Sites": "Service Websites",
  "Landing Pages": "Landing Pages",
  Redesign: "Rebuilds",
  "E-commerce": "E-commerce",
  "Product Sites": "Product Websites",
};

const proofCards = [
  {
    title: "Conversion architecture",
    text: "Clearer offer hierarchy, stronger calls to action, and cleaner booking or buying paths so the next step feels obvious.",
  },
  {
    title: "Performance-first execution",
    text: "Lighter frontend decisions, stronger mobile presentation, and cleaner page structure that help the site feel faster and more trustworthy.",
  },
  {
    title: "Proof you can actually inspect",
    text: "Each cover image is built from real desktop, tablet, and mobile screenshots so the portfolio shows the sites as they actually appear across devices.",
  },
] as const;

export default function PortfolioClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [filter, setFilter] = useState<Filter>("All");

  const filters = useMemo(
    () => ["All", ...new Set(portfolioCases.map((item) => item.type))] as Filter[],
    []
  );

  const filteredCases = useMemo(() => {
    if (filter === "All") return portfolioCases;
    return portfolioCases.filter((item) => item.type === filter);
  }, [filter]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const root = pageRef.current;
    if (!root) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-portfolio-hero]",
        { opacity: 0, y: 40, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.95, ease: "power3.out" }
      );

      gsap.utils.toArray<HTMLElement>("[data-portfolio-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 56, scale: 0.985, filter: "blur(8px)" },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 78%",
            },
          }
        );
      });
    }, root);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [filter]);

  return (
    <div ref={pageRef} className="bg-black text-white">
      <section className="relative overflow-hidden border-b border-white/10 py-24 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div data-portfolio-hero className="relative z-10">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">
              Portfolio
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-6xl">
              Selected website projects presented with real responsive proof
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              Explore selected website builds, redesign work, ecommerce presentation,
              landing-page thinking, and product-focused interfaces using real
              screenshot composites taken from the live websites themselves.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-sm text-white/70">
              <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                Live projects
              </span>
              <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                Desktop, tablet, and mobile views
              </span>
              <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                Cross-industry website proof
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-7 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Request a Website Review
              </Link>
              <Link
                href="/launch"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-black/30 px-7 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
              >
                See the Launch Package
              </Link>
            </div>
          </div>

          <div data-portfolio-hero className="relative z-10">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/images/portfolio/jluxe-cover.webp"
                  alt="J Luxe Medical Aesthetics responsive project preview"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-portfolio-reveal className="border-b border-white/10 bg-[#060907] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <SectionHeading
              eyebrow="Filter the proof"
              title="Browse by business model and build type"
              description="Sort the work by the kind of website you care about. Each card now shows a real screenshot-based cover and a clearer summary of what the site is built to do."
              level="h2"
              align="left"
            />
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {filters.map((option) => {
              const active = option === filter;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-emerald-600 text-white"
                      : "border border-white/10 bg-black/40 text-white/70 hover:border-white/20 hover:text-white",
                  ].join(" ")}
                >
                  {filterLabels[option]}
                </button>
              );
            })}
          </div>

          <div className="mt-12 grid gap-7 md:auto-rows-fr md:grid-cols-3">
            {filteredCases.map((item) => (
              <div key={item.title} className="flex h-full min-h-0 flex-col">
                <CaseStudyCard
                  title={item.title}
                  client={item.client}
                  eyebrow={item.industry}
                  status={item.status}
                  summary={item.summary}
                  results={item.results}
                  imageUrl={item.imageUrl}
                  imageAlt={item.imageAlt}
                  href={item.liveUrl}
                  className="shrink-0"
                />

                <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
                  <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-200/90">
                      What the site is for
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/72">{item.purpose}</p>
                  </div>

                  <p className="mt-4 text-sm font-semibold text-white/86">What to notice</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">{item.whatToNotice}</p>

                  <p className="mt-4 text-sm font-semibold text-white/86">Build focus</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-white/68">
                    {item.stack.map((detail) => (
                      <li key={detail} className="flex gap-3">
                        <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-white/72"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 sm:mt-auto sm:grid-cols-2">
                    <a
                      href={item.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    >
                      View Live Site
                    </a>
                    <Link
                      href={`/contact?project=${encodeURIComponent(item.client)}`}
                      className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
                    >
                      Ask About Similar Work
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCases.length === 0 ? (
            <div className="mt-16 rounded-3xl border border-white/10 bg-black/40 p-10 text-white/70">
              No projects match this filter yet. Clear the filter to see the current work.
            </div>
          ) : null}
        </div>
      </section>

      <section data-portfolio-reveal className="border-b border-white/10 bg-black py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {proofCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-white/10 bg-black/40 p-7 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur"
              >
                <h2 className="text-xl font-semibold text-white">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/66">{card.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-14">
            <CTASection
              eyebrow="Next step"
              title="Need this level of execution on your own website?"
              description="If the current site still feels generic, slow, or underpowered, request a website review and get a direct answer on the next step that would move the business forward."
              primaryCtaText="Request a Website Review"
              primaryHref="/contact"
              secondaryCtaText="See Package Options"
              secondaryHref="/pricing"
              imageUrl="/images/portfolio/treats-by-ann-cover.webp"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
