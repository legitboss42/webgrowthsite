import Link from "next/link";
import type { PortfolioCase } from "@/lib/portfolioCases";
import { ProofDeviceMockup } from "./HomepageVisuals";
import SectionShell from "./SectionShell";

type FeaturedProofSectionProps = {
  cases: PortfolioCase[];
};

export default function FeaturedProofSection({ cases }: FeaturedProofSectionProps) {
  const featured = cases[0];

  if (!featured) {
    return null;
  }

  return (
    <SectionShell tone="canvas" spacing="default">
      <div className="flex items-center gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Featured proof
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.9rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9ff_100%)] shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 px-6 py-8 md:px-8 md:py-8 lg:grid-cols-[0.72fr_0.98fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Featured proof
            </p>
            <h2 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-slate-950">
              Strategy that compounds.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-8 text-slate-600">
              We design and grow websites that earn trust, rank higher, and
              monetize better.
            </p>
            <div className="mt-7">
              <Link
                href="/portfolio/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-white px-6 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
              >
                Explore Case Studies -&gt;
              </Link>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.07)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Featured case study
            </p>
            <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              From 1K to 220K Monthly Visitors
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              How a content-led strategy and technical SEO overhaul scaled
              organic traffic by 220x in 12 months.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                ["220K+", "Monthly Visitors"],
                ["18.7K", "Top 3 Rankings"],
                ["$21K+", "Monthly Revenue"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-blue-700">
                    {value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm leading-7 text-slate-600">
                <span className="font-semibold text-slate-950">Business context:</span>{" "}
                {featured.summary}
              </p>
              <p className="text-sm leading-7 text-slate-600">
                <span className="font-semibold text-slate-950">What to notice:</span>{" "}
                {featured.whatToNotice}
              </p>
            </div>

            <Link
              href="/portfolio/"
              className="mt-6 inline-flex text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
            >
              View full case study -&gt;
            </Link>
          </div>

          <div className="relative min-h-[21rem] lg:min-h-[24rem]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(124,92,255,0.18),transparent_42%),radial-gradient(circle_at_18%_76%,rgba(79,107,255,0.16),transparent_40%)]" />
            <div className="pointer-events-none absolute right-2 top-2 h-16 w-32 rounded-full bg-[linear-gradient(90deg,rgba(79,107,255,0.18),rgba(124,92,255,0.22))] blur-2xl" />
            <ProofDeviceMockup />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
