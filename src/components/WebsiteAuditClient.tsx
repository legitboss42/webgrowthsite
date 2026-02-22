"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import FAQAccordion from "@/components/FAQAccordion";

type AuditFocus = "Clarity" | "Trust" | "Conversion Flow" | "SEO Basics" | "Performance";

const focusMap: Record<
  AuditFocus,
  { title: string; text: string; checks: string[]; outputs: string[] }
> = {
  Clarity: {
    title: "Clarity Audit",
    text: "If visitors don’t understand what you do quickly, they bounce. We check messaging, hierarchy, and how clearly the offer is communicated.",
    checks: ["Above-the-fold message", "Section hierarchy", "Service explanation", "Navigation clarity"],
    outputs: ["Rewrite recommendations", "Section restructuring plan", "Improved page flow"],
  },
  Trust: {
    title: "Trust Audit",
    text: "Even if your offer is good, people won’t act if they don’t trust the business. We check credibility signals and proof placement.",
    checks: ["Testimonials + proof", "Visual quality", "Policy clarity", "Contact credibility"],
    outputs: ["Trust block plan", "Proof placement recommendations", "Credibility checklist"],
  },
  "Conversion Flow": {
    title: "Conversion Flow Audit",
    text: "This checks whether your website has a clear path to action: enquiry, booking, purchase, or signup - and removes friction.",
    checks: ["CTA clarity", "CTA placement", "Forms friction", "Page distractions"],
    outputs: ["CTA improvement plan", "Friction removal checklist", "Conversion path map"],
  },
  "SEO Basics": {
    title: "SEO Foundations Audit",
    text: "We review the basics that stop your site from competing: structure, titles, metadata, internal links, and indexability issues.",
    checks: ["Page titles + meta", "Heading structure", "Internal links", "Indexing blockers"],
    outputs: ["SEO basics checklist", "Metadata fixes", "Structure improvements"],
  },
  Performance: {
    title: "Performance Audit",
    text: "We diagnose what makes your website slow or unstable and produce a practical plan to improve speed and Core Web Vitals.",
    checks: ["Image weight", "Script bloat", "Caching", "Core Web Vitals indicators"],
    outputs: ["Performance fix plan", "Top bottlenecks list", "Quick wins + deeper fixes"],
  },
};

export default function WebsiteAuditClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [focus, setFocus] = useState<AuditFocus>("Clarity");

  const faqs = useMemo(
    () => [
      {
        question: "What do I get after the audit?",
        answer:
          "You get a clear diagnosis and a practical plan: what to fix first, what to improve next, and what will move results most.",
      },
      {
        question: "Do you fix issues after the audit?",
        answer:
          "Yes. Many clients use the audit as a starting point for redesign, performance optimisation, or a structured rebuild.",
      },
      {
        question: "Is this useful if I’m not technical?",
        answer:
          "Yes. We translate technical issues into business impact and clear next actions.",
      },
      {
        question: "Can you audit WordPress, Divi, or custom sites?",
        answer:
          "Yes. The audit focuses on user experience, performance, and structure - regardless of platform.",
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
      ".focus-panel",
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [focus]);

  const f = focusMap[focus];

  return (
    <div ref={pageRef} className="bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm tracking-[0.25em] text-white/50">
                WEBSITE AUDIT & CONSULTATION
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                Get a clear diagnosis - and a plan that actually fixes things.
              </h1>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                If your website isn’t getting enquiries, isn’t ranking, or feels slow,
                you don’t need guesses - you need a diagnosis. We audit your website
                and give you a practical plan to improve results.
              </p>

              <div className="mt-10 flex gap-3 flex-col sm:flex-row">
                <a
                  href="/contact?service=Website Audit & Consultation"
                  className="rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white text-center hover:bg-emerald-500 transition"
                >
                  Request an Audit
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
                style={{ backgroundImage: "url(/images/services/services-audit.webp)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE FOCUS */}
      <section data-reveal=".focus" className="py-24 bg-gray-950">
        <div className="focus mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="FOCUS AREAS"
            title="What should we audit first?"
            description="Pick the focus area that feels most relevant. The audit covers everything, but this shows what we look for."
          />

          <div className="mt-10 flex flex-wrap gap-2">
            {(["Clarity", "Trust", "Conversion Flow", "SEO Basics", "Performance"] as AuditFocus[]).map(
              (x) => {
                const active = x === focus;
                return (
                  <button
                    key={x}
                    type="button"
                    onClick={() => setFocus(x)}
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

          <div className="focus-panel mt-8 grid gap-6 md:grid-cols-2 md:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-7">
              <h3 className="text-2xl font-semibold">{f.title}</h3>
              <p className="mt-3 text-white/70 leading-relaxed">{f.text}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/30 p-5">
                  <div className="text-sm font-semibold text-white/85">What we check</div>
                  <ul className="mt-3 space-y-2 text-sm text-white/65">
                    {f.checks.map((c) => (
                      <li key={c} className="flex gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-5">
                  <div className="text-sm font-semibold text-white/85">What you get</div>
                  <ul className="mt-3 space-y-2 text-sm text-white/65">
                    {f.outputs.map((o) => (
                      <li key={o} className="flex gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <a
                href="/contact?service=Website Audit & Consultation"
                className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Request an Audit Quote
              </a>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[420px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: "url(/images/services/services-audit-2.webp)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          </div>
        </div>
      </section>

      {/* WHAT HAPPENS NEXT */}
      <section data-reveal=".next" className="py-24">
        <div className="next mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="AFTER THE AUDIT"
            title="What happens next?"
            description="An audit is only valuable if it turns into action."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              ["Diagnosis", "We identify what’s blocking results and why."],
              ["Priorities", "We rank fixes: quick wins first, deeper fixes next."],
              ["Plan", "You get a step-by-step improvement plan."],
              ["Implementation", "We can apply the fixes or you can take the plan to your team."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-black/40 p-7">
                <h3 className="text-xl font-semibold">{t}</h3>
                <p className="mt-3 text-white/65">{d}</p>
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
            description="Quick answers before you request an audit."
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
            title="Stop guessing. Get a real diagnosis."
            description="If your website isn’t performing, we’ll show you exactly what’s wrong - and what to fix first."
            primaryCtaText="Request an Audit"
            primaryHref="/contact?service=Website Audit & Consultation"
            secondaryCtaText="View Portfolio"
            secondaryHref="/portfolio"
            imageUrl="/images/services/services-cta.webp"
          />
        </div>
      </section>
    </div>
  );
}


