"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SectionHeading from "@/components/SectionHeading";
import CaseStudyCard from "@/components/CaseStudyCard";
import CTASection from "@/components/CTASection";

type Filter = "All" | "Business Sites" | "Landing Pages" | "Redesign" | "E-commerce";

type CaseStudy = {
  title: string;
  client: string;
  type: Exclude<Filter, "All">;
  summary: string;
  results: string[];
  stack: string[];
  imageUrl: string;
};

export default function PortfolioClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLElement | null>(null);
  const proofRef = useRef<HTMLElement | null>(null);

  const [filter, setFilter] = useState<Filter>("All");

  const cases: CaseStudy[] = useMemo(
    () => [
      {
        title: "Clinic Website Refresh",
        client: "Aesthetic Clinic",
        type: "Redesign",
        summary:
          "Rebuilt the layout for trust, improved mobile experience, and refined the booking flow so visitors know exactly what to do next.",
        results: ["Improved clarity", "Better mobile UX", "Stronger conversion flow"],
        stack: ["Design System", "Performance Pass", "SEO-ready structure"],
        imageUrl: "/images/portfolio/portfolio-1.webp",
      },
      {
        title: "Campaign Landing Page",
        client: "Service Business",
        type: "Landing Pages",
        summary:
          "Created a focused landing page built around one goal: leads. Tight messaging, strong hierarchy, and fast load speed.",
        results: ["Higher intent clicks", "Cleaner messaging", "Fast load time"],
        stack: ["Landing Page UX", "CTA strategy", "Speed optimization"],
        imageUrl: "/images/portfolio/portfolio-2.webp",
      },
      {
        title: "Business Website Build",
        client: "Professional Brand",
        type: "Business Sites",
        summary:
          "Designed a modern business website that communicates value quickly and positions the brand as credible and premium.",
        results: ["Premium look", "Clear sections", "Better trust signals"],
        stack: ["Information architecture", "Copy structure", "Mobile-first"],
        imageUrl: "/images/portfolio/portfolio-5.webp",
      },
      {
        title: "Small Store Setup",
        client: "Retail Brand",
        type: "E-commerce",
        summary:
          "Planned a clean store structure, simplified product pages, and a checkout flow designed to reduce hesitation.",
        results: ["Cleaner product UX", "Better structure", "Trust-first checkout"],
        stack: ["Store structure", "Product page UX", "Checkout flow"],
        imageUrl: "/images/portfolio/portfolio-6.webp",
      },
      {
        title: "Service Website Upgrade",
        client: "Local Business",
        type: "Redesign",
        summary:
          "Updated an outdated site into a modern layout with stronger proof and clearer CTAs - without bloating the experience.",
        results: ["Modern UI", "Stronger proof", "Clear CTA flow"],
        stack: ["UI refresh", "Trust signals", "CTA placement"],
        imageUrl: "/images/portfolio/portfolio-7.webp",
      },
      {
        title: "Offer Landing Page",
        client: "Consultant",
        type: "Landing Pages",
        summary:
          "Built a landing page for a specific offer with a direct conversion path and minimal distraction.",
        results: ["Focused message", "Simple flow", "Lead-ready"],
        stack: ["Offer positioning", "CTA flow", "Mobile-first"],
        imageUrl: "/images/portfolio/portfolio-8.webp",
      },
    ],
    []
  );

  const filters: Filter[] = ["All", "Business Sites", "Landing Pages", "Redesign", "E-commerce"];

  const filtered = useMemo(() => {
    if (filter === "All") return cases;
    return cases.filter((c) => c.type === filter);
  }, [cases, filter]);

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
                Work that looks premium and performs with purpose.
              </h1>
              <p className="mt-6 text-white/70 leading-relaxed text-lg">
                These case studies show the type of outcomes we build for: clarity,
                trust, conversion flow, and speed. Replace placeholders with real
                projects as you complete them.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Request a Quote
                </a>
                <a
                  href="/services"
                  className="inline-flex items-center justify-center rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-black/50"
                >
                  View Services
                </a>
              </div>
            </div>

            {/* Image placeholder */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[320px] md:h-[420px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: "url(/images/portfolio/portfolio-hero.webp)" }}
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
              eyebrow="CASE STUDIES"
              title="Browse by project type"
              description="Filter to see the kind of build you need. Each card is a placeholder until you replace it with real projects."
            />
          </div>

          {/* Filters (interactive) */}
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

          {/* Cards */}
          <div className="mt-12 grid gap-7 md:grid-cols-3">
            {filtered.map((c) => (
              <div key={c.title} className="portfolio-card">
                <CaseStudyCard
                  title={c.title}
                  client={c.client}
                  summary={c.summary}
                  results={c.results}
                  imageUrl={c.imageUrl}
                  href="/contact"
                />

                {/* Extra details block for credibility */}
                <div className="mt-4 rounded-xl border border-white/10 bg-black/30 backdrop-blur px-5 py-4">
                  <div className="text-sm font-semibold text-white/85">What was included</div>
                  <ul className="mt-3 space-y-2 text-sm text-white/65">
                    {c.stack.map((s) => (
                      <li key={s} className="flex gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href="/contact"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Request a Quote
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="mt-16 rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-10 text-white/70">
              No projects in this category yet. Add a case study here when ready.
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
                title: "Clarity",
                text: "Visitors should understand what you do in seconds - that’s where conversions start.",
              },
              {
                title: "Trust",
                text: "Proof, structure, and good UX make people comfortable enough to reach out or buy.",
              },
              {
                title: "Performance",
                text: "Slow sites lose money. We build fast experiences that don’t frustrate users.",
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
              title="Want results like this? Let’s scope your project."
              description="Tell us what you do and what you need. We’ll recommend the best approach and send a clear proposal."
              primaryCtaText="Request a Quote"
              primaryHref="/contact"
              secondaryCtaText="View Pricing"
              secondaryHref="/pricing"
              imageUrl="/images/portfolio/portfolio-cta-2.webp"
            />
          </div>
        </div>
      </section>
    </div>
  );
}


