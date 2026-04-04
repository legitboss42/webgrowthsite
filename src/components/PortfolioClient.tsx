"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SectionHeading from "@/components/SectionHeading";
import CaseStudyCard from "@/components/CaseStudyCard";
import CTASection from "@/components/CTASection";
import { portfolioCases, type PortfolioCase } from "@/lib/portfolioCases";

type Filter = "All" | PortfolioCase["type"];

export default function PortfolioClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLElement | null>(null);
  const proofRef = useRef<HTMLElement | null>(null);

  const [filter, setFilter] = useState<Filter>("All");

  const filters = useMemo(
    () => ["All", ...new Set(portfolioCases.map((item) => item.type))] as Filter[],
    []
  );

  const filtered = useMemo(() => {
    if (filter === "All") return portfolioCases;
    return portfolioCases.filter((c) => c.type === filter);
  }, [filter]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    const root = pageRef.current;
    if (!root) return;

    // Hero entrance
    gsap.fromTo(
      ".portfolio-hero",
      { opacity: 0, y: 70, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.0, ease: "power3.out" }
    );

    const reveal = (selector: string, trigger: Element, stagger = 0) => {
      gsap.fromTo(
        selector,
        { opacity: 0, y: 90, scale: 0.985, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          stagger,
          scrollTrigger: {
            trigger,
            start: "top 75%",
          },
        }
      );
    };

    if (gridRef.current) {
      reveal(".portfolio-head", gridRef.current, 0);
      reveal(".portfolio-card", gridRef.current, 0.12);
    }

    if (proofRef.current) {
      reveal(".proof-block", proofRef.current, 0.10);
    }

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [filter]);

  return (
    <div ref={pageRef} className="bg-black text-white">
      {/* HERO */}
      <section ref={heroRef} className="portfolio-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm tracking-[0.25em] text-white/50">PORTFOLIO</div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                Real website work, plus one proposal worth showing.
              </h1>
              <p className="mt-6 text-white/70 leading-relaxed text-lg">
                This is a small, curated selection of shipped client work plus one
                clearly labeled proposal. The goal is not to fake volume. The goal
                is to show the level of clarity, trust, and conversion structure you
                can expect when the work is done properly.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/70">
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                  3 live projects
                </span>
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                  1 clearly labeled proposal
                </span>
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                  Built for trust and enquiries
                </span>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Get My Website Quote
                </a>
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-black/50"
                >
                  See Pricing
                </a>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[320px] md:h-[420px] bg-cover bg-center opacity-80"
                style={{
                  backgroundImage: "url(/images/portfolio/tlc-interiors-desktop.jpg)",
                }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section ref={gridRef} className="bg-gray-950 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="portfolio-head max-w-2xl">
            <SectionHeading
              eyebrow="REAL PROJECTS"
              title="Browse shipped work and the iFitness proposal by project type"
              description="Use the filters to review the kind of build you need. Live projects are marked as live, and the iFitness concept is marked clearly as a proposal."
            />
          </div>

          <div className="portfolio-head mt-10 flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = f === filter;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-emerald-600 text-white"
                      : "bg-black/40 text-white/70 border border-white/10 hover:text-white hover:border-white/20",
                  ].join(" ")}
                >
                  {f}
                </button>
              );
            })}
          </div>

          <div className="mt-12 grid gap-7 md:auto-rows-fr md:grid-cols-3">
            {filtered.map((c) => (
              <div key={c.title} className="portfolio-card flex h-full min-h-0 flex-col">
                <CaseStudyCard
                  title={c.title}
                  client={c.client}
                  status={c.status}
                  summary={c.summary}
                  results={c.results}
                  imageUrl={c.imageUrl}
                  imageAlt={c.imageAlt}
                  href={c.liveUrl}
                  className="shrink-0"
                />

                <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-xl border border-white/10 bg-black/30 px-5 py-4 backdrop-blur">
                  {c.status === "Proposal" ? (
                    <div className="mb-4 rounded-xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
                      This is a proposal concept, not shipped client work. It is shown here because the conversion structure and page direction are worth reviewing.
                    </div>
                  ) : null}
                  <div className="text-sm font-semibold text-white/85">What was included</div>
                  <ul className="mt-3 space-y-2 text-sm text-white/65">
                    {c.stack.map((s) => (
                      <li key={s} className="flex gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 grid gap-3 sm:mt-auto sm:grid-cols-2">
                    <a
                      href={c.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                      {c.status === "Proposal" ? "View Proposal Preview" : "View Live Site"}
                    </a>
                    <a
                      href={`/contact?project=${encodeURIComponent(c.client)}`}
                      className="inline-flex w-full items-center justify-center rounded-md border border-white/15 bg-black/35 px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-black/50"
                    >
                      Request Similar Build
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="mt-16 rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-10 text-white/70">
              No live projects match this filter yet. Clear the filter to see the
              current launches.
            </div>
          )}
        </div>
      </section>

      {/* PROOF / CTA */}
      <section ref={proofRef} className="py-24 bg-black">
        <div className="mx-auto max-w-6xl px-6">
          <div className="proof-block grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Clear positioning",
                text: "The strongest projects make the offer understandable fast instead of forcing buyers to decode the page.",
              },
              {
                title: "Mobile trust",
                text: "A polished desktop layout is not enough. These builds are structured to feel credible on phones where most visitors first judge the business.",
              },
              {
                title: "Stronger action",
                text: "The layout, hierarchy, and CTA flow are there to move the right visitor toward an enquiry, booking, or purchase.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-7"
              >
                <h3 className="text-xl font-semibold">{p.title}</h3>
                <p className="mt-3 text-white/65 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>

          <div className="proof-block mt-14">
            <CTASection
              eyebrow="NEXT STEP"
              title="Want a website that feels this clear before you start sending traffic?"
              description="If your current site still looks generic, slow, or vague, start with a quote request and we will map the fastest fix."
              primaryCtaText="Get My Website Quote"
              primaryHref="/contact"
              secondaryCtaText="See Pricing"
              secondaryHref="/pricing"
              imageUrl="/images/portfolio/portfolio-cta-2.webp"
            />
          </div>
        </div>
      </section>
    </div>
  );
}


