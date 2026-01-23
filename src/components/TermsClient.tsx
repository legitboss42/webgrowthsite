"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const COMPANY_NAME = "Web Growth";
const WEBSITE_URL = "https://webgrowth.info";
const CONTACT_EMAIL = "admin@webgrowth.info";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
      {children}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="terms-block rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-7">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 text-white/70 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function TermsClient() {
  const topRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    if (topRef.current) {
      gsap.fromTo(
        ".terms-hero",
        { opacity: 0, y: 26, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out" }
      );

      gsap.fromTo(
        ".terms-block",
        { opacity: 0, y: 50, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: topRef.current, start: "top 70%" },
        }
      );
    }

    ScrollTrigger.refresh();
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section ref={topRef} className="relative overflow-hidden py-20 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="mx-auto max-w-6xl px-6 relative terms-hero">
          <div className="flex flex-col items-start gap-4">
            <Pill>LEGAL</Pill>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Terms of Service
            </h1>
            <p className="max-w-3xl text-white/70 text-lg leading-relaxed">
              These Terms of Service govern your use of {WEBSITE_URL} and, where
              applicable, the terms under which {COMPANY_NAME} provides web design
              and development services.
            </p>

            <div className="text-white/55 text-sm">
              Last updated: <span className="text-white/70">January 2026</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition"
              >
                Contact Us
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
              >
                Back to Home →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="relative py-16 bg-gray-950">
        <div className="mx-auto max-w-6xl px-6 space-y-6">
          <Section title="1) Use of the website">
            <p>
              You agree to use this website for lawful purposes only. You must not
              attempt to disrupt, damage, or gain unauthorized access to any part
              of the website or related systems.
            </p>
          </Section>

          <Section title="2) Enquiries and proposals">
            <p>
              Information on this site is provided for general purposes. Any quote,
              proposal, or timeline is confirmed only after we review your project
              requirements and agree on scope in writing.
            </p>
          </Section>

          <Section title="3) Scope of work">
            <p>
              Project scope is defined in writing (proposal, statement of work, or
              agreement). Work outside the agreed scope may require additional fees
              and timeline adjustments.
            </p>
          </Section>

          <Section title="4) Client responsibilities">
            <p>You agree to provide, in a timely manner:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Accurate business information, content, and assets (logo/images)</li>
              <li>Feedback and approvals needed to progress the project</li>
              <li>Access to tools/accounts where required (hosting, domain, CMS, etc.)</li>
            </ul>
            <p>
              Delays in providing these may affect delivery timelines.
            </p>
          </Section>

          <Section title="5) Payments">
            <p>
              Payment terms (including deposits and milestones) are defined in your
              proposal or invoice. Work may pause if payments are not made according
              to agreed terms.
            </p>
          </Section>

          <Section title="6) Revisions">
            <p>
              Reasonable revisions are included as stated in your package/proposal.
              Excessive revisions or changes outside scope may require additional
              fees.
            </p>
          </Section>

          <Section title="7) Intellectual property">
            <p>
              Unless stated otherwise, once final payment is received, you own the
              final deliverables provided specifically for your project. We may reuse
              general techniques, reusable components, and non-client-specific code.
            </p>
            <p>
              We may display completed work in our portfolio unless you request
              otherwise in writing.
            </p>
          </Section>

          <Section title="8) Third-party tools and services">
            <p>
              Your website may rely on third-party services (hosting, plugins,
              analytics, email tools). We are not responsible for outages, changes,
              or limitations imposed by third parties.
            </p>
          </Section>

          <Section title="9) Warranties and limitations">
            <p>
              We provide services with reasonable care and skill, but we do not
              guarantee specific business outcomes (sales, rankings, revenue).
              Results depend on market, offer, traffic, and many factors outside
              our control.
            </p>
            <p>
              To the maximum extent permitted by law, {COMPANY_NAME} will not be
              liable for indirect, incidental, or consequential damages.
            </p>
          </Section>

          <Section title="10) Termination">
            <p>
              Either party may end a project with written notice. Work completed up
              to termination remains payable. Where possible, we will hand over
              deliverables produced up to that point.
            </p>
          </Section>

          <Section title="11) Changes to these terms">
            <p>
              We may update these Terms from time to time. Updated terms will be
              posted on this page with a revised “Last updated” date.
            </p>
          </Section>

          <Section title="12) Contact">
            <p>
              Questions about these Terms? Email us at{" "}
              <a
                className="text-emerald-300 font-semibold hover:text-emerald-200"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>
      </section>
    </main>
  );
}