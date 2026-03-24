"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import CorePageLinks from "@/components/CorePageLinks";
import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import FAQAccordion from "@/components/FAQAccordion";
import type { ServicePageConfig } from "@/lib/newServiceConfigs";

type Props = {
  service: ServicePageConfig;
};

export default function ServiceDetailTemplateClient({ service }: Props) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const answerItems = service.faqs.slice(0, 4).map((item) => ({
    title: item.question,
    answer: item.answer,
    href: `/contact?service=${encodeURIComponent(service.serviceParam)}`,
    hrefLabel: "Request this service",
  }));
  const supportingLinks =
    service.relatedLinks ?? [
      {
        href: "/launch",
        label: "Launch",
        title: "Need a focused fast-start option?",
        description:
          "Use the 48-hour launch offer if your biggest priority is getting a website live quickly before expanding the scope later.",
      },
      {
        href: "/pricing",
        label: "Pricing",
        title: "Need pricing context first?",
        description:
          "Review pricing if you want to compare service paths before requesting implementation.",
      },
      {
        href: "/services",
        label: "Services",
        title: "Need a broader solution view?",
        description:
          "Explore the full service list if you are still deciding which path best fits your business goals.",
      },
    ];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    const root = pageRef.current;
    if (!root) return;

    const reveal = (selector: string, trigger: Element, stagger = 0) => {
      gsap.fromTo(
        selector,
        { opacity: 0, y: 70, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.95,
          ease: "power3.out",
          stagger,
          scrollTrigger: { trigger, start: "top 75%" },
        }
      );
    };

    root.querySelectorAll("[data-reveal]").forEach((el) => {
      const cls = (el as HTMLElement).dataset.reveal;
      if (!cls) return;
      reveal(cls, el);
    });

    ScrollTrigger.refresh();
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={pageRef} className="bg-black text-white">
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm tracking-[0.25em] text-white/50 uppercase">
                {service.title}
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                {service.heroTitle}
              </h1>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                {service.heroDescription}
              </p>

              <div className="mt-10 flex gap-3 flex-col sm:flex-row">
                <Link
                  href={`/contact?service=${encodeURIComponent(service.serviceParam)}`}
                  className="rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white text-center hover:bg-emerald-500 transition"
                >
                  Request a Quote
                </Link>
                <Link
                  href="/services"
                  className="rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-sm font-semibold text-white/90 text-center hover:bg-black/50 transition"
                >
                  View Services
                </Link>
              </div>

              <ul className="mt-8 space-y-2">
                {service.highlights.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-white/70">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[360px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: `url(${service.heroImage})` }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          </div>
        </div>
      </section>

      <AnswerHighlightsSection
        eyebrow="Quick answers"
        title={`What people usually want to know about ${service.title.toLowerCase()}`}
        description="Short practical answers make the service easier to understand quickly and help prospects move to the right next step without unnecessary friction."
        items={answerItems}
      />

      <section data-reveal=".deliverables-reveal" className="py-24 bg-gray-950">
        <div className="deliverables-reveal mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="DELIVERABLES"
            title="What is included"
            description="A practical scope designed to improve visibility, trust, and conversion flow."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {service.deliverables.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/40 p-7">
                <p className="text-white/75 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal=".process-reveal" className="py-24">
        <div className="process-reveal mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="PROCESS"
            title="How implementation works"
            description="A clear workflow focused on execution quality and measurable outcomes."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {service.process.map((step, idx) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-black/40 p-7">
                <p className="text-xs tracking-[0.16em] text-emerald-300/85 uppercase">
                  Step {idx + 1}
                </p>
                <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-white/65 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal=".faq-reveal" className="py-24 bg-gray-950">
        <div className="faq-reveal mx-auto max-w-4xl px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions"
            description="Quick answers before you request implementation."
          />

          <div className="mt-10">
            <FAQAccordion items={service.faqs} />
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12">
            <CorePageLinks
              eyebrow="Useful next steps"
              title="Choose the next page that supports this service"
              description="Use these supporting pages if you want a faster launch, pricing context, or a broader view of the other ways Web Growth can help."
              links={supportingLinks}
            />
          </div>

          <CTASection
            eyebrow="READY"
            title={service.ctaTitle}
            description={service.ctaDescription}
            primaryCtaText="Request a Quote"
            primaryHref={`/contact?service=${encodeURIComponent(service.serviceParam)}`}
            secondaryCtaText="View Portfolio"
            secondaryHref="/portfolio"
            imageUrl={service.detailImage}
          />
        </div>
      </section>
    </div>
  );
}
