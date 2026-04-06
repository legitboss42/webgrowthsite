"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CTASection from "@/components/CTASection";
import FAQAccordion from "@/components/FAQAccordion";

const customCodeWins = [
  {
    title: "Faster by default",
    text: "Custom-coded Next.js websites avoid the drag created by heavy themes, unnecessary plugins, and builder clutter that slow serious brands down.",
  },
  {
    title: "Built to scale cleanly",
    text: "When the business needs more pages, better SEO, deeper integrations, or a refined conversion flow, the codebase is easier to extend without becoming messy.",
  },
  {
    title: "Cleaner UX control",
    text: "Custom architecture gives tighter control over hierarchy, motion, booking flow, and mobile behaviour so the site feels more deliberate from the first click.",
  },
  {
    title: "Stronger conversion foundations",
    text: "The structure is engineered around clarity, trust, and action, not just visual decoration. That matters when the website is supposed to help revenue, not just exist.",
  },
] as const;

const bestFitClients = [
  {
    title: "High-ticket clinics",
    text: "Clinics that need a stronger first impression, cleaner treatment journeys, and a website that looks as premium as the service being sold.",
  },
  {
    title: "Medical aesthetics brands",
    text: "Aesthetic businesses that rely on trust, clarity, and a polished presentation before colder traffic will take the next step.",
  },
  {
    title: "Premium e-commerce brands",
    text: "Stores that need a faster storefront, stronger product hierarchy, and a shopping experience that feels cleaner and easier to buy from.",
  },
  {
    title: "Quality-focused businesses",
    text: "Businesses with real growth intent that understand a weak website drags down paid traffic, SEO, referrals, and brand perception.",
  },
] as const;

const coreValues = [
  {
    title: "Precision",
    text: "Every page should have a job. Every section should earn its place. Every technical choice should support the business, not inflate the build.",
  },
  {
    title: "Performance",
    text: "Fast-loading pages, cleaner code decisions, and mobile-first execution are treated as part of the product, not an optional extra.",
  },
  {
    title: "Clarity",
    text: "If buyers cannot quickly understand the offer, the website is already losing. Copy, structure, and hierarchy are shaped to remove that friction.",
  },
  {
    title: "Trust",
    text: "Premium brands need websites that feel credible the moment they load. Visual quality and technical quality both matter here.",
  },
  {
    title: "Business-first execution",
    text: "The objective is not to impress other designers. It is to help a real business convert traffic, support growth, and look stronger online.",
  },
] as const;

const faqs = [
  {
    question: "Who do I actually work with?",
    answer:
      "You work directly with Victor Chinukwue. Strategy, design, and development stay in one workflow instead of being handed between separate teams.",
  },
  {
    question: "Why does Web Growth focus on custom-coded websites?",
    answer:
      "Because serious brands usually need better speed, cleaner UX control, and a more scalable technical foundation than page builders tend to provide.",
  },
  {
    question: "Which businesses are the best fit?",
    answer:
      "High-end service businesses, medical aesthetics clinics, premium local brands, and ambitious e-commerce businesses are the strongest fit.",
  },
  {
    question: "What matters most in the work?",
    answer:
      "Performance, clarity, trust, and conversion support. The website needs to help the business win, not just sit online looking acceptable.",
  },
] as const;

export default function AboutClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const root = pageRef.current;
    if (!root) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-about-hero]",
        { opacity: 0, y: 36, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out" }
      );

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((section) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 54, filter: "blur(8px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 76%",
            },
          }
        );
      });
    }, root);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="bg-black text-white">
      <section className="relative overflow-hidden border-b border-white/10 py-24 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div data-about-hero className="relative z-10">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">
              Founder intro
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-6xl">
              Web Growth is the technical partner serious brands hire when generic websites are no longer acceptable
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              I&apos;m Victor Chinukwue, founder of Web Growth. I build custom-coded
              websites for businesses that need stronger performance, better
              conversion foundations, and a more premium digital presence than a
              typical page builder setup can deliver.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/72">
              <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                Founder-led
              </span>
              <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                Custom-coded
              </span>
              <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                Same-day response in most cases
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-7 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Request a Premium Website Quote
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-black/30 px-7 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
              >
                Review the Portfolio
              </Link>
            </div>
          </div>

          <div data-about-hero className="relative z-10">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-[0_20px_50px_rgba(0,0,0,0.26)]">
              <div className="relative aspect-[4/4.6]">
                <Image
                  src="/images/about/about-hero.webp"
                  alt="Founder visual for Web Growth"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />
              </div>

              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/90">
                  Technical partner
                </p>
                <p className="mt-3 text-sm leading-7 text-white/76">
                  The work stays close to the business problem: stronger speed,
                  sharper positioning, cleaner UX, and a site that looks expensive
                  for the right reasons.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-reveal className="border-b border-white/10 bg-[#060907] py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[1.05fr_0.95fr] md:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
              Why custom code wins
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
              Serious brands usually outgrow page builders before they realize how much they are costing them
            </h2>
            <div className="mt-8 space-y-4 text-base leading-8 text-white/72">
              <p>
                When the website has to carry paid traffic, organic search,
                bookings, product discovery, or high-ticket enquiries, the build
                quality matters. Cheap setups tend to feel fine until speed, trust,
                or flexibility start costing the business money.
              </p>
              <p>
                That is why Web Growth leans into custom-coded architecture. The
                point is cleaner performance, tighter UX control, and a stronger
                long-term foundation for SEO, integrations, redesigns, and scale.
              </p>
              <p>
                It is not custom code for its own sake. It is custom code because
                serious brands need better technical leverage than a generic website
                can usually provide.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {customCodeWins.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-emerald-400/20 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
              >
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/76">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal className="border-b border-white/10 bg-black py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
              Our best-fit clients
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
              The kinds of businesses this work moves hardest for
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
              Web Growth fits best where trust, performance, and premium presentation
              directly affect leads, bookings, or sales.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {bestFitClients.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/40 p-7 shadow-[0_14px_32px_rgba(0,0,0,0.22)] backdrop-blur"
              >
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/68">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal className="border-b border-white/10 bg-[#060907] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
              Core values
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
              The standards behind every build
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
              The work is guided by business-first execution, not soft agency slogans.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {coreValues.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/40 p-7 shadow-[0_14px_32px_rgba(0,0,0,0.22)] backdrop-blur"
              >
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/68">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal className="border-b border-white/10 bg-black py-24">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            FAQ
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
            The answers serious buyers want before they hire a web partner
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
            Straight answers on fit, build quality, and how the work is handled.
          </p>

          <div className="mt-10">
            <FAQAccordion items={faqs} />
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <CTASection
            eyebrow="Ready"
            title="If the business needs a premium website partner, start with a direct build recommendation"
            description="Send the basics and get a straight answer on the right build, the likely scope, and where the strongest commercial return is likely to come from."
            primaryCtaText="Request a Premium Website Quote"
            primaryHref="/contact"
            secondaryCtaText="See the Portfolio"
            secondaryHref="/portfolio"
            imageUrl="/images/portfolio/jluxe-mockup.webp"
          />
        </div>
      </section>
    </div>
  );
}
