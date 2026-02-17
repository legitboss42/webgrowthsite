"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import CodeRain from "@/components/CodeRain";
import SectionHeading from "@/components/SectionHeading";
import ServiceCard from "@/components/ServiceCard";
import CaseStudyCard from "@/components/CaseStudyCard";
import CTASection from "@/components/CTASection";

export default function HomeClient() {
  const heroRef = useRef<HTMLElement | null>(null);
  const servicesRef = useRef<HTMLElement | null>(null);
  const aboutRef = useRef<HTMLElement | null>(null);
  const portfolioRef = useRef<HTMLElement | null>(null);
  const contactRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    const hero = heroRef.current;
    const services = servicesRef.current;
    const about = aboutRef.current;
    const portfolio = portfolioRef.current;
    const contact = contactRef.current;

    // Hero exit on scroll
    if (hero) {
      gsap.to(hero, {
        opacity: 0,
        y: -180,
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // CTA entrance on load (premium cue)
      gsap.fromTo(
        ".hero-cta",
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.8 }
      );
    }

    // Helper: reveal section content
    const reveal = (
      selector: string,
      triggerEl: HTMLElement | null,
      stagger = 0
    ) => {
      if (!triggerEl) return;
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
          stagger,
          scrollTrigger: {
            trigger: triggerEl,
            start: "top 75%",
          },
        }
      );
    };

    // Services: header + cards stagger
    reveal(".services-head", services, 0);
    reveal(".service-card", services, 0.14);

    // Services background parallax
    if (services) {
      gsap.fromTo(
        ".services-bg",
        { y: -40 },
        {
          y: 40,
          ease: "none",
          scrollTrigger: {
            trigger: services,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }

    // About: reveal blocks
    reveal(".about-block", about, 0.12);

    // Portfolio: cards stagger
    reveal(".case-card", portfolio, 0.14);

    // Contact: reveal
    reveal(".contact-block", contact, 0.12);

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Laptop background (placeholder) */}
        <Image
          src="/images/hero/Hero-Image-1.png"
          alt=""
          fill
          priority
          quality={70}
          sizes="100vw"
          className="absolute inset-0 object-cover object-center"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/65" />

        {/* Code rain */}
        <div className="absolute inset-0 mix-blend-screen pointer-events-none">
          <CodeRain />
        </div>

        {/* Foreground */}
        <div className="relative z-10 text-center px-6">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight max-w-4xl mx-auto">
            We Design Professional Websites Focused On Real Results
          </h1>

          <p className="mt-6 text-white/70 max-w-2xl mx-auto leading-relaxed text-lg">
            Your business deserves a website that doesn’t just look good, but
            attracts customers, builds trust, and supports real growth.
          </p>

          <div className="mt-10 flex justify-center">
            {/* CHANGED: go to the contact page, not #contact */}
            <Link
              href="/contact"
              className="hero-cta inline-flex items-center justify-center rounded-md
                         bg-emerald-700 px-8 py-4 text-base font-semibold text-white
                         transition-colors hover:bg-emerald-600"
            >
              Request a Quote
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        ref={servicesRef}
        id="services"
        className="relative min-h-screen overflow-hidden py-28 bg-gray-950"
      >
        {/* Background layer for parallax */}
        <Image
          src="/images/backgrounds/services-bg.png"
          alt=""
          fill
          loading="lazy"
          quality={60}
          sizes="100vw"
          className="services-bg absolute inset-0 scale-110 object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div className="services-head max-w-2xl mx-auto">
            <SectionHeading
              eyebrow="SERVICES"
              title="What We Build"
              description="Websites designed to attract customers, build trust, and support real growth - not just look good."
            />
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <div className="service-card">
              <ServiceCard
                title="Business Website Design"
                description="A clean, fast website that positions your business professionally and converts visitors into enquiries."
                imageUrl="/images/services/service-1.png"
                href="/services/business-website-design"
                headingLevel="h2"
              />
            </div>

            <div className="service-card">
              <ServiceCard
                title="Landing Pages"
                description="Focused pages built for campaigns, ads, and offers - designed to push one action and win leads."
                imageUrl="/images/services/service-2.png"
                href="/services/landing-page-design"
                headingLevel="h2"
              />
            </div>

            <div className="service-card">
              <ServiceCard
                title="Website Redesign"
                description="Transform an outdated website into a modern, structured platform that performs better."
                imageUrl="/images/services/service-3.png"
                href="/services/website-redesign"
                headingLevel="h2"
              />
            </div>
          </div>

          {/* ADDED: View more services button */}
          <div className="services-head mt-10 flex justify-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15 transition"
            >
              View more services →
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        ref={aboutRef}
        id="about"
        className="relative min-h-screen bg-black py-28"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="about-block max-w-2xl mx-auto">
            <SectionHeading
              eyebrow="ABOUT"
              title="Built for clarity, speed, and trust"
              description="Web Growth is a web design studio focused on building modern websites that look sharp, load fast, and guide visitors to take action."
            />
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Strategy first",
                text: "We structure your site around goals: enquiries, bookings, sales, or credibility - whatever actually moves your business.",
              },
              {
                title: "Design that converts",
                text: "Clean layouts, strong hierarchy, and persuasive sections that help visitors understand and trust you fast.",
              },
              {
                title: "Performance matters",
                text: "Fast load times, mobile-first layouts, and a build that scales when your business grows.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="about-block rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-7"
              >
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-white/65 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="about-block mt-12 rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-8">
            <h2 className="text-xl font-semibold">How it works</h2>
            <ol className="mt-4 grid gap-3 text-white/70">
              <li>
                <span className="text-white font-semibold">1.</span> Quick
                discovery: goals, audience, and what success looks like.
              </li>
              <li>
                <span className="text-white font-semibold">2.</span> Design +
                build: we craft the layout, copy flow, and interactions.
              </li>
              <li>
                <span className="text-white font-semibold">3.</span> Launch +
                refine: performance checks, final polish, and go live.
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* PORTFOLIO PREVIEW */}
      <section
        ref={portfolioRef}
        id="portfolio"
        className="relative min-h-screen bg-gray-950 py-28"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="about-block max-w-2xl mx-auto">
            <SectionHeading
              eyebrow="PORTFOLIO"
              title="Work that speaks clearly"
              description="A few examples of the kind of clean, high-performance builds we deliver. Replace these with real case studies as you complete projects."
            />
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Clinic Website Refresh",
                client: "Aesthetic Clinic",
                summary:
                  "Redesigned layout for trust, improved mobile experience, and simplified booking flow.",
                results: ["Faster load time", "Clearer navigation", "More enquiries"],
              },
              {
                title: "Landing Page for Offer",
                client: "Service Business",
                summary:
                  "Built a conversion-focused landing page designed for one goal: leads.",
                results: ["Higher conversions", "Cleaner messaging", "Better structure"],
              },
              {
                title: "Brand Website Build",
                client: "Startup",
                summary:
                  "Created a professional website foundation with scalable sections and polished UI.",
                results: ["Modern look", "Mobile-first", "Built to scale"],
              },
            ].map((cs) => (
              <div key={cs.title} className="case-card">
                <CaseStudyCard
                  title={cs.title}
                  client={cs.client}
                  summary={cs.summary}
                  results={cs.results}
                  imageUrl="/images/portfolio/portfolio-1.png"
                  href="/portfolio"
                  headingLevel="h2"
                />
              </div>
            ))}
          </div>

          <div className="mt-14">
            <CTASection
              title="Want a website that looks premium and performs?"
              description="If your current site feels outdated or doesn’t convert, we’ll rebuild it with structure, speed, and clarity."
              primaryCtaText="Request a Quote"
              primaryHref="/contact"
              secondaryCtaText="View Portfolio"
              secondaryHref="/portfolio"
              imageUrl="/images/portfolio/portfolio-4.png"
            />
          </div>
        </div>
      </section>

      {/* CONTACT PREVIEW */}
      <section
        ref={contactRef}
        id="contact"
        className="relative min-h-screen bg-black py-28"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="contact-block max-w-2xl mx-auto">
            <SectionHeading
              eyebrow="CONTACT"
              title="Let’s build something that wins trust"
              description="Tell us what you do, what you need, and what success looks like. We’ll respond with next steps."
            />
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="contact-block rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-7">
              <h2 className="text-xl font-semibold">Email</h2>
              <p className="mt-2 text-white/65">
                For proposals, questions, and project details.
              </p>
              <a
                className="mt-5 inline-flex text-emerald-400 font-semibold hover:text-emerald-300 transition"
                href="mailto:admin@webgrowth.info"
              >
                admin@webgrowth.info →
              </a>
            </div>

            <div className="contact-block rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-7">
              <h2 className="text-xl font-semibold">WhatsApp</h2>
              <p className="mt-2 text-white/65">Quick chat for clarity before starting.</p>
              <a
                className="mt-5 inline-flex text-emerald-400 font-semibold hover:text-emerald-300 transition"
                href="https://wa.me/234XXXXXXXXXX"
                target="_blank"
                rel="noreferrer"
              >
                Chat on WhatsApp →
              </a>
            </div>
          </div>

          <div className="contact-block mt-12">
            <CTASection
              title="Ready to start?"
              description="We’ll help you plan the structure, build the site, and launch something your customers take seriously."
              primaryCtaText="Go to Contact Page"
              primaryHref="/contact"
              secondaryCtaText="See Pricing"
              secondaryHref="/pricing"
              imageUrl="/images/portfolio/portfolio-cta.png"
            />
          </div>
        </div>
      </section>
    </main>
  );
}


