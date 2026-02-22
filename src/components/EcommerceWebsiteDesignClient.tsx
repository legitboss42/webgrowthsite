"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import FAQAccordion from "@/components/FAQAccordion";

export default function EcommerceWebsiteDesignClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    const reveal = (selector: string, trigger: Element) => {
      gsap.fromTo(
        selector,
        { opacity: 0, y: 70, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger, start: "top 75%" },
        }
      );
    };

    const root = pageRef.current;
    if (!root) return;

    root.querySelectorAll("[data-reveal]").forEach((el) => {
      reveal(`.${el.classList[0]}`, el);
    });

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={pageRef} className="bg-black text-white">
      {/* HERO */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6 grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-sm tracking-[0.25em] text-white/50">
              E-COMMERCE WEBSITE DESIGN
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
              Online stores built to earn trust and drive sales.
            </h1>
            <p className="mt-6 text-lg text-white/70">
              A good-looking store is not enough. We design e-commerce websites
              with clear product structure, trust signals, and checkout flows
              that reduce hesitation and increase conversions.
            </p>

            <div className="mt-10 flex gap-3 flex-col sm:flex-row">
              <a
                href="/contact?service=E-commerce Website Design"
                className="rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition text-center"
              >
                Request a Quote
              </a>
              <a
                href="/portfolio"
                className="rounded-md border border-white/15 px-7 py-3.5 text-sm text-white/90 hover:bg-white/5 transition text-center"
              >
                View Portfolio
              </a>
            </div>
          </div>

          {/* Image placeholder */}
          <div className="relative h-[380px] rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center opacity-80"
              style={{ backgroundImage: "url(/images/services/services-ecommerce-2.webp)" }}
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        </div>
      </section>

      {/* WHY STORES FAIL */}
      <section data-reveal className="py-24 bg-gray-950">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeading
            eyebrow="WHY E-COMMERCE FAILS"
            title="Most online stores lose customers before checkout"
            description="Design and structure issues silently kill sales."
          />

          <ul className="mt-10 space-y-4 text-white/70">
            {[
              "Product pages don’t answer key questions",
              "Checkout feels untrustworthy or complicated",
              "Navigation makes products hard to find",
              "Mobile experience is slow or clumsy",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 bg-emerald-400 rounded-full" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section data-reveal className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="DELIVERABLES"
            title="What’s included"
            description="Everything needed for a reliable online store."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Product page UX", "Clear pricing, images, and product details"],
              ["Trust signals", "Policies, reviews, and credibility blocks"],
              ["Clean checkout flow", "Reduced friction and drop-offs"],
              ["Mobile-first design", "Optimised for phones and tablets"],
              ["Performance optimisation", "Fast load times for better conversions"],
              ["Scalable structure", "Easy to grow your catalogue"],
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
      <section data-reveal className="py-24 bg-gray-950">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions"
            description="Before you request a quote."
          />

          <FAQAccordion
            items={[
              {
                question: "Do you use WooCommerce or Shopify?",
                answer:
                  "We design around your preferred platform. The principles stay the same: clarity, trust, and speed.",
              },
              {
                question: "Can the store scale later?",
                answer:
                  "Yes. The structure is built to grow as you add products or categories.",
              },
              {
                question: "Do you handle payments and shipping setup?",
                answer:
                  "We can assist with payment gateways and basic shipping structure during setup.",
              },
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <CTASection
            eyebrow="READY"
            title="Build an online store customers trust"
            description="If you’re serious about selling online, your store needs to feel credible and simple to use."
            primaryCtaText="Request a Quote"
            primaryHref="/contact?service=E-commerce Website Design"
            secondaryCtaText="View Services"
            secondaryHref="/services"
            imageUrl="/images/services/services-ecommerce-cta.webp"
          />
        </div>
      </section>
    </div>
  );
}
