"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Package = {
  name: string;
  price: string;
  bestFor: string;
  timeline: string;
  highlights: string[];
  deliverables: string[];
  cta: { label: string; href: string };
  badge?: string;
};

const WHATSAPP_URL = "https://wa.me/2348066706336";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
      {children}
    </span>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-white/70 leading-relaxed">
      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400/80" />
      <span>{children}</span>
    </li>
  );
}

function PricingCard({ pack }: { pack: Package }) {
  return (
    <div className="pricing-card group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-7 transition-transform duration-300 hover:-translate-y-2">
      {/* glow */}
      <div className="absolute -inset-24 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60 bg-emerald-500/20" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-white">{pack.name}</h3>
            <p className="mt-2 text-white/60 text-sm">{pack.bestFor}</p>
          </div>
          {pack.badge ? <Pill>{pack.badge}</Pill> : null}
        </div>

        <div className="mt-6">
          <div className="text-3xl font-bold text-white">{pack.price}</div>
          <div className="mt-2 text-sm text-white/55">
            Timeline: {pack.timeline}
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {pack.highlights.map((h) => (
            <li key={h} className="text-white/75 text-sm">
              <span className="text-emerald-300 font-semibold">•</span> {h}
            </li>
          ))}
        </ul>

        <div className="mt-7 grid gap-2">
          <Link
            href={pack.cta.href}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition"
          >
            {pack.cta.label}
          </Link>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
          >
            Ask on WhatsApp →
          </a>
        </div>

        <div className="mt-7 border-t border-white/10 pt-6">
          <div className="text-sm font-semibold text-white">What’s included</div>
          <ul className="mt-4 space-y-2">
            {pack.deliverables.map((d) => (
              <CheckItem key={d}>{d}</CheckItem>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left"
      >
        <span className="font-semibold text-white">{q}</span>
        <span className="text-emerald-300 font-bold">{open ? "–" : "+"}</span>
      </button>

      {open ? (
        <div className="px-6 pb-6 text-white/70 leading-relaxed">{a}</div>
      ) : null}
    </div>
  );
}

export default function PricingClient() {
  const topRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLElement | null>(null);
  const notesRef = useRef<HTMLElement | null>(null);
  const faqRef = useRef<HTMLElement | null>(null);

  const packages: Package[] = useMemo(
    () => [
      {
        name: "Starter",
        price: "₦150,000",
        bestFor: "New businesses needing a clean, credible online presence.",
        timeline: "7–10 days",
        highlights: [
          "Up to 5 pages",
          "₦20,000 per extra page",
          "Mobile-first build",
          "Basic SEO setup",
          "Fast performance baseline",
        ],
        deliverables: [
          "Homepage + About + Services + Contact + 1 extra page",
          "Conversion-focused structure (clear sections + CTAs)",
          "Speed + responsiveness checks",
          "Basic SEO (titles, meta, headings)",
          "Launch-ready static deployment",
        ],
        cta: { label: "Request Starter Quote", href: "/contact" },
      },
      {
        name: "Growth",
        price: "₦250,000",
        bestFor: "Businesses that want stronger conversion + better brand presence.",
        timeline: "10–14 days",
        highlights: [
          "Up to 8 pages",
          "₦20,000 per extra page",
          "More animations/interactions",
          "Better content sections",
          "On-page SEO polish",
        ],
        deliverables: [
          "Up to 8 pages (or 1 landing page + more sections)",
          "Stronger conversion sections (social proof, process, FAQs)",
          "SEO polish (titles, meta, internal links)",
          "Image placeholders + structure for case studies",
          "Launch + post-launch fixes (7 days)",
        ],
        cta: { label: "Request Growth Quote", href: "/contact" },
        badge: "Most popular",
      },
      {
        name: "Pro",
        price: "₦400,000",
        bestFor: "Brands that want premium design, stronger storytelling, and scale.",
        timeline: "2–3 weeks",
        highlights: [
          "Up to 12 pages",
          "₦20,000 per extra page",
          "Premium UI + motion",
          "Stronger funnel structure",
          "Advanced SEO foundations",
        ],
        deliverables: [
          "Up to 12 pages / multi-service structure",
          "Premium layout polish (spacing, hierarchy, micro-interactions)",
          "SEO foundations (metadata consistency, internal linking plan)",
          "Analytics setup (basic)",
          "Launch + post-launch support (14 days)",
        ],
        cta: { label: "Request Pro Quote", href: "/contact" },
      },
    ],
    []
  );

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    if (topRef.current) {
      gsap.fromTo(
        ".pricing-hero",
        { opacity: 0, y: 26, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
        }
      );
    }

    if (gridRef.current) {
      gsap.fromTo(
        ".pricing-card",
        { opacity: 0, y: 60, scale: 0.98, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: gridRef.current, start: "top 75%" },
        }
      );
    }

    if (notesRef.current) {
      gsap.fromTo(
        ".pricing-note",
        { opacity: 0, y: 50, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: notesRef.current, start: "top 80%" },
        }
      );
    }

    if (faqRef.current) {
      gsap.fromTo(
        ".pricing-faq",
        { opacity: 0, y: 50, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: faqRef.current, start: "top 80%" },
        }
      );
    }

    ScrollTrigger.refresh();
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section ref={topRef} className="relative overflow-hidden py-24 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.20),transparent_55%)]" />
        <div className="mx-auto max-w-6xl px-6 relative pricing-hero">
          <div className="flex flex-col items-start gap-4">
            <Pill>PRICING</Pill>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Transparent packages. No confusing nonsense.
            </h1>
            <p className="max-w-2xl text-white/70 text-lg leading-relaxed">
              Choose a package that fits your stage. If you need something custom,
              we’ll scope it and give you a clear proposal.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition"
              >
                Request a Quote
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
              >
                WhatsApp us →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section ref={gridRef} className="relative py-20 bg-gray-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {packages.map((p) => (
              <PricingCard key={p.name} pack={p} />
            ))}
          </div>
        </div>
      </section>

      {/* NOTES / EXTRAS */}
      <section ref={notesRef} className="relative py-20 bg-black">
        <div className="mx-auto max-w-6xl px-6">
          <div className="pricing-note rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-8">
            <h2 className="text-2xl font-bold">Hosting & Domain (client pays)</h2>
            <p className="mt-3 text-white/70 leading-relaxed max-w-3xl">
              We separate build cost from hosting so you always know what you’re paying for.
              We can set it up for you, but these are billed to you.
            </p>

            {/* Hosting providers */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white">
                Hosting providers we work with
              </h3>
              <p className="mt-2 text-white/60 text-sm max-w-2xl">
                You choose and pay for hosting directly. We’ll deploy and configure
                your site on any of these platforms.
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {[
                  { name: "Namecheap", src: "/images/brand/namecheap.png" },
                  { name: "Bluehost", src: "/images/brand/bluehost.png" },
                  { name: "Hostinger", src: "/images/brand/hostinger.png" },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center gap-4"
                  >
                    <img
                      src={p.src}
                      alt={`${p.name} logo`}
                      className="h-10 w-auto object-contain opacity-90"
                      loading="lazy"
                    />
                    <div className="text-white font-semibold">{p.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add-ons + requirements */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm font-semibold text-white">Common add-ons</div>
                <ul className="mt-4 space-y-2">
                  <CheckItem>Extra pages / new sections (₦20,000 per page)</CheckItem>
                  <CheckItem>Copywriting / content polishing</CheckItem>
                  <CheckItem>Logo / brand assets (basic)</CheckItem>
                  <CheckItem>Booking setup (Calendly / WhatsApp / external tools)</CheckItem>
                  <CheckItem>Ongoing updates & maintenance</CheckItem>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm font-semibold text-white">
                  What we’ll need from you
                </div>
                <ul className="mt-4 space-y-2">
                  <CheckItem>Business name + short description</CheckItem>
                  <CheckItem>Services list + pricing if you want</CheckItem>
                  <CheckItem>Logo (or we use a placeholder)</CheckItem>
                  <CheckItem>Photos (or we use placeholders)</CheckItem>
                  <CheckItem>Contact details (email/WhatsApp/address)</CheckItem>
                </ul>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
              >
                View Services →
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition"
              >
                Start a Project →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faqRef} className="relative py-20 bg-gray-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="pricing-faq max-w-3xl">
            <Pill>FAQ</Pill>
            <h2 className="mt-4 text-3xl font-bold">Questions people actually ask</h2>
            <p className="mt-3 text-white/70">Clear answers so you don’t guess.</p>

            <div className="mt-8 grid gap-4">
              <FAQItem
                q="Is this a get-rich-quick thing?"
                a="No. A website is a growth asset - it helps you look credible, communicate clearly, and convert visitors into enquiries. Results depend on your offer, messaging, traffic, and consistency."
              />
              <FAQItem
                q="Do you include domain and hosting in the package price?"
                a="No - domain and hosting are billed separately so you always control your accounts. We can recommend a provider and guide setup (Namecheap, Bluehost, or Hostinger)."
              />
              <FAQItem
                q="How much is an extra page?"
                a="₦20,000 per extra page across all packages."
              />
              <FAQItem
                q="Can I pay in milestones?"
                a="Yes. For most builds, we do 60% upfront to start, and 40% before launch. For larger builds, we split into 3 milestones."
              />
              <FAQItem
                q="Do you do e-commerce?"
                a="Yes - but it’s scoped separately depending on products, payment flow, and required integrations. If you want it, request a quote and we’ll scope it properly."
              />
              <FAQItem
                q="How do updates work after launch?"
                a="We can handle updates on request or set a monthly maintenance plan (content edits, small changes, monitoring)."
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


