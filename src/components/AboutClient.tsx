"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import CTASection from "@/components/CTASection";
import FAQAccordion from "@/components/FAQAccordion";
import SectionHeading from "@/components/SectionHeading";

const trustPoints = [
  {
    title: "Built to get a response",
    text: "I do not treat the website like decoration. It needs to help people trust the business and make it easier for them to reach out.",
  },
  {
    title: "You deal with one person",
    text: "You work with me directly from start to finish, so nothing gets lost between strategy, design, and build.",
  },
  {
    title: "Mobile matters first",
    text: "A lot of people will judge the site on their phone before they ever see it on a laptop, so that experience has to feel solid.",
  },
  {
    title: "No drawn-out process",
    text: "I keep the work focused on what actually helps: clearer pages, better structure, and an easier way for people to contact you.",
  },
];

const fitItems = [
  "Aesthetic clinics that need a site that feels more polished and trustworthy",
  "Service businesses losing enquiries because the current site feels weak or unclear",
  "Consultants who need a clearer site and a better way to capture leads",
  "Premium local brands that need a better website before running ads or outreach",
];

const serviceItems = [
  "Website redesigns",
  "Conversion-focused landing pages",
  "Business websites",
  "Speed and mobile optimisation",
  "Lead capture and booking-focused improvements",
];

const proofItems = [
  "Built and improved J Luxe Medical Aesthetics, a London clinic website that needed clearer treatment pages and a more trustworthy first impression.",
  "Run Web Growth as a direct, founder-led service instead of dressing it up like a big agency.",
  "Worked on real client sites that needed better structure, faster mobile performance, and a stronger first impression.",
];

const faqs = [
  {
    question: "Who do I work with on the project?",
    answer:
      "You work directly with Victor Chinukwue. I handle the strategy, design, and development myself.",
  },
  {
    question: "What kind of businesses are the best fit?",
    answer:
      "Usually service businesses, aesthetic clinics, consultants, and premium local brands that know the website is holding them back.",
  },
  {
    question: "Do you only work with Lagos businesses?",
    answer:
      "Lagos and Nigeria are the main focus. I also take on some UK projects when the fit is right.",
  },
  {
    question: "What matters most in your process?",
    answer:
      "Clarity and usefulness. The site needs to explain the business properly, feel trustworthy on mobile, and make the next step obvious.",
  },
];

export default function AboutClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    const root = pageRef.current;
    if (!root) return;

    gsap.fromTo(
      ".about-hero",
      { opacity: 0, y: 70, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "power3.out" }
    );

    const sections = root.querySelectorAll("[data-reveal]");
    sections.forEach((section) => {
      const selector = (section as HTMLElement).dataset.reveal;
      if (!selector) return;

      gsap.fromTo(
        selector,
        { opacity: 0, y: 80, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.95,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 76%",
          },
        }
      );
    });

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div ref={pageRef} className="bg-black text-white">
      <section className="about-hero relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/50">
                About Victor Chinukwue
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
                Websites for service businesses that need more than something that just looks nice
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/72">
                I&apos;m Victor Chinukwue, founder of Web Growth. I design and build
                websites for service businesses that want to look more credible,
                work better on mobile, and make it easier for people to get in touch.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/72">
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                  Lagos based
                </span>
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                  Solo operator
                </span>
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                  Same-day response in most cases
                </span>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Request a Quote
                </Link>
                <Link
                  href="/portfolio"
                  className="inline-flex items-center justify-center rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-black/50"
                >
                  See Real Projects
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[320px] bg-cover bg-center opacity-80 md:h-[420px]"
                style={{ backgroundImage: "url(/images/about/about-hero.webp)" }}
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/90">
                  Founder-led studio
                </p>
                <p className="mt-3 text-sm leading-6 text-white/76">
                  You work with me directly on strategy, design, and development.
                  It stays simple, moves faster, and avoids the usual agency back-and-forth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24" data-reveal=".story-reveal">
        <div className="mx-auto max-w-6xl px-6 story-reveal">
          <div className="grid gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div>
              <SectionHeading
                eyebrow="Founder Story"
                title="Why Web Growth exists"
                description="The shift was simple: stop building sites that only look acceptable and start building sites that help businesses get customers."
                
              />
              <div className="mt-8 space-y-4 text-base leading-7 text-white/72">
                <p>
                  I started as a web developer focused on building clean, fast
                  websites. Over time, I noticed the same problem again and
                  again: many businesses had websites that looked decent on the
                  surface but still failed to generate leads or customers.
                </p>
                <p>
                  That pushed me toward website work that is more practical. The
                  point is to help people understand the business, trust it
                  faster, and know what to do next.
                </p>
                <p>
                  I mainly work with service businesses, consultants, premium
                  local brands, and aesthetic clinics in Lagos, Nigeria, and
                  some UK projects as well.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#08110d] p-7 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">
                What clients get
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-white/78">
                {proofItems.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="text-sm font-semibold text-white/90">
                  Work style
                </p>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  Direct communication, fast turnaround, and one person handling
                  the work from start to finish. No middlemen and no unnecessary process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-24" data-reveal=".trust-reveal">
        <div className="mx-auto max-w-6xl px-6 trust-reveal">
          <SectionHeading
            eyebrow="Why Work With Web Growth"
            title="Why people hire me instead of a random freelancer"
            description="The difference is not buzzwords. It is how the work is handled and how the final site feels to the people visiting it."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {trustPoints.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/40 p-7 backdrop-blur"
              >
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/68">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" data-reveal=".fit-reveal">
        <div className="mx-auto max-w-6xl px-6 fit-reveal">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">
                Best fit
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em]">
                The kind of businesses I usually help best
              </h2>
              <ul className="mt-6 space-y-3 text-sm leading-6 text-white/74">
                {fitItems.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#08110d] p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">
                Core services
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em]">
                What I actually sell
              </h2>
              <ul className="mt-6 space-y-3 text-sm leading-6 text-white/74">
                {serviceItems.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-black/35 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
                >
                  View Services
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Start a Project
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-24" data-reveal=".faq-reveal">
        <div className="mx-auto max-w-6xl px-6 faq-reveal">
          <SectionHeading
            eyebrow="FAQ"
            title="The questions that matter before you enquire"
            description="Simple answers so you know who you are hiring and how the work usually goes."
          />
          <div className="mt-10">
            <FAQAccordion items={faqs} />
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <CTASection
            eyebrow="Ready"
            title="If your current website is letting the business down, we can fix that"
            description="Send the basics and I will tell you what makes sense, what it will take, and where to start."
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
