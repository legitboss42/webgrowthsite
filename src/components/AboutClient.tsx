"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import FAQAccordion from "@/components/FAQAccordion";

type ValueItem = {
  title: string;
  text: string;
  icon: "strategy" | "design" | "performance";
};

const values: ValueItem[] = [
  {
    title: "Strategy first",
    text: "We don’t start with colours. We start with outcomes. Your site is structured around what matters: enquiries, bookings, credibility, or sales, not vanity.",
    icon: "strategy",
  },
  {
    title: "Design that converts",
    text: "Clean hierarchy, persuasive sections, and intentional interaction. Visitors should understand you fast and feel confident taking the next step.",
    icon: "design",
  },
  {
    title: "Performance that holds",
    text: "Fast loads, mobile-first layouts, and a build that won’t collapse the moment you want to expand. A website should scale with your business.",
    icon: "performance",
  },
];

const faqs = [
  {
    question: "What makes Web Growth different from a typical “web designer”?",
    answer:
      "Most designers focus on visuals alone. We focus on outcomes: structure, clarity, performance, and trust. A website can look nice and still fail, we build for results.",
  },
  {
    question: "Do you build with WordPress or custom code?",
    answer:
      "We can do both. For speed and flexibility, WordPress works well for many businesses. For advanced interaction, performance, and a premium feel, a custom build (like this Next.js site) is ideal.",
  },
  {
    question: "Can you redesign my existing website without starting from scratch?",
    answer:
      "Yes. Redesign can mean improving structure, speed, messaging, and conversion flow while keeping what still works. We’ll assess what to keep, what to rebuild, and what to remove.",
  },
  {
    question: "How long does a typical project take?",
    answer:
      "It depends on scope. A focused landing page is faster than a full business site with multiple sections and assets. We’ll give clear milestones after discovery.",
  },
];

function Icon({ kind }: { kind: ValueItem["icon"] }) {
  const common = "h-5 w-5 text-emerald-400";
  if (kind === "strategy")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 19V5m0 0h10l-2 3 2 3H4Zm12 0h4M16 7h4M16 11h4M16 15h4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (kind === "design")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7h16M4 12h10M4 17h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M18 10l2 2-6 6H12v-2l6-6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 17l5-6 4 3 7-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 19h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AboutClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);

  const [activeStep, setActiveStep] = useState(0);

  const steps = useMemo(
    () => [
      {
        title: "Discovery",
        text: "We get clear on your audience, your offer, and what success looks like. No guesswork. No “just vibes.”",
        img: "/images/about/about-discovery.webp",
      },
      {
        title: "Structure",
        text: "We plan the sections, messaging hierarchy, and conversion flow so the site actually guides visitors.",
        img: "/images/about/about-structure.webp",
      },
      {
        title: "Design + Build",
        text: "We design and build with performance and clarity in mind, then add controlled interaction where it adds value.",
        img: "/images/about/about-design.webp",
      },
      {
        title: "Launch + Refine",
        text: "We polish, test, and launch. Then we refine based on feedback and reality, not assumptions.",
        img: "/images/about/about-launch.webp",
      },
    ],
    []
  );

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
      ".about-hero",
      { opacity: 0, y: 80, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power3.out" }
    );

    const reveal = (selector: string, trigger: Element) => {
      gsap.fromTo(
        selector,
        { opacity: 0, y: 90, scale: 0.98, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger,
            start: "top 75%",
          },
        }
      );
    };

    const sectionEls = root.querySelectorAll("[data-reveal]");
    sectionEls.forEach((el) => {
      const sel = (el as HTMLElement).dataset.reveal;
      if (sel) reveal(sel, el);
    });

    // Subtle parallax for banner image blocks
    gsap.utils.toArray<HTMLElement>(".about-parallax").forEach((el) => {
      gsap.fromTo(
        el,
        { y: -20 },
        {
          y: 20,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={pageRef} className="bg-black text-white">
      {/* HERO */}
      <section className="about-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm tracking-[0.25em] text-white/50">
                ABOUT WEB GROWTH
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                We build websites that look premium and perform under pressure.
              </h1>
              <p className="mt-6 text-white/70 leading-relaxed text-lg">
                Web Growth exists for businesses that are tired of websites that
                “look fine” but don’t deliver. We combine structure, clean design,
                and controlled interaction to help you attract customers, build trust,
                and support real growth.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Work with us
                </a>
                <a
                  href="/portfolio"
                  className="inline-flex items-center justify-center rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-black/50"
                >
                  See our work
                </a>
              </div>
            </div>

            {/* Image placeholder */}
            <div className="relative">
              <div className="about-parallax relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <div
                  className="h-[320px] md:h-[420px] bg-cover bg-center opacity-80"
                  style={{ backgroundImage: "url(/images/about/about-hero.webp)" }}
                />
                <div className="absolute inset-0 bg-black/35" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {["Strategy", "Design", "Performance"].map((t) => (
                  <div
                    key={t}
                    className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center text-sm text-white/70"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY / VALUES */}
      <section
        className="py-24"
        data-reveal=".values-reveal"
      >
        <div className="mx-auto max-w-6xl px-6 values-reveal">
          <SectionHeading
            eyebrow="WHY US"
            title="Design is not the goal. Results are."
            description="A beautiful website that loads slowly, confuses visitors, or lacks a clear path to action is just decoration. We build websites with structure and intent."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-7 hover:border-white/20 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-white/10 bg-black/50 p-2">
                    <Icon kind={v.icon} />
                  </div>
                  <h3 className="text-xl font-semibold">{v.title}</h3>
                </div>
                <p className="mt-4 text-white/65 leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY + IMAGE */}
      <section
        className="py-24 bg-gray-950"
        data-reveal=".story-reveal"
      >
        <div className="mx-auto max-w-6xl px-6 story-reveal">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <SectionHeading
                eyebrow="OUR STORY"
                title="From “nice websites” to websites that actually work"
                description="Most businesses don’t need more pages. They need a clearer message, stronger trust signals, and a website that guides people to take action."
              />
              <div className="mt-6 space-y-4 text-white/70 leading-relaxed">
                <p>
                  We noticed a pattern: lots of sites look modern, but visitors still
                  don’t understand what the business does, why it matters, or what to do next.
                </p>
                <p>
                  Web Growth is built around fixing that. We focus on clarity first,
                  then design, then performance, and then we add interaction where it supports the message.
                </p>
                <p>
                  The result is a site that feels premium, loads fast, and makes your business
                  look serious to the people you want to attract.
                </p>
              </div>
            </div>

            {/* Image placeholder */}
            <div className="about-parallax relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[360px] md:h-[460px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: "url(/images/about/about-nice.webp)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
              
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS (INTERACTIVE) */}
      <section
        className="py-24"
        data-reveal=".process-reveal"
      >
        <div className="mx-auto max-w-6xl px-6 process-reveal">
          <SectionHeading
            eyebrow="PROCESS"
            title="How we take you from idea to launch"
            description="A clear process reduces mistakes, speeds up delivery, and keeps the final product focused on outcomes."
          />

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* Steps (interactive tabs) */}
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6">
              <div className="flex flex-wrap gap-2">
                {steps.map((s, idx) => {
                  const active = idx === activeStep;
                  return (
                    <button
                      key={s.title}
                      onClick={() => setActiveStep(idx)}
                      className={[
                        "rounded-full px-4 py-2 text-sm font-semibold transition",
                        active
                          ? "bg-emerald-600 text-white"
                          : "bg-black/40 text-white/70 border border-white/10 hover:text-white hover:border-white/20",
                      ].join(" ")}
                      type="button"
                    >
                      {idx + 1}. {s.title}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-semibold">{steps[activeStep].title}</h3>
                <p className="mt-3 text-white/70 leading-relaxed">
                  {steps[activeStep].text}
                </p>

                <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                </div>
              </div>
            </div>

            {/* Image panel */}
            <div className="about-parallax relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[420px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: `url(${steps[activeStep].img})` }}
              />
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/55 p-4 text-sm text-white/70">
                <span> {activeStep + 1}  </span>
                <span className="text-emerald-400 font-semibold"></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="py-24 bg-gray-950"
        data-reveal=".faq-reveal"
      >
        <div className="mx-auto max-w-6xl px-6 faq-reveal">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions people ask before they hire"
            description="Clear answers, no marketing fluff."
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
            title="Let’s build a website your customers take seriously"
            description="If your current site feels outdated or doesn’t convert, we’ll rebuild it with clarity, performance, and a premium feel."
            primaryCtaText="Request a Quote"
            primaryHref="/contact"
            secondaryCtaText="See Pricing"
            secondaryHref="/pricing"
            imageUrl="/images/about/about-cta.webp"
          />
        </div>
      </section>
    </div>
  );
}
