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
    <section className="privacy-block rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-7">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 text-white/70 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyClient() {
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
        ".privacy-hero",
        { opacity: 0, y: 26, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out" }
      );

      gsap.fromTo(
        ".privacy-block",
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
        <div className="mx-auto max-w-6xl px-6 relative privacy-hero">
          <div className="flex flex-col items-start gap-4">
            <Pill>LEGAL</Pill>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Privacy Policy
            </h1>
            <p className="max-w-3xl text-white/70 text-lg leading-relaxed">
              This Privacy Policy explains how {COMPANY_NAME} collects, uses, and
              protects information when you visit {WEBSITE_URL} or contact us for
              services.
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
          <Section title="1) Information we collect">
            <p>
              We may collect information you provide directly to us, such as your
              name, email address, phone number, company name, and any details
              you submit through our contact forms or messages.
            </p>
            <p>
              We may also collect basic technical data when you use the site (for
              example, pages visited and device/browser type) through standard
              analytics tools.
            </p>
          </Section>

          <Section title="2) How we use your information">
            <p>We use information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Respond to enquiries and provide quotes/proposals</li>
              <li>Deliver and improve our services</li>
              <li>Maintain website security and performance</li>
              <li>Send important updates related to your project (if applicable)</li>
            </ul>
          </Section>

          <Section title="3) Cookies and analytics">
            <p>
              We may use cookies or similar technologies to improve your browsing
              experience and to understand how visitors use our website. You can
              disable cookies in your browser settings, but some site features
              may not work as intended.
            </p>
          </Section>

          <Section title="4) Sharing of information">
            <p>
              We do not sell your personal information. We may share information
              only when necessary to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide services you requested (e.g., third-party tools you approve)</li>
              <li>Comply with legal obligations</li>
              <li>Protect our rights, safety, and security</li>
            </ul>
          </Section>

          <Section title="5) Data retention">
            <p>
              We retain information only as long as needed to respond to enquiries,
              provide services, meet legal obligations, or resolve disputes.
            </p>
          </Section>

          <Section title="6) Data security">
            <p>
              We take reasonable measures to protect your information. However,
              no website or online transmission is 100% secure. Use the site at
              your own risk.
            </p>
          </Section>

          <Section title="7) Your rights">
            <p>
              You may request access, correction, or deletion of your personal
              information by contacting us at{" "}
              <a className="text-emerald-300 font-semibold hover:text-emerald-200" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="8) Third-party links">
            <p>
              Our website may contain links to third-party websites or tools. We
              are not responsible for their content or privacy practices.
            </p>
          </Section>

          <Section title="9) Contact">
            <p>
              For privacy questions, contact us at{" "}
              <a className="text-emerald-300 font-semibold hover:text-emerald-200" href={`mailto:${CONTACT_EMAIL}`}>
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