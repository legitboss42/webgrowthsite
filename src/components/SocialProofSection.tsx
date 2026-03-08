"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import CaseStudyCard from "@/components/CaseStudyCard";
import type { PortfolioCase } from "@/lib/portfolioCases";

export default function SocialProofSection({
  cards,
}: {
  cards: readonly PortfolioCase[];
}) {
  const initialState = useMemo(
    () =>
      cards.reduce<Record<string, boolean>>((acc, item, index) => {
        acc[item.title] = index === 0;
        return acc;
      }, {}),
    [cards]
  );

  const [openCards, setOpenCards] = useState<Record<string, boolean>>(initialState);

  const toggleCard = (title: string) => {
    setOpenCards((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  return (
    <section className="border-b border-white/10 bg-[#060907] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            Social proof
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
            Selected portfolio launches
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
            These are real examples already featured on the portfolio page, chosen
            to show the kind of launch quality, clarity, and conversion structure
            the 48-hour offer is built around.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-3">
          {cards.map((item) => {
            const isOpen = openCards[item.title];

            return (
              <div key={item.title} className="flex h-full flex-col gap-4">
                <CaseStudyCard
                  title={item.title}
                  client={item.client}
                  summary={item.summary}
                  results={item.results}
                  imageUrl={item.imageUrl}
                  href="/portfolio"
                  className="h-full"
                />

                <div className="relative overflow-hidden rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.21),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:22px_22px] opacity-15" />

                  <button
                    type="button"
                    onClick={() => toggleCard(item.title)}
                    className="relative z-10 flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="inline-flex rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs uppercase tracking-[0.12em] text-emerald-200/90">
                      {item.type}
                    </span>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/90 transition hover:text-emerald-200">
                      {isOpen ? "Hide Actions" : "Show Actions"}
                      <span aria-hidden="true">{isOpen ? "-" : "+"}</span>
                    </span>
                  </button>

                  <div
                    className={[
                      "grid transition-all duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-70",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <div className="relative z-10 border-t border-white/15 px-5 pb-5 pt-4">
                        <p className="text-sm font-semibold text-white/90">
                          What was included
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/74">
                          {item.stack.map((detail) => (
                            <li key={detail} className="flex gap-3">
                              <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <Link
                            href="/portfolio"
                            className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                          >
                            View Portfolio
                          </Link>
                          <Link
                            href="/launch"
                            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
                          >
                            Launch in 48 Hours
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
