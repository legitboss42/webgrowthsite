"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import CorePageLinks from "@/components/CorePageLinks";
import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import FAQAccordion from "@/components/FAQAccordion";

const businessWebsiteAnswers = [
  {
    title: "Who is this best for?",
    answer:
      "It is best for businesses that need a stronger first impression, clearer trust signals, and a site that supports enquiries instead of acting like a static brochure.",
    href: "/portfolio",
    hrefLabel: "See recent work",
  },
  {
    title: "What problem does this solve first?",
    answer:
      "It fixes weak positioning, generic structure, and unclear calls to action so visitors understand what the business offers and what to do next faster.",
    href: "/services/website-audit",
    hrefLabel: "Start with an audit",
  },
  {
    title: "Should I choose this or the 48-hour launch?",
    answer:
      "Choose this if you need a fuller business website. Choose the 48-hour launch if you want a lean one-page site live quickly before expanding later.",
    href: "/launch",
    hrefLabel: "Compare the launch offer",
  },
  {
    title: "What happens after launch?",
    answer:
      "Once the site is live, you can add more pages, SEO content, proof, and deeper lead-generation support without rebuilding from scratch.",
    href: "/pricing",
    hrefLabel: "Review pricing paths",
  },
] as const;

export default function BusinessWebsiteDesignClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);

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
          scrollTrigger: {
            trigger,
            start: "top 75%",
          },
        }
      );
    };

    const root = pageRef.current;
    if (!root) return;

    root.querySelectorAll("[data-reveal]").forEach((el) => {
      const cls = (el as HTMLElement).dataset.reveal!;
      reveal(cls, el);
    });

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={pageRef} className="bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm tracking-[0.25em] text-white/50">
                BUSINESS WEBSITE DESIGN
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                Business website design built to convert serious buyers.
              </h1>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                We build custom business websites that position your offer clearly,
                build trust fast, and guide visitors toward high-intent enquiries.
              </p>

              <div className="mt-10 flex gap-3 flex-col sm:flex-row">
                <a
                  href="/contact?service=Business Website Design"
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
                style={{ backgroundImage: "url(/images/services/services-business.webp)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          </div>
        </div>
      </section>

      <AnswerHighlightsSection
        eyebrow="Quick answers"
        title="What serious buyers usually want clarified first"
        description="This gives prospects the fast version so they can decide whether this service fits their business, timeline, and growth stage."
        items={businessWebsiteAnswers}
      />

      {/* PROBLEM */}
      <section data-reveal=".problem" className="py-24 bg-gray-950">
        <div className="problem mx-auto max-w-4xl px-6">
          <SectionHeading
            eyebrow="THE PROBLEM"
            title="Most business websites look fine, but don’t work"
            description="Many websites fail because they focus on visuals instead of clarity and structure."
          />

          <ul className="mt-10 space-y-4 text-white/70">
            {[
              "Visitors don’t understand what the business offers within seconds",
              "The site looks generic or outdated",
              "There is no clear path to contact or enquiry",
              "Mobile experience feels clumsy or slow",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SOLUTION */}
      <section data-reveal=".solution" className="py-24">
        <div className="solution mx-auto max-w-6xl px-6 grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <SectionHeading
              eyebrow="OUR APPROACH"
              title="Designed for clarity, trust, and growth"
              description="We design business websites as communication tools, not just digital brochures."
            />

            <div className="mt-6 space-y-4 text-white/70 leading-relaxed">
              <p>
                Every section is intentional. We structure your website so visitors
                understand your value, see proof, and know exactly what to do next.
              </p>
              <p>
                The result is a website that looks professional, loads fast,
                and supports your sales or enquiry process.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div
              className="h-[420px] bg-cover bg-center opacity-80"
              style={{ backgroundImage: "url(/images/services/services-business-2.webp)" }}
            />
            <div className="absolute inset-0 bg-black/35" />
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section data-reveal=".deliverables" className="py-24 bg-gray-950">
        <div className="deliverables mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="DELIVERABLES"
            title="What’s included"
            description="No vague promises. This is what we build into every business website."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Clear page structure", "Visitors understand your business fast"],
              ["Mobile-first design", "Your site works perfectly on phones"],
              ["Fast load performance", "Reduced bounce and frustration"],
              ["SEO-ready foundation", "Built to compete properly"],
              ["Trust-building sections", "Testimonials, proof, credibility"],
              ["Conversion-focused CTAs", "Clear next steps for visitors"],
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
                question: "How long does a business website take?",
                answer:
                  "Most business websites take a few weeks depending on scope, content readiness, and feedback speed.",
              },
              {
                question: "Will you help with content?",
                answer:
                  "Yes. We help structure and refine your content so it’s clear, persuasive, and easy to read.",
              },
              {
                question: "Can the site be expanded later?",
                answer:
                  "Absolutely. The site is built to scale with new pages, services, or features.",
              },
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12">
            <CorePageLinks
              eyebrow="Helpful next steps"
              title="Choose the page that matches what you need next"
              description="Some businesses need a fast launch, some need a full build, and some need diagnosis first. These links help people move to the right next step without guessing."
              links={[
                {
                  href: "/launch",
                  label: "Fast launch",
                  title: "Need a site live quickly?",
                  description:
                    "Use the 48-hour launch offer if you want a focused one-page website live fast before expanding later.",
                },
                {
                  href: "/services/website-audit/",
                  label: "Audit",
                  title: "Need clarity before rebuilding?",
                  description:
                    "Start with a website audit if you are not fully sure what is blocking trust, enquiries, or SEO performance.",
                },
                {
                  href: "/blog/how-to-build-a-small-business-website-that-converts/",
                  label: "Guide",
                  title: "Need the strategy first?",
                  description:
                    "Read the conversion guide if you want to understand the structure behind a stronger business website before you request a quote.",
                },
              ]}
            />
          </div>

          <CTASection
            eyebrow="READY"
            title="Ready to replace a weak website with a revenue-ready one?"
            description="If your current website is costing trust or leads, we will rebuild it with premium execution and conversion intent."
            primaryCtaText="Request a Quote"
            primaryHref="/contact?service=Business Website Design"
            secondaryCtaText="View Services"
            secondaryHref="/services/"
            imageUrl="/images/services/services-business-cta.webp"
          />
        </div>
      </section>
    </div>
  );
}
