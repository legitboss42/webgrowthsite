"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";

import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import { loadGsap } from "@/lib/loadGsap";

export type Service = {
  title: string;
  short: string;
  slug: string;
  serviceParam: string;
  bullets: string[];
  image: string;
};

type Props = {
  services?: Service[];
};

export default function ServicesClient({ services: servicesProp }: Props) {
  const pageRef = useRef<HTMLDivElement | null>(null);

  const fallbackServices = useMemo<Service[]>(
    () => [
      {
        title: "Business Website Design",
        short:
          "Custom business websites built for speed, trust, and higher-quality enquiries.",
        slug: "/services/business-website-design",
        serviceParam: "Business Website Design",
        bullets: ["Modern structure", "Mobile-first", "SEO-ready foundation"],
        image: "/images/services/services-business.webp",
      },
      {
        title: "Landing Page Design",
        short:
          "High-converting landing pages for campaigns, ads, and focused lead generation offers.",
        slug: "/services/landing-page-design",
        serviceParam: "Landing Page Design",
        bullets: ["Message match", "Funnel architecture", "Fast mobile load"],
        image: "/images/services/services-landing.webp",
      },
      {
        title: "Website Redesign",
        short:
          "Redesign outdated websites into premium, conversion-focused experiences that perform better.",
        slug: "/services/website-redesign",
        serviceParam: "Website Redesign",
        bullets: ["Better structure", "Improved trust", "Cleaner conversion path"],
        image: "/images/services/services-redesign.webp",
      },
      {
        title: "E-commerce Website Design",
        short:
          "Premium ecommerce storefronts built for cleaner product discovery and stronger checkout trust.",
        slug: "/services/ecommerce-website-design",
        serviceParam: "E-commerce Website Design",
        bullets: ["Product-page UX", "Checkout trust", "Mobile commerce flow"],
        image: "/images/services/services-ecommerce-2.webp",
      },
      {
        title: "Website Audit & Consultation",
        short:
          "A clear diagnosis of what is hurting SEO, UX, speed, and conversion, with a practical fix plan.",
        slug: "/services/website-audit",
        serviceParam: "Website Audit & Consultation",
        bullets: ["Diagnosis", "Priority fixes", "Implementation roadmap"],
        image: "/images/services/services-audit.webp",
      },
      {
        title: "Website Maintenance & Support",
        short:
          "Ongoing support to keep your website secure, updated, reliable, and commercially usable.",
        slug: "/services/website-maintenance",
        serviceParam: "Website Maintenance & Support",
        bullets: ["Updates", "Backups", "Priority support"],
        image: "/images/services/services-maintenance.webp",
      },
      {
        title: "Performance Optimisation",
        short:
          "Website speed optimization to improve mobile experience, Core Web Vitals, and conversion quality.",
        slug: "/services/performance-optimisation",
        serviceParam: "Speed & Performance Optimisation",
        bullets: ["Speed pass", "Core Web Vitals", "Mobile smoothness"],
        image: "/images/services/services-speed.webp",
      },
    ],
    []
  );

  const services = useMemo<Service[]>(
    () => (servicesProp?.length ? servicesProp : fallbackServices),
    [fallbackServices, servicesProp]
  );

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    const root = pageRef.current;
    if (!root) return;

    let active = true;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const { gsap, ScrollTrigger } = await loadGsap();
      if (!active) return;

      root.querySelectorAll("[data-reveal]").forEach((section) => {
        const targets = section.querySelectorAll("[data-reveal-item]");
        gsap.fromTo(
          targets,
          { opacity: 0, y: 70, filter: "blur(6px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: section,
              start: "top 75%",
            },
          }
        );
      });

      gsap.to(".services-parallax", {
        yPercent: -10,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
      });

      ScrollTrigger.refresh();
      cleanup = () => {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    })();

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={pageRef} className="bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
          <div className="services-parallax absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="services-parallax absolute -bottom-40 right-[-140px] h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm tracking-[0.25em] text-white/50">
                SERVICES
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                Website services built to increase enquiries, bookings, and sales.
              </h1>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                Start with the service that fixes your biggest growth bottleneck:
                weak trust, low conversion, slow performance, or outdated UX.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/contact"
                  className="rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white text-center hover:bg-emerald-500 transition"
                >
                  Get a Quote
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-sm font-semibold text-white/90 text-center hover:bg-black/50 transition"
                >
                  See Pricing
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[360px] bg-cover bg-center opacity-80"
                style={{
                  backgroundImage: "url(/images/services/services-hero.webp)",
                }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          </div>
        </div>
      </section>

      <section data-reveal className="border-y border-white/10 bg-[#050806] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div data-reveal-item>
            <SectionHeading
              eyebrow="Service Selection"
              title="How to choose the right service first"
              description="Pick the service based on the bottleneck that is costing you revenue now, not the one that sounds the most advanced."
            />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article data-reveal-item className="rounded-2xl border border-white/10 bg-black/35 p-6">
              <h3 className="text-lg font-semibold text-white">If leads are weak</h3>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Start with <Link href="/services/website-audit" className="text-emerald-300 hover:text-emerald-200">website audit</Link>, <Link href="/services/website-redesign" className="text-emerald-300 hover:text-emerald-200">website redesign</Link>, or <Link href="/services/landing-page-design" className="text-emerald-300 hover:text-emerald-200">landing page design</Link>.
              </p>
            </article>
            <article data-reveal-item className="rounded-2xl border border-white/10 bg-black/35 p-6">
              <h3 className="text-lg font-semibold text-white">If traffic is weak</h3>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Start with <Link href="/services/search-engine-optimisation" className="text-emerald-300 hover:text-emerald-200">search engine optimisation</Link> and <Link href="/services/google-my-business-setup-optimisation" className="text-emerald-300 hover:text-emerald-200">Google Business Profile optimisation</Link>.
              </p>
            </article>
            <article data-reveal-item className="rounded-2xl border border-white/10 bg-black/35 p-6">
              <h3 className="text-lg font-semibold text-white">If operations are messy</h3>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Start with <Link href="/services/crm-system-setup-configuration" className="text-emerald-300 hover:text-emerald-200">CRM setup</Link>, <Link href="/services/booking-platform-setup-integration" className="text-emerald-300 hover:text-emerald-200">booking integration</Link>, and <Link href="/services/analytics-tracking-setup" className="text-emerald-300 hover:text-emerald-200">analytics tracking</Link>.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section data-reveal className="py-24 bg-gray-950">
        <div className="mx-auto max-w-6xl px-6">
          <div data-reveal-item>
            <SectionHeading
              eyebrow="WHAT WE DO"
              title="Start with the service that fixes the biggest leak"
              description="Each page is built around a specific buyer need, a clear scope, and a direct quote request."
            />
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {services.map((s) => (
              <div
                key={s.title}
                data-reveal-item
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40"
              >
                <div className="grid md:grid-cols-5">
                  <div className="md:col-span-2 relative min-h-[220px]">
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-80"
                      style={{ backgroundImage: `url(${s.image})` }}
                    />
                    <div className="absolute inset-0 bg-black/45" />
                  </div>

                  <div className="md:col-span-3 p-7">
                    <h3 className="text-2xl font-semibold">{s.title}</h3>
                    <p className="mt-3 text-white/70 leading-relaxed">
                      {s.short}
                    </p>

                    <ul className="mt-6 space-y-2 text-sm text-white/65">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                      <Link
                        href={s.slug}
                        className="rounded-md border border-white/15 bg-black/30 px-6 py-3 text-sm font-semibold text-white/90 text-center hover:bg-black/50 transition"
                      >
                        View Details
                      </Link>

                      <Link
                        href={`/contact?service=${encodeURIComponent(
                          s.serviceParam
                        )}`}
                        className="rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white text-center hover:bg-emerald-500 transition"
                      >
                        Request a Quote
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_60%)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <CTASection
            eyebrow="READY"
            title="Not sure whether you need a new site or a redesign?"
            description="Start with a quote request. We will tell you the fastest path to a better website without wasting your budget."
            primaryCtaText="Get a Quote"
            primaryHref="/contact"
            secondaryCtaText="Contact Us"
            secondaryHref="/contact"
            imageUrl="/images/services/services-cta.webp"
          />
        </div>
      </section>
    </div>
  );
}

