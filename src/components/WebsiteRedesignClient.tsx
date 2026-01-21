"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import FAQAccordion from "@/components/FAQAccordion";

type Pain = "Outdated design" | "Low enquiries" | "Slow site" | "Mobile issues";

const painDetails: Record<
  Pain,
  { title: string; text: string; fixes: string[] }
> = {
  "Outdated design": {
    title: "Your site looks old — people don’t trust it",
    text: "Design is a trust signal. If your site feels outdated, visitors assume your business is outdated too — even if you’re excellent.",
    fixes: ["Modern layout + typography", "Better spacing and hierarchy", "Trust signals placed correctly"],
  },
  "Low enquiries": {
    title: "People visit… and do nothing",
    text: "This is usually a structure problem, not a traffic problem. If the message is unclear or the CTA path is weak, visitors won’t act.",
    fixes: ["Clear messaging flow", "Proof + credibility blocks", "Strong CTA placement"],
  },
  "Slow site": {
    title: "Your site is slow — visitors bounce",
    text: "Speed affects conversions. If your site loads slowly on mobile, you’re bleeding potential customers without knowing it.",
    fixes: ["Image + asset optimisation", "Performance pass", "Cleaner page build"],
  },
  "Mobile issues": {
    title: "Mobile experience is broken or clumsy",
    text: "Most traffic is mobile. If your mobile experience is frustrating, your site loses trust and leads instantly.",
    fixes: ["Mobile-first layout", "Tap-friendly UI", "Clear scroll structure"],
  },
};

export default function WebsiteRedesignClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [pain, setPain] = useState<Pain>("Outdated design");

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

    // Small transition on interactive panel change
    gsap.fromTo(
      ".pain-panel",
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [pain]);

  const p = painDetails[pain];

  return (
    <div ref={pageRef} className="bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm tracking-[0.25em] text-white/50">
                WEBSITE REDESIGN
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                Upgrade your website into a modern, trust-building machine.
              </h1>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                If your site feels outdated, slow, or doesn’t convert, a redesign
                isn’t “cosmetic” — it’s business. We redesign websites with better
                structure, stronger trust, and cleaner conversion flow.
              </p>

              <div className="mt-10 flex gap-3 flex-col sm:flex-row">
                <a
                  href="/contact?service=Website Redesign"
                  className="rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white text-center hover:bg-emerald-500 transition"
                >
                  Request a Quote
                </a>
                <a
                  href="/portfolio"
                  className="rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-sm font-semibold text-white/90 text-center hover:bg-black/50 transition"
                >
                  View Portfolio
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

      {/* COMMON PAINS (INTERACTIVE) */}
      <section data-reveal=".pain" className="py-24 bg-gray-950">
        <div className="pain mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="DIAGNOSIS"
            title="What’s wrong with your current site?"
            description="Pick the problem that feels most accurate. This is how we approach redesign — by fixing what’s actually broken."
          />

          <div className="mt-10 flex flex-wrap gap-2">
            {(["Outdated design", "Low enquiries", "Slow site", "Mobile issues"] as Pain[]).map(
              (x) => {
                const active = x === pain;
                return (
                  <button
                    key={x}
                    type="button"
                    onClick={() => setPain(x)}
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

          <div className="pain-panel mt-8 grid gap-6 md:grid-cols-2 md:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-7">
              <h3 className="text-2xl font-semibold">{p.title}</h3>
              <p className="mt-3 text-white/70 leading-relaxed">{p.text}</p>

              <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-5">
                <div className="text-sm font-semibold text-white/85">What we fix</div>
                <ul className="mt-3 space-y-2 text-sm text-white/65">
                  {p.fixes.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="/contact?service=Website Redesign"
                className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Request a Redesign Quote
              </a>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[420px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: "url(/images/placeholder.jpg)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/55 p-4 text-sm text-white/70">
                Placeholder image: before/after redesign comparison.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section data-reveal=".process" className="py-24">
        <div className="process mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="PROCESS"
            title="How redesign works"
            description="We don’t randomly “freshen it up.” We redesign with intent."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              ["Audit", "We review what’s broken: message, UX, speed, trust, structure."],
              ["Plan", "We restructure sections and conversion flow around your goals."],
              ["Redesign", "We rebuild the UI with modern layout, hierarchy, and proof."],
              ["Launch", "We polish, test, and launch with performance checks."],
            ].map(([t, d]) => (
              <div
                key={t}
                className="rounded-2xl border border-white/10 bg-black/40 p-7"
              >
                <h3 className="text-xl font-semibold">{t}</h3>
                <p className="mt-3 text-white/65">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section data-reveal=".deliverables" className="py-24 bg-gray-950">
        <div className="deliverables mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="DELIVERABLES"
            title="What’s included"
            description="Redesign is more than looks. It’s structure and performance."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Modern UI refresh", "Cleaner layout, better typography, modern spacing."],
              ["Clear messaging flow", "Sections that explain and persuade faster."],
              ["Trust signals", "Proof, testimonials, and credibility placed correctly."],
              ["Mobile-first improvements", "Better mobile layout and tap-friendly UX."],
              ["Speed improvements", "Optimised assets and performance cleanup."],
              ["Conversion-focused CTAs", "Stronger next-step guidance for visitors."],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-black/40 p-7"
              >
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-white/65">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section data-reveal=".faq" className="py-24">
        <div className="faq mx-auto max-w-4xl px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions"
            description="Quick answers before you request a quote."
          />

          <FAQAccordion
            items={[
              {
                question: "Do I need a redesign or just optimisation?",
                answer:
                  "If the structure and UI are outdated or confusing, redesign is better. If the site looks fine but feels slow, optimisation might be enough. We can advise quickly.",
              },
              {
                question: "Can you keep my existing content and brand?",
                answer:
                  "Yes. We can keep what still works and rebuild what doesn’t. Redesign is about improvement, not throwing everything away.",
              },
              {
                question: "Will a redesign affect my SEO?",
                answer:
                  "Handled properly, redesign can improve SEO. We keep structure clean, preserve important pages, and maintain SEO foundations.",
              },
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-950">
        <div className="mx-auto max-w-6xl px-6">
          <CTASection
            eyebrow="READY"
            title="Let’s rebuild your website the right way"
            description="If your website looks old, loads slowly, or doesn’t convert, we’ll redesign it with clarity and performance."
            primaryCtaText="Request a Quote"
            primaryHref="/contact?service=Website Redesign"
            secondaryCtaText="View Services"
            secondaryHref="/services"
            imageUrl="/images/placeholder.jpg"
          />
        </div>
      </section>
    </div>
  );
}
