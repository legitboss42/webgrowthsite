"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import CorePageLinks from "@/components/CorePageLinks";
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

const landingPageAnswers = [
  {
    title: "Who actually needs a landing page?",
    answer:
      "Businesses running ads, campaigns, outreach, or focused offers usually need a dedicated landing page instead of sending traffic to a generic homepage.",
    href: "/blog/high-converting-landing-pages-guide",
    hrefLabel: "Read the landing page guide",
  },
  {
    title: "What usually hurts conversions first?",
    answer:
      "Weak message match, clutter, poor proof placement, and a CTA flow that asks visitors to think too hard before they act.",
    href: "/blog/why-your-website-isnt-getting-leads",
    hrefLabel: "See common conversion leaks",
  },
  {
    title: "Do I need this or a full website?",
    answer:
      "Choose this when one campaign or offer needs a focused page. Choose a full site when the business needs broader trust, service coverage, and ongoing content support.",
    href: "/services/business-website-design",
    hrefLabel: "See full website design",
  },
  {
    title: "What if I need it live quickly?",
    answer:
      "If speed matters more than a bigger build, the 48-hour launch offer can be the fast-start option before you move into more specialized pages.",
    href: "/launch",
    hrefLabel: "See the 48-hour launch",
  },
] as const;

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
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm tracking-[0.25em] text-white/50">
                LANDING PAGE DESIGN SERVICE
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                Landing page design that turns paid and social traffic into enquiries.
              </h1>
              <p className="mt-6 text-lg text-white/70 leading-relaxed">
                We build conversion-focused landing pages for ads, launches, and
                outreach campaigns with fast load speed, clear message match, and
                one high-intent call to action.
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

      <AnswerHighlightsSection
        eyebrow="Quick answers"
        title="What buyers usually want to understand before they request a landing page"
        description="These answers help people self-qualify faster and make the page easier for AI systems to summarize accurately."
        items={landingPageAnswers}
      />

      <section data-reveal=".problem" className="py-24 bg-gray-950">
        <div className="problem mx-auto max-w-4xl px-6">
          <SectionHeading
            eyebrow="WHY IT FAILS"
            title="What a landing page design service should fix first"
            description="It is not always the ads. Often the page is the real reason clicks fail to turn into leads, bookings, or sales."
          />

          <ul className="mt-10 space-y-4 text-white/70">
            {[
              "The headline is vague and does not match the ad message",
              "Too many distractions (menus, multiple offers, clutter)",
              "No proof, so visitors do not trust the offer",
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

      <section data-reveal=".goal" className="py-24">
        <div className="goal mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="PICK A GOAL"
            title="Choose the outcome your landing page needs to produce"
            description="Different goals need different structure. Pick your goal to see how a landing page design service in Lagos should shape the flow."
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
                Focused conversion structure: offer headline, proof, objection handling,
                and one friction-free CTA path.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-reveal=".deliverables" className="py-24 bg-gray-950">
        <div className="deliverables mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="DELIVERABLES"
            title="What is included in the landing page design service"
            description="Everything needed for a landing page that can actually convert campaign traffic into a measurable business action."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Message match", "Headline and sections aligned with the ad or campaign promise."],
              ["Conversion-focused structure", "One goal, one flow, fewer distractions."],
              ["Speed optimisation", "Fast mobile load to reduce drop-offs."],
              ["Proof + trust blocks", "Testimonials, logos, outcomes, or credibility signals placed correctly."],
              ["Strong CTA placement", "Buttons placed where visitors are ready to act."],
              ["Analytics-ready setup", "Built with measurement in mind so you can track what the page is doing."],
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
                question: "Do you write the landing page copy?",
                answer:
                  "We help structure and refine your messaging. If you do not have copy, we can craft conversion-focused sections based on your offer and audience.",
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

      <section className="py-24 bg-gray-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12">
            <CorePageLinks
              eyebrow="Useful next steps"
              title="Choose the page that best matches the rest of your funnel"
              description="Some businesses need a landing page, some need a broader website, and some need the message diagnosed first. These links keep that choice clear."
              links={[
                {
                  href: "/services/business-website-design",
                  label: "Website",
                  title: "Need more than a landing page design service in Lagos?",
                  description:
                    "Use the business website service if your company needs a broader online presence, not just one focused page.",
                },
                {
                  href: "/services/website-audit",
                  label: "Audit",
                  title: "Need to find the weak point first?",
                  description:
                    "Start with an audit if the funnel is underperforming and you are not fully sure whether the problem is message, speed, trust, or UX.",
                },
                {
                  href: "/launch",
                  label: "Fast launch",
                  title: "Need a focused page live quickly before a bigger funnel build?",
                  description:
                    "Use the 48-hour launch offer if the priority is getting a cleaner page online fast before you build a wider funnel.",
                },
                {
                  href: "/contact?service=Landing Page Design",
                  label: "Contact",
                  title: "Ready to discuss landing page design in Lagos?",
                  description:
                    "Go to contact if you already know the campaign, offer, and next action the page needs to support.",
                },
              ]}
            />
          </div>

          <CTASection
            eyebrow="READY"
            title="Stop paying for clicks that never convert"
            description="If your campaigns are active, your landing page should be your strongest conversion asset. We will engineer it that way."
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
