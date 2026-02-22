"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";

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

  // Fallback (your current static list)
  const fallbackServices = useMemo<Service[]>(
    () => [
      {
        title: "Business Website Design",
        short:
          "Professional business websites designed for clarity, trust, and real results.",
        slug: "/services/business-website-design",
        serviceParam: "Business Website Design",
        bullets: ["Modern structure", "Mobile-first", "SEO-ready foundation"],
        image: "/images/services/services-business.webp",
      },
      {
        title: "Landing Page Design",
        short:
          "Conversion-focused landing pages for campaigns, ads, and offers, built to convert.",
        slug: "/services/landing-page-design",
        serviceParam: "Landing Page Design",
        bullets: ["Message match", "Strong CTA flow", "Fast mobile load"],
        image: "/images/services/services-landing.webp",
      },
      {
        title: "Website Redesign",
        short:
          "Upgrade outdated sites into modern, trust-building experiences that perform better.",
        slug: "/services/website-redesign",
        serviceParam: "Website Redesign",
        bullets: ["Better structure", "Improved trust", "Cleaner conversion path"],
        image: "/images/services/services-redesign.webp",
      },
      {
        title: "E-commerce Website Design",
        short:
          "Online stores built to earn trust and make buying simple + product pages + checkout done right.",
        slug: "/services/ecommerce-website-design",
        serviceParam: "E-commerce Website Design",
        bullets: ["Product UX", "Trust signals", "Checkout clarity"],
        image: "/images/services/services-ecommerce.webp",
      },
      {
        title: "Website Maintenance & Support",
        short:
          "Monthly care to keep your website secure, updated, fast, and reliable, no surprises.",
        slug: "/services/website-maintenance",
        serviceParam: "Website Maintenance & Support",
        bullets: ["Updates + backups", "Security checks", "Ongoing fixes"],
        image: "/images/services/services-maintenance.webp",
      },
      {
        title: "Speed & Performance Optimisation",
        short:
          "Fix slow websites properly: faster load times, better mobile experience, improved Core Web Vitals.",
        slug: "/services/performance-optimisation",
        serviceParam: "Speed & Performance Optimisation",
        bullets: ["Speed audit", "Asset cleanup", "Core Web Vitals improvements"],
        image: "/images/services/services-speed.webp",
      },
      {
        title: "Website Audit & Consultation",
        short:
          "A clear diagnosis of what’s blocking results, plus a practical plan to fix it.",
        slug: "/services/website-audit",
        serviceParam: "Website Audit & Consultation",
        bullets: ["Clarity + trust", "Conversion flow", "SEO + performance basics"],
        image: "/images/services/services-audit.webp",
      },
    ],
    []
  );

  const services = servicesProp?.length ? servicesProp : fallbackServices;

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    const root = pageRef.current;
    if (!root) return;

    // Section reveals
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

    // Subtle parallax background dots
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

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
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
                Web design services built for real business outcomes.
              </h1>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                We don’t sell “pretty websites.” We build clear, trustworthy,
                performance-aware web experiences that help businesses attract
                customers and grow.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/contact"
                  className="rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white text-center hover:bg-emerald-500 transition"
                >
                  Request a Quote
                </Link>
                <Link
                  href="/portfolio"
                  className="rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-sm font-semibold text-white/90 text-center hover:bg-black/50 transition"
                >
                  View Portfolio
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

      {/* SERVICES GRID */}
      <section data-reveal className="py-24 bg-gray-950">
        <div className="mx-auto max-w-6xl px-6">
          <div data-reveal-item>
            <SectionHeading
              eyebrow="WHAT WE DO"
              title="Choose a service"
              description="Each service has its own page with deeper details. Every service also has a dedicated quote request path."
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
            title="Not sure what you need?"
            description="We can quickly recommend the best option based on your goal, budget, and timeline."
            primaryCtaText="Request a Quote"
            primaryHref="/contact"
            secondaryCtaText="Website Audit"
            secondaryHref="/services/website-audit"
            imageUrl="/images/services/services-cta.webp"
          />
        </div>
      </section>
    </div>
  );
}