"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/**
 * TEMPLATE-BASED MOCKUP (Visual preview inside site)
 * - Uses existing images in /public/images/...
 * - Produces a realistic “mock website” preview based on simple inputs
 */

type Niche =
  | "aesthetic_clinic"
  | "service_business"
  | "ecommerce_store"
  | "agency"
  | "restaurant";

type MockupInput = {
  businessName: string;
  niche: Niche;
  offer: string;
  goal: "leads" | "bookings" | "sales";
};

type Theme = {
  accent: "emerald" | "blue" | "amber";
};

type Section =
  | { type: "hero"; headline: string; subhead: string; imageUrl: string; cta: string }
  | { type: "features"; title: string; items: { title: string; text: string }[] }
  | { type: "services"; title: string; items: { title: string; text: string; imageUrl: string }[] }
  | { type: "socialProof"; title: string; items: { name: string; text: string }[] }
  | { type: "cta"; title: string; text: string; imageUrl: string; primary: string; secondary: string };

type Mockup = {
  theme: Theme;
  sections: Section[];
};

const NICHE_LABELS: Record<Niche, string> = {
  aesthetic_clinic: "Aesthetic Clinic",
  service_business: "Service Business",
  ecommerce_store: "E-commerce Store",
  agency: "Agency",
  restaurant: "Restaurant",
};

function buildMockup(input: MockupInput): Mockup {
  // Existing image pool (use what you already have)
  const images = {
    hero: {
      aesthetic_clinic: "/images/portfolio/jluxe-mockup.png",
      service_business: "/images/portfolio/service-upgrade.png",
      ecommerce_store: "/images/services/services-ecommerce.png",
      agency: "/images/hero/Hero-Image-1.png",
      restaurant: "/images/backgrounds/services-bg.png",
    },
    service1: "/images/services/services-business.png",
    service2: "/images/services/services-landing.png",
    service3: "/images/services/services-redesign.png",
    cta: "/images/services/services-cta.png",
  };

  const accent: Theme["accent"] =
    input.goal === "sales" ? "amber" : input.goal === "bookings" ? "blue" : "emerald";

  const heroHeadline =
    input.goal === "sales"
      ? `Sell more with a website built for conversions`
      : input.goal === "bookings"
      ? `Get more bookings with a website people trust`
      : `Get more leads with a clear, high-performance website`;

  const heroSubhead = `This is a mockup preview for ${input.businessName}. Built around your offer: “${input.offer}”.`;

  const sections: Section[] = [
    {
      type: "hero",
      headline: heroHeadline,
      subhead: heroSubhead,
      imageUrl: images.hero[input.niche],
      cta: input.goal === "sales" ? "Shop now" : input.goal === "bookings" ? "Book now" : "Request a quote",
    },
    {
      type: "features",
      title: "Why this layout works",
      items: [
        { title: "Clarity first", text: "Visitors understand what you do in 5 seconds." },
        { title: "Trust signals", text: "Proof + structure that reduces doubt and increases action." },
        { title: "Conversion flow", text: "Every section guides the visitor to one next step." },
      ],
    },
    {
      type: "services",
      title: "What you offer",
      items: [
        { title: "Core Offer", text: input.offer, imageUrl: images.service1 },
        { title: "Secondary Service", text: "A supporting service that boosts perceived value.", imageUrl: images.service2 },
        { title: "Premium Option", text: "A higher-ticket option for serious buyers.", imageUrl: images.service3 },
      ],
    },
    {
      type: "socialProof",
      title: "What clients say",
      items: [
        { name: "Client A", text: "Clean, fast, and serious. We started getting better enquiries." },
        { name: "Client B", text: "The site finally explains what we do properly. People trust us more." },
        { name: "Client C", text: "Mobile looks premium. Customers stopped asking basic questions." },
      ],
    },
    {
      type: "cta",
      title: "Want us to build this for you?",
      text: "This is a preview mockup. We can build the full version, set it up properly, and optimize it for results.",
      imageUrl: images.cta,
      primary: "Request a Quote",
      secondary: "View Pricing",
    },
  ];

  return { theme: { accent }, sections };
}

function AccentClasses({ accent }: { accent: Theme["accent"] }) {
  // Just a helper to keep styles consistent
  return (
    <style>{`
      .accent-bg { background: ${
        accent === "emerald" ? "rgba(16,185,129,0.18)" : accent === "blue" ? "rgba(59,130,246,0.18)" : "rgba(245,158,11,0.18)"
      }; }
      .accent-text { color: ${
        accent === "emerald" ? "rgb(110,231,183)" : accent === "blue" ? "rgb(147,197,253)" : "rgb(252,211,77)"
      }; }
      .accent-btn { background: ${
        accent === "emerald" ? "rgb(5,150,105)" : accent === "blue" ? "rgb(37,99,235)" : "rgb(217,119,6)"
      }; }
      .accent-btn:hover { filter: brightness(1.08); }
    `}</style>
  );
}

export default function MockupClient() {
  const [input, setInput] = useState<MockupInput>({
    businessName: "Your Business Name",
    niche: "service_business",
    offer: "A clear service offer that solves a real problem",
    goal: "leads",
  });

  const mockup = useMemo(() => buildMockup(input), [input]);

  return (
    <main className="min-h-screen bg-black text-white">
      <AccentClasses accent={mockup.theme.accent} />

      {/* Top controls */}
      <section className="border-b border-white/10 bg-black/60 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-white font-semibold">Mockup Builder (Template Preview)</div>
            <div className="text-white/60 text-sm">
              This is a visual preview inside your site — no AI images, just your existing library.
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={input.businessName}
              onChange={(e) => setInput((p) => ({ ...p, businessName: e.target.value }))}
              className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              placeholder="Business name"
            />

            <select
              value={input.niche}
              onChange={(e) => setInput((p) => ({ ...p, niche: e.target.value as Niche }))}
              className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              {Object.keys(NICHE_LABELS).map((k) => (
                <option key={k} value={k} className="bg-black">
                  {NICHE_LABELS[k as Niche]}
                </option>
              ))}
            </select>

            <select
              value={input.goal}
              onChange={(e) => setInput((p) => ({ ...p, goal: e.target.value as MockupInput["goal"] }))}
              className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="leads" className="bg-black">Leads</option>
              <option value="bookings" className="bg-black">Bookings</option>
              <option value="sales" className="bg-black">Sales</option>
            </select>

            <input
              value={input.offer}
              onChange={(e) => setInput((p) => ({ ...p, offer: e.target.value }))}
              className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              placeholder="Offer"
            />
          </div>
        </div>
      </section>

      {/* Render sections */}
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-16">
        {mockup.sections.map((s, idx) => {
          if (s.type === "hero") {
            return (
              <section key={idx} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <div className="absolute inset-0 accent-bg" />
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-60"
                  style={{ backgroundImage: `url(${s.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-black/55" />
                <div className="relative z-10 p-10 md:p-14 grid gap-8 md:grid-cols-2 md:items-center">
                  <div>
                    <div className="text-xs tracking-[0.25em] text-white/55">HOME</div>
                    <h1 className="mt-4 text-4xl md:text-5xl font-bold leading-tight">{s.headline}</h1>
                    <p className="mt-5 text-white/70 text-lg leading-relaxed">{s.subhead}</p>
                    <div className="mt-8 flex gap-3 flex-wrap">
                      <button className="accent-btn rounded-md px-6 py-3 text-sm font-semibold text-white">
                        {s.cta}
                      </button>
                      <Link
                        href="/contact"
                        className="rounded-md border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
                      >
                        Talk to Web Growth →
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                    <div className="text-sm font-semibold">Preview Notes</div>
                    <ul className="mt-4 space-y-2 text-white/70 text-sm">
                      <li>• Uses your existing images</li>
                      <li>• Template-driven sections</li>
                      <li>• Goal-based CTA + tone</li>
                    </ul>
                  </div>
                </div>
              </section>
            );
          }

          if (s.type === "features") {
            return (
              <section key={idx} className="rounded-2xl border border-white/10 bg-black/40 p-10">
                <h2 className="text-3xl font-bold">{s.title}</h2>
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  {s.items.map((it) => (
                    <div key={it.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <div className="accent-text font-semibold">{it.title}</div>
                      <p className="mt-2 text-white/70 leading-relaxed">{it.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (s.type === "services") {
            return (
              <section key={idx}>
                <div className="flex items-end justify-between gap-4">
                  <h2 className="text-3xl font-bold">{s.title}</h2>
                  <Link className="text-sm text-white/70 hover:text-white transition" href="/services">
                    View services →
                  </Link>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  {s.items.map((it) => (
                    <div key={it.title} className="group overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                      <div
                        className="h-44 bg-cover bg-center opacity-80 transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${it.imageUrl})` }}
                      />
                      <div className="p-6">
                        <div className="text-xl font-semibold">{it.title}</div>
                        <p className="mt-2 text-white/70 leading-relaxed">{it.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (s.type === "socialProof") {
            return (
              <section key={idx} className="rounded-2xl border border-white/10 bg-gray-950 p-10">
                <h2 className="text-3xl font-bold">{s.title}</h2>
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  {s.items.map((it) => (
                    <div key={it.name} className="rounded-2xl border border-white/10 bg-black/40 p-6">
                      <div className="text-white font-semibold">{it.name}</div>
                      <p className="mt-2 text-white/70 leading-relaxed">“{it.text}”</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (s.type === "cta") {
            return (
              <section key={idx} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-70"
                  style={{ backgroundImage: `url(${s.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                  <div className="max-w-2xl">
                    <h2 className="text-3xl md:text-4xl font-bold">{s.title}</h2>
                    <p className="mt-3 text-white/70 text-lg leading-relaxed">{s.text}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/contact" className="accent-btn rounded-md px-6 py-3 text-sm font-semibold text-white text-center">
                      {s.primary}
                    </Link>
                    <Link href="/pricing" className="rounded-md border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 hover:bg-white/10 transition text-center">
                      {s.secondary}
                    </Link>
                  </div>
                </div>
              </section>
            );
          }

          return null;
        })}
      </div>
    </main>
  );
}
