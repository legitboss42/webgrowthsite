"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import CorePageLinks from "@/components/CorePageLinks";
import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import FAQAccordion from "@/components/FAQAccordion";

type Pain = "Outdated design" | "Low enquiries" | "Slow site" | "Mobile issues";

const painDetails: Record<
  Pain,
  { title: string; text: string; fixes: string[] }
> = {
  "Outdated design": {
    title: "Your site looks old, people do not trust it",
    text: "Design is a trust signal. If your site feels outdated, visitors assume your business is outdated too, even if your work is excellent.",
    fixes: ["Modern layout + typography", "Better spacing and hierarchy", "Trust signals placed correctly"],
  },
  "Low enquiries": {
    title: "People visit and do nothing",
    text: "This is usually a structure problem, not a traffic problem. If the message is unclear or the CTA path is weak, visitors will not act.",
    fixes: ["Clear messaging flow", "Proof + credibility blocks", "Strong CTA placement"],
  },
  "Slow site": {
    title: "Your site is slow, visitors bounce",
    text: "Speed affects conversions. If your site loads slowly on mobile, you are losing potential customers without noticing.",
    fixes: ["Image + asset optimisation", "Performance pass", "Cleaner page build"],
  },
  "Mobile issues": {
    title: "Mobile experience is broken or clumsy",
    text: "Most traffic is mobile. If your mobile experience is frustrating, your site loses trust and leads instantly.",
    fixes: ["Mobile-first layout", "Tap-friendly UI", "Clear scroll structure"],
  },
};

const redesignAnswers = [
  {
    title: "How do I know it is time for a redesign?",
    answer:
      "If the site feels outdated, does not convert, loads poorly on mobile, or no longer reflects the quality of the business, redesign becomes a growth issue rather than a cosmetic one.",
    href: "/services/website-audit/",
    hrefLabel: "Audit the current site first",
  },
  {
    title: "What should a redesign improve first?",
    answer:
      "The biggest gains usually come from better messaging, stronger trust signals, clearer CTA flow, and a more stable mobile experience.",
    href: "/blog/why-your-website-isnt-getting-leads/",
    hrefLabel: "See common conversion leaks",
  },
  {
    title: "Will redesign hurt SEO?",
    answer:
      "Handled properly, no. A careful redesign can improve structure, speed, internal links, and page clarity without sacrificing the foundations that matter.",
    href: "/services/search-engine-optimisation/",
    hrefLabel: "See SEO support",
  },
  {
    title: "What if I need something faster first?",
    answer:
      "If you need a clean stopgap before a larger redesign, the 48-hour launch offer can get you a focused website live while the bigger rebuild waits.",
    href: "/launch/",
    hrefLabel: "See the fast launch option",
  },
] as const;

export default function WebsiteRedesignClient() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [pain, setPain] = useState<Pain>("Outdated design");

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
      ".pain-panel",
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [pain]);

  const p = painDetails[pain];

  return (
    <div ref={pageRef} className="bg-black text-white">
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm tracking-[0.25em] text-white/50">
                WEBSITE REDESIGN SERVICE
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                Website redesign that improves trust, speed, and conversion.
              </h1>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                If your current site looks outdated, loads slowly, or leaks
                enquiries, we redesign it around clearer positioning, mobile-first
                UX, and stronger conversion flow.
              </p>

              <div className="mt-10 flex gap-3 flex-col sm:flex-row">
                <a
                  href="/contact?service=Website Redesign"
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

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[360px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: "url(/images/services/services-redesign.webp)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          </div>
        </div>
      </section>

      <AnswerHighlightsSection
        eyebrow="Quick answers"
        title="The redesign questions buyers usually need answered fast"
        description="These answers help prospects self-diagnose quickly, which makes the page easier to understand for both decision-makers and AI-driven discovery systems."
        items={redesignAnswers}
      />

      <section data-reveal=".pain" className="py-24 bg-gray-950">
        <div className="pain mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="DIAGNOSIS"
            title="When website redesign in Lagos becomes the right move"
            description="Pick the problem that feels most accurate. This is how we approach website redesign in Lagos: by fixing what is actually hurting trust, speed, and lead generation."
          />

          <div className="mt-10 flex flex-wrap gap-2">
            {(["Outdated design", "Low enquiries", "Slow site", "Mobile issues"] as Pain[]).map(
              (x) => {
                const active = x === pain;
                return (
                  <button
                    key={x}
                    type="button"
                    onClick={() => setPain(x)}
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
              }
            )}
          </div>

          <div className="pain-panel mt-8 grid gap-6 md:grid-cols-2 md:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-7">
              <h3 className="text-2xl font-semibold">{p.title}</h3>
              <p className="mt-3 text-white/70 leading-relaxed">{p.text}</p>

              <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-5">
                <div className="text-sm font-semibold text-white/85">What we fix</div>
                <ul className="mt-3 space-y-2 text-sm text-white/65">
                  {p.fixes.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="/contact?service=Website Redesign"
                className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Request a Redesign Quote
              </a>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div
                className="h-[420px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: "url(/images/services/services-redesign-2.webp)" }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          </div>
        </div>
      </section>

      <section data-reveal=".process" className="py-24">
        <div className="process mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="PROCESS"
            title="How the website redesign process works"
            description="We do not randomly freshen up a homepage. We redesign around business goals, conversion flow, and the actions buyers should take next."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              ["Audit", "We review what is broken first: message, UX, speed, trust, and conversion flow."],
              ["Plan", "We restructure sections and conversion flow around your goals."],
              ["Redesign", "We rebuild the UI with modern layout, hierarchy, and proof."],
              ["Launch", "We polish, test, and launch with performance checks, usually within a focused 3-7 day redesign window depending on scope."],
            ].map(([t, d]) => (
              <div
                key={t}
                className="rounded-2xl border border-white/10 bg-black/40 p-7"
              >
                <h3 className="text-xl font-semibold">{t}</h3>
                <p className="mt-3 text-white/65">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal=".deliverables" className="py-24 bg-gray-950">
        <div className="deliverables mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="DELIVERABLES"
            title="What is included in a website redesign project"
            description="A strong website redesign should improve more than aesthetics. It should improve structure, trust, speed, and the quality of incoming enquiries."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Modern UI refresh", "Cleaner layout, better typography, modern spacing."],
              ["Clear messaging flow", "Sections that explain and persuade faster."],
              ["Trust signals", "Proof, testimonials, and credibility placed correctly."],
              ["Mobile-first improvements", "Better mobile layout and tap-friendly UX."],
              ["Speed improvements", "Optimised assets and performance cleanup."],
              ["Conversion-focused CTAs", "Stronger next-step guidance for visitors."],
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
                question: "Do I need a redesign or just optimisation?",
                answer:
                  "If the structure and UI are outdated or confusing, redesign is better. If the site looks fine but feels slow, optimisation might be enough. We can advise quickly.",
              },
              {
                question: "Can you keep my existing content and brand?",
                answer:
                  "Yes. We can keep what still works and rebuild what does not. Redesign is about improvement, not throwing everything away.",
              },
              {
                question: "Will a redesign affect my SEO?",
                answer:
                  "Handled properly, redesign can improve SEO. We keep structure clean, preserve important pages, and maintain SEO foundations.",
              },
            ]}
          />
        </div>
      </section>

      <section className="py-24 bg-gray-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12">
            <CorePageLinks
              eyebrow="Useful next steps"
              title="Move to the next page that fits your situation"
              description="Redesign is not always the first move. These links help prospects choose between diagnosis, speed fixes, SEO support, and direct contact without leaving the site confused."
              links={[
                {
                  href: "/services/website-audit",
                  label: "Audit",
                  title: "Need to diagnose the current site before website redesign in Lagos?",
                  description:
                    "Use the audit service if you want clarity on what is actually broken before you invest in a redesign.",
                },
                {
                  href: "/services/performance-optimisation",
                  label: "Speed",
                  title: "Need website speed optimization before a full redesign?",
                  description:
                    "Use the performance service if page speed and mobile lag are the biggest reasons buyers are dropping off right now.",
                },
                {
                  href: "/services/search-engine-optimisation",
                  label: "SEO",
                  title: "Need website redesign in Lagos with SEO support in mind?",
                  description:
                    "Use the SEO service if the redesign also needs stronger page clarity, internal linking, and search visibility support.",
                },
                {
                  href: "/contact?service=Website Redesign",
                  label: "Contact",
                  title: "Ready to discuss your website redesign in Lagos?",
                  description:
                    "Go to contact if you already know the current website is costing you trust, enquiries, or mobile conversions.",
                },
              ]}
            />
          </div>

          <CTASection
            eyebrow="READY"
            title="Ready to rebuild a website that is costing you leads?"
            description="We redesign underperforming websites into premium assets that earn trust faster and convert more of your existing traffic."
            primaryCtaText="Request a Quote"
            primaryHref="/contact?service=Website Redesign"
            secondaryCtaText="View Services"
            secondaryHref="/services"
            imageUrl="/images/services/services-redesign-cta.webp"
          />
        </div>
      </section>
    </div>
  );
}
