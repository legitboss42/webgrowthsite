import Image from "next/image";
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
      <div data-reveal className="flex items-center gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">
          Featured proof
        </p>
      </div>

      <div
        data-reveal
        data-parallax-section
        className="relative mt-5 overflow-hidden rounded-[1.9rem] border border-border-hairline bg-[linear-gradient(180deg,rgba(237,234,233,0.065)_0%,rgba(27,110,99,0.055)_100%)] shadow-[0_28px_70px_rgba(0,0,0,0.28)]"
      >
        <Image
          data-parallax-bg
          src="/images/cinematic/case-study-bg.webp"
          alt=""
          fill
          loading="lazy"
          sizes="(max-width: 1280px) 100vw, 1240px"
          className="scale-110 object-cover opacity-[0.48]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(12,15,20,0.2),rgba(12,15,20,0.9))]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent-gold/16 blur-3xl" />
        <div className="relative z-10 grid gap-6 px-6 py-8 md:px-8 md:py-8 lg:grid-cols-[0.72fr_0.98fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">
              Featured proof
            </p>
            <h2 className="font-display mt-4 text-5xl font-medium tracking-[-0.06em] text-text-primary">
              Strategy that compounds.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-8 text-text-muted">
              We design and grow websites around trust, discoverability, and
              useful next steps.
            </p>
            <div className="mt-7">
              <Link
                href="/portfolio/"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-accent-gold/40 bg-white/[0.04] px-6 text-sm font-semibold text-accent-gold transition hover:bg-accent-gold hover:text-bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
              >
                Explore Case Studies -&gt;
              </Link>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-border-hairline bg-bg-ink/78 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">
              Featured case study
            </p>
            <p className="font-display mt-4 text-2xl font-medium tracking-[-0.04em] text-text-primary">
              A case study built around clearer decisions
            </p>
            <p className="mt-3 text-sm leading-7 text-text-muted">
              Review the project context, design decisions, and qualitative
              outcomes without turning an illustrative dashboard into a claim.
            </p>

            <div data-stagger className="mt-6 grid grid-cols-3 gap-3">
              {[
                ["01", "Project context"],
                ["02", "Design decisions"],
                ["03", "Qualitative notes"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-border-hairline bg-white/[0.035] p-3">
                  <p
                    data-count-to={value}
                    className="font-display text-3xl font-medium tracking-[-0.04em] text-accent-gold"
                  >
                    {value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-text-muted">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm leading-7 text-text-muted">
                <span className="font-semibold text-text-primary">Business context:</span>{" "}
                {featured.summary}
              </p>
              <p className="text-sm leading-7 text-text-muted">
                <span className="font-semibold text-text-primary">What to notice:</span>{" "}
                {featured.whatToNotice}
              </p>
            </div>

            <Link
              href="/portfolio/"
              className="mt-6 inline-flex text-sm font-semibold text-accent-gold transition hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
            >
              View full case study -&gt;
            </Link>
          </div>

          <div className="relative min-h-[21rem] lg:min-h-[24rem]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(232,163,61,0.14),transparent_42%),radial-gradient(circle_at_18%_76%,rgba(27,110,99,0.18),transparent_40%)]" />
            <div className="pointer-events-none absolute right-2 top-2 h-16 w-32 rounded-full bg-accent-gold/14 blur-2xl" />
            <ProofDeviceMockup />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
