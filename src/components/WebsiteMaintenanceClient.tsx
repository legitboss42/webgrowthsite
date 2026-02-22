"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import FAQAccordion from "@/components/FAQAccordion";

type Plan = "Essential" | "Growth" | "Priority";

type PlanDetails = {
  badge: string;
  title: string;
  priceHint: string;
  bestFor: string;
  includes: string[];
};

const planMap: Record<Plan, PlanDetails> = {
  Essential: {
    badge: "ESSENTIAL",
    title: "Keep it stable and secure",
    priceHint: "Monthly support for updates + backups + basic fixes",
    bestFor: "Small businesses that want peace of mind.",
    includes: [
      "Core + plugin updates (scheduled)",
      "Weekly backups",
      "Security checks",
      "Minor content edits (small changes)",
      "Basic uptime monitoring",
    ],
  },
  Growth: {
    badge: "GROWTH",
    title: "Maintain + improve performance",
    priceHint: "For businesses that want stability and ongoing improvements",
    bestFor: "Growing brands that need continuous polish.",
    includes: [
      "Everything in Essential",
      "Speed and performance checks",
      "Monthly report (what we did / what we recommend)",
      "More content edits per month",
      "Priority fixes for issues found",
    ],
  },
  Priority: {
    badge: "PRIORITY",
    title: "Fast response, higher coverage",
    priceHint: "For higher-traffic websites and urgent businesses",
    bestFor: "Brands where downtime is costly.",
    includes: [
      "Everything in Growth",
      "Faster response time",
      "More frequent backups",
      "Proactive checks",
      "Priority troubleshooting",
    ],
  },
};

export default function WebsiteMaintenanceClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [plan, setPlan] = useState<Plan>("Essential");

  const faqs = useMemo(
    () => [
      {
        question: "Why do I need maintenance after launch?",
        answer:
          "Websites aren’t “set and forget.” Updates, security, backups, and small fixes prevent downtime, hacks, and performance problems.",
      },
      {
        question: "Do you maintain websites you didn’t build?",
        answer:
          "Yes. We usually start with a quick audit first to understand the current setup and risks.",
      },
      {
        question: "What counts as a ‘minor edit’?",
        answer:
          "Small updates like changing text, swapping images, updating a section, adding a small block, not new pages or major redesign work.",
      },
      {
        question: "Can I cancel anytime?",
        answer:
          "Yes. Maintenance is flexible. If you stop, you still keep your website, you’re just no longer on active support.",
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
      ".plan-panel",
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [plan]);

  const p = planMap[plan];

  return (
    <div ref={pageRef} className="bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm tracking-[0.25em] text-white/50">
                WEBSITE MAINTENANCE & SUPPORT
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                Keep your website secure, updated, and reliable.
              </h1>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                Websites break quietly, until it becomes a disaster. Maintenance
                prevents downtime, security issues, and performance decay. We keep
                your site stable and improve it over time.
              </p>

              <div className="mt-10 flex gap-3 flex-col sm:flex-row">
                <a
                  href="/contact?service=Website Maintenance & Support"
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
                style={{ backgroundImage: "url(/images/services/services-maintenance.webp)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          </div>
        </div>
      </section>

      {/* WHY MAINTENANCE */}
      <section data-reveal=".why" className="py-24 bg-gray-950">
        <div className="why mx-auto max-w-4xl px-6">
          <SectionHeading
            eyebrow="WHY IT MATTERS"
            title="Most websites don’t die, they slowly rot"
            description="Maintenance prevents the silent problems that cost you money."
          />

          <ul className="mt-10 space-y-4 text-white/70">
            {[
              "Outdated plugins create security vulnerabilities",
              "Backups save you when things break or get hacked",
              "Slow sites lose enquiries and sales",
              "Small issues become expensive emergencies when ignored",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* INTERACTIVE PLANS */}
      <section data-reveal=".plans" className="py-24">
        <div className="plans mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="PLANS"
            title="Choose the level of support you need"
            description="Pick a plan to see what’s included. We’ll finalise scope based on your site size and needs."
          />

          <div className="mt-10 flex flex-wrap gap-2">
            {(["Essential", "Growth", "Priority"] as Plan[]).map((x) => {
              const active = x === plan;
              return (
                <button
                  key={x}
                  type="button"
                  onClick={() => setPlan(x)}
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
            })}
          </div>

          <div className="plan-panel mt-8 grid gap-6 md:grid-cols-2 md:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-7">
              <div className="text-sm tracking-[0.25em] text-white/50">{p.badge}</div>
              <h3 className="mt-3 text-2xl font-semibold">{p.title}</h3>
              <p className="mt-3 text-white/70 leading-relaxed">{p.priceHint}</p>

              <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-5">
                <div className="text-sm font-semibold text-white/85">Best for</div>
                <div className="mt-2 text-sm text-white/65">{p.bestFor}</div>
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-5">
                <div className="text-sm font-semibold text-white/85">Includes</div>
                <ul className="mt-3 space-y-2 text-sm text-white/65">
                  {p.includes.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="/contact?service=Website Maintenance & Support"
                className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Request Maintenance Quote
              </a>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[420px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: "url(/images/services/services-maintenance-2.webp)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
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
            title="Stop firefighting. Maintain your website properly."
            description="Maintenance is cheaper than emergencies. We’ll keep your site stable, secure, and fast."
            primaryCtaText="Request a Quote"
            primaryHref="/contact?service=Website Maintenance & Support"
            secondaryCtaText="View Services"
            secondaryHref="/services"
            imageUrl="/images/services/services-cta.webp"
          />
        </div>
      </section>
    </div>
  );
}
