"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import FAQAccordion from "@/components/FAQAccordion";

type Symptom =
  | "Slow loading"
  | "Poor mobile experience"
  | "Low Google scores"
  | "High bounce rate";

const symptomDetails: Record<
  Symptom,
  { title: string; text: string; causes: string[]; fixes: string[] }
> = {
  "Slow loading": {
    title: "Your site loads slowly — people leave",
    text: "Speed is not a “nice to have.” Slow load time kills intent and trust, especially on mobile networks.",
    causes: ["Huge images", "Too many scripts", "Heavy page builder output", "No caching"],
    fixes: ["Image compression + correct sizing", "Script cleanup", "Caching + CDN strategy", "Performance pass per page"],
  },
  "Poor mobile experience": {
    title: "Mobile feels heavy or laggy",
    text: "Even if it loads, a laggy experience makes users abandon. Performance includes smoothness, not just load time.",
    causes: ["Unoptimized animations", "Layout shifts", "Too much DOM", "Render-blocking assets"],
    fixes: ["Reduce layout shifts", "Defer non-critical assets", "Smooth scroll performance pass", "Interaction tuning"],
  },
  "Low Google scores": {
    title: "PageSpeed Insights scores are bad",
    text: "Google scores reflect user experience signals. We focus on real improvements that matter: Core Web Vitals.",
    causes: ["Poor LCP", "Bad CLS", "High INP", "No resource prioritization"],
    fixes: ["Improve LCP assets", "Fix layout stability (CLS)", "Reduce interaction delays (INP)", "Optimize loading order"],
  },
  "High bounce rate": {
    title: "People bounce quickly",
    text: "Bounce is often caused by slow load, poor mobile UX, or confusing layout. Fixing performance helps conversions.",
    causes: ["Slow load", "Clunky mobile UX", "Heavy hero sections", "Unclear structure"],
    fixes: ["Speed pass + mobile fixes", "Clean section structure", "Reduce heavy assets", "Improve CTA flow"],
  },
};

export default function PerformanceOptimisationClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [symptom, setSymptom] = useState<Symptom>("Slow loading");

  const faqs = useMemo(
    () => [
      {
        question: "Will optimisation change my website design?",
        answer:
          "We aim to keep the look the same while making it faster. If specific sections are too heavy, we’ll recommend small design adjustments that improve speed without ruining the style.",
      },
      {
        question: "How do you measure improvements?",
        answer:
          "We benchmark key pages before and after. We look at real-world impact (load speed, smoothness) and key vitals like LCP, CLS, and INP.",
      },
      {
        question: "Can you optimise WordPress and page builder sites?",
        answer:
          "Yes. Many slow sites are built with page builders. Optimisation is often about cleaning assets, images, caching, and structure.",
      },
      {
        question: "Do you guarantee a specific Google score?",
        answer:
          "No — that’s fake marketing. Scores vary by device, network, and page complexity. We focus on meaningful improvements that users feel.",
      },
    ],
    []
  );

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    const reveal = (selector: string, trigger: Element, stagger = 0) => {
      gsap.fromTo(
        selector,
        { opacity: 0, y: 80, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          stagger,
          scrollTrigger: { trigger, start: "top 75%" },
        }
      );
    };

    const root = pageRef.current;
    if (!root) return;

    root.querySelectorAll("[data-reveal]").forEach((el) => {
      const cls = (el as HTMLElement).dataset.reveal!;
      reveal(cls, el);
    });

    gsap.fromTo(
      ".symptom-panel",
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [symptom]);

  const s = symptomDetails[symptom];

  return (
    <div ref={pageRef} className="bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm tracking-[0.25em] text-white/50">
                SPEED & PERFORMANCE OPTIMISATION
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                Make your website faster — and stop losing customers.
              </h1>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                Slow sites lose money quietly. We optimise speed and performance
                so your website loads fast, feels smooth, and converts better —
                especially on mobile.
              </p>

              <div className="mt-10 flex gap-3 flex-col sm:flex-row">
                <a
                  href="/contact?service=Speed & Performance Optimisation"
                  className="rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white text-center hover:bg-emerald-500 transition"
                >
                  Request a Quote
                </a>
                <a
                  href="/services"
                  className="rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-sm font-semibold text-white/90 text-center hover:bg-black/50 transition"
                >
                  View Services
                </a>
              </div>
            </div>

            {/* Image placeholder */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[360px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: "url(/images/placeholder.jpg)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          </div>
        </div>
      </section>

      {/* SYMPTOMS (INTERACTIVE) */}
      <section data-reveal=".symptoms" className="py-24 bg-gray-950">
        <div className="symptoms mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="DIAGNOSIS"
            title="What symptom are you seeing?"
            description="Pick what you’re dealing with. We’ll fix the cause — not just the surface."
          />

          <div className="mt-10 flex flex-wrap gap-2">
            {(["Slow loading", "Poor mobile experience", "Low Google scores", "High bounce rate"] as Symptom[]).map(
              (x) => {
                const active = x === symptom;
                return (
                  <button
                    key={x}
                    type="button"
                    onClick={() => setSymptom(x)}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "bg-emerald-600 text-white"
                        : "bg-black/40 text-white/70 border border-white/10 hover:text-white hover:border-white/20",
                    ].join(" ")}
                  >
                    {x}
                  </button>
                );
              }
            )}
          </div>

          <div className="symptom-panel mt-8 grid gap-6 md:grid-cols-2 md:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-7">
              <h3 className="text-2xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-white/70 leading-relaxed">{s.text}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/30 p-5">
                  <div className="text-sm font-semibold text-white/85">Common causes</div>
                  <ul className="mt-3 space-y-2 text-sm text-white/65">
                    {s.causes.map((c) => (
                      <li key={c} className="flex gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-5">
                  <div className="text-sm font-semibold text-white/85">What we fix</div>
                  <ul className="mt-3 space-y-2 text-sm text-white/65">
                    {s.fixes.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <a
                href="/contact?service=Speed & Performance Optimisation"
                className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Request Optimisation Quote
              </a>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[420px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: "url(/images/placeholder.jpg)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/55 p-4 text-sm text-white/70">
                Placeholder image: speed report / performance graph / Lighthouse view.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section data-reveal=".deliverables" className="py-24">
        <div className="deliverables mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="DELIVERABLES"
            title="What’s included"
            description="Performance work should be practical and measurable."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Performance audit", "We benchmark key pages and identify bottlenecks."],
              ["Image optimisation", "Correct sizing, compression, and modern formats."],
              ["Script + asset cleanup", "Remove unnecessary load and defer non-critical scripts."],
              ["Caching strategy", "Improve repeat visits and reduce server load."],
              ["Core Web Vitals focus", "Improve the vitals that affect real UX and SEO."],
              ["Before/After notes", "Clear summary of what changed and why it helps."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-black/40 p-7">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-white/65">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section data-reveal=".faq" className="py-24 bg-gray-950">
        <div className="faq mx-auto max-w-4xl px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions"
            description="Quick answers before you request a quote."
          />
          <div className="mt-10">
            <FAQAccordion items={faqs} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <CTASection
            eyebrow="READY"
            title="Speed is profit. Let’s fix your website properly."
            description="If your website feels slow, you’re losing customers. We’ll optimise it with real, measurable improvements."
            primaryCtaText="Request a Quote"
            primaryHref="/contact?service=Speed & Performance Optimisation"
            secondaryCtaText="View Services"
            secondaryHref="/services"
            imageUrl="/images/placeholder.jpg"
          />
        </div>
      </section>
    </div>
  );
}
