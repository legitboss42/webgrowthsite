"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import FAQAccordion from "@/components/FAQAccordion";

type Goal = "Leads" | "Bookings" | "Sales" | "Waitlist";

const goalCopy: Record<
  Goal,
  { title: string; text: string; cta: string; sub: string }
> = {
  Leads: {
    title: "Lead generation landing page",
    text: "Built to turn traffic into enquiries with clear messaging, proof, and one obvious next step.",
    cta: "Request a Lead Page",
    sub: "Perfect for service businesses running ads or referrals.",
  },
  Bookings: {
    title: "Booking-focused landing page",
    text: "Designed to reduce hesitation and push visitors toward scheduling or requesting an appointment.",
    cta: "Request a Booking Page",
    sub: "Great for clinics, consultants, and appointment businesses.",
  },
  Sales: {
    title: "Sales landing page",
    text: "A persuasive page for a specific offer, built to convert visitors into buyers with minimal distraction.",
    cta: "Request a Sales Page",
    sub: "Works well for digital products and focused offers.",
  },
  Waitlist: {
    title: "Waitlist / launch landing page",
    text: "Capture interest before a launch with a clean page and strong positioning that encourages signups.",
    cta: "Request a Waitlist Page",
    sub: "Ideal for new products, startups, and pre-launch campaigns.",
  },
};

export default function LandingPageDesignClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [goal, setGoal] = useState<Goal>("Leads");

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
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

    // Small interactive transition for the goal panel
    gsap.fromTo(
      ".goal-panel",
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [goal]);

  const g = goalCopy[goal];

  return (
    <div ref={pageRef} className="bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm tracking-[0.25em] text-white/50">
                LANDING PAGE DESIGN
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                Landing pages built for one job: convert.
              </h1>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                Ads and campaigns waste money when the landing page is weak.
                We design high-conversion landing pages that load fast,
                communicate clearly, and guide visitors to take action.
              </p>

              <div className="mt-10 flex gap-3 flex-col sm:flex-row">
                <a
                  href="/contact?service=Landing Page Design"
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
                style={{ backgroundImage: "url(/images/services/services-landing-2.webp)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          </div>
        </div>
      </section>

      {/* WHY LANDING PAGES FAIL */}
      <section data-reveal=".problem" className="py-24 bg-gray-950">
        <div className="problem mx-auto max-w-4xl px-6">
          <SectionHeading
            eyebrow="WHY IT FAILS"
            title="Most landing pages leak conversions"
            description="It’s not always the ads. Often the page is the problem."
          />

          <ul className="mt-10 space-y-4 text-white/70">
            {[
              "The headline is vague and doesn’t match the ad message",
              "Too many distractions (menus, multiple offers, clutter)",
              "No proof, visitors don’t trust the offer",
              "Slow load speed on mobile",
              "Weak CTA placement and poor flow",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* INTERACTIVE: PICK YOUR GOAL */}
      <section data-reveal=".goal" className="py-24">
        <div className="goal mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="PICK A GOAL"
            title="What should your landing page achieve?"
            description="Different goals need different structure. Pick your goal to see how we design the flow."
          />

          <div className="mt-10 flex flex-wrap gap-2">
            {(["Leads", "Bookings", "Sales", "Waitlist"] as Goal[]).map((x) => {
              const active = x === goal;
              return (
                <button
                  key={x}
                  type="button"
                  onClick={() => setGoal(x)}
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

          <div className="goal-panel mt-8 grid gap-6 md:grid-cols-2 md:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-7">
              <div className="text-sm tracking-[0.25em] text-white/50">RECOMMENDED</div>
              <h3 className="mt-3 text-2xl font-semibold">{g.title}</h3>
              <p className="mt-3 text-white/70 leading-relaxed">{g.text}</p>

              <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/65">
                {g.sub}
              </div>

              <a
                href={`/contact?service=${encodeURIComponent("Landing Page Design")}`}
                className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                {g.cta}
              </a>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[420px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: "url(/images/services/services-landing-2.webp)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/55 p-4 text-sm text-white/70">
                Placeholder image: use a UI mockup of the landing page (hero + CTA + proof).
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section data-reveal=".deliverables" className="py-24 bg-gray-950">
        <div className="deliverables mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="DELIVERABLES"
            title="What’s included"
            description="Everything needed for a landing page that can actually convert."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Message match", "Headline and sections aligned with the ad/campaign"],
              ["Conversion-focused structure", "One goal, one flow, fewer distractions"],
              ["Speed optimisation", "Fast mobile load to reduce drop-offs"],
              ["Proof + trust blocks", "Testimonials, logos, results, guarantees (if you have them)"],
              ["Strong CTA placement", "Buttons placed where people are ready to act"],
              ["Analytics-ready setup", "Built with measurement in mind (event hooks later)"],
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
                question: "Do you write the landing page copy?",
                answer:
                  "We help structure and refine your messaging. If you don’t have copy, we can craft conversion-focused sections based on your offer and audience.",
              },
              {
                question: "Can you connect the landing page to a form or WhatsApp?",
                answer:
                  "Yes. The CTA can go to a form, WhatsApp, booking link, or checkout, depending on your goal.",
              },
              {
                question: "Do you build multiple landing pages for A/B testing?",
                answer:
                  "We can, but start with one strong version first. Once you have traffic, A/B testing becomes more meaningful.",
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
            title="Stop wasting clicks, build a page that converts"
            description="If you’re paying for traffic (ads or attention), your landing page needs to do its job. We’ll build it properly."
            primaryCtaText="Request a Quote"
            primaryHref="/contact?service=Landing Page Design"
            secondaryCtaText="View Services"
            secondaryHref="/services"
            imageUrl="/images/services/services-landing-cta.webp"
          />
        </div>
      </section>
    </div>
  );
}
