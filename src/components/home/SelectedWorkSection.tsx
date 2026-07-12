import Image from "next/image";
import Link from "next/link";
import type { PortfolioCase } from "@/lib/portfolioCases";
import SectionShell from "./SectionShell";

type SelectedWorkSectionProps = {
  cases: PortfolioCase[];
};

const fallbackCases = [
  {
    title: "SEO / Content",
    eyebrow: "01 / SEO / Content",
    metric: "220x",
    description: "From 1K to 220K monthly visitors through content-led growth.",
    href: "/portfolio/",
  },
  {
    title: "Business Website",
    eyebrow: "02 / Website Redesign",
    metric: "Trust",
    description: "Clearer service pages, stronger trust paths, and better mobile journeys.",
    href: "/services/website-redesign/",
  },
  {
    title: "Landing Page",
    eyebrow: "03 / Conversion",
    metric: "Leads",
    description: "Focused landing pages built around one offer, one audience, one action.",
    href: "/services/landing-page-design/",
  },
] as const;

export default function SelectedWorkSection({ cases }: SelectedWorkSectionProps) {
  const selected = cases.slice(0, 3);

  return (
    <SectionShell tone="canvas" spacing="compact">
      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
        <div data-reveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold">
            Selected work
          </p>
          <h2 className="font-display mt-4 max-w-lg text-5xl font-medium leading-[0.95] tracking-[-0.06em] text-text-primary">
            Results, not renderings.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-text-muted">
            A more editorial proof section inspired by the reference, grounded in
            the real local portfolio and existing service routes.
          </p>
        </div>

        <div data-stagger className="grid gap-4 md:grid-cols-3">
          {(selected.length ? selected : fallbackCases).map((item, index) => {
            const isPortfolioCase = "client" in item;
            const title = isPortfolioCase ? item.title : item.title;
            const description = isPortfolioCase ? item.summary : item.description;
            const href = isPortfolioCase ? "/portfolio/" : item.href;
            const imageUrl = isPortfolioCase ? item.imageUrl : "/images/cinematic/case-study-bg.webp";
            const imageAlt = isPortfolioCase ? item.imageAlt : "";
            const metric = isPortfolioCase ? item.results[0] ?? item.type : item.metric;

            return (
              <Link
                key={title}
                href={href}
                className="wg-card-hover group relative min-h-[22rem] overflow-hidden rounded-[1.45rem] border border-border-hairline bg-bg-ink shadow-[0_24px_70px_rgba(0,0,0,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
              >
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover opacity-42 transition duration-500 group-hover:scale-105 group-hover:opacity-55"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(12,15,20,0.2),rgba(12,15,20,0.92))]" />
                <div className="relative z-10 flex h-full min-h-[22rem] flex-col justify-between p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-gold">
                      {isPortfolioCase ? `${String(index + 1).padStart(2, "0")} / ${item.type}` : item.eyebrow}
                    </p>
                    <span className="rounded-full border border-accent-gold/25 bg-accent-gold/10 px-3 py-1 text-xs font-semibold text-accent-gold">
                      {metric}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-medium leading-tight tracking-[-0.04em] text-text-primary">
                      {title}
                    </h3>
                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-text-muted">
                      {description}
                    </p>
                    <p className="mt-5 text-sm font-semibold text-accent-gold">
                      Read case study -&gt;
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}
