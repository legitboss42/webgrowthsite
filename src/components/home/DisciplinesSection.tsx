import Image from "next/image";
import Link from "next/link";
import { BuildIcon, GrowthChartIcon, OptimizeIcon } from "./HomeIcons";
import SectionShell from "./SectionShell";

const disciplines = [
  {
    number: "01",
    label: "Design",
    title: "Websites drawn like architecture.",
    description:
      "Every page needs a job: hierarchy, sightlines, trust, and conversion paths planned before decoration starts.",
    tags: ["Business Websites", "Website Redesign", "Landing Pages", "eCommerce"],
    href: "/services/business-website-design/",
    icon: <BuildIcon />,
    image: "/images/cinematic/hero-bg.webp",
  },
  {
    number: "02",
    label: "SEO",
    title: "Rankings built on structure.",
    description:
      "Technical SEO, editorial content, and clean information architecture make traffic compound instead of leak.",
    tags: ["Technical SEO", "Content Systems", "Audits", "Internal Links"],
    href: "/services/search-engine-optimisation/",
    icon: <GrowthChartIcon />,
    image: "/images/cinematic/case-study-bg.webp",
  },
  {
    number: "03",
    label: "Performance",
    title: "Speed as a competitive edge.",
    description:
      "Core Web Vitals, image discipline, and lean interaction design keep cinematic pages commercially usable.",
    tags: ["Core Web Vitals", "Image Pipeline", "UX", "Monitoring"],
    href: "/services/performance-optimisation/",
    icon: <OptimizeIcon />,
    image: "/images/cinematic/growth-cycle-bg.webp",
  },
] as const;

export default function DisciplinesSection() {
  return (
    <SectionShell tone="canvas" spacing="default">
      <div data-reveal className="mb-7 grid gap-4 md:grid-cols-[0.72fr_1.28fr] md:items-end">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold">
          What we do
        </p>
        <h2 className="font-display max-w-3xl text-5xl font-medium leading-[0.98] tracking-[-0.06em] text-text-primary">
          Three disciplines. One standard.
        </h2>
      </div>

      <div data-stagger className="grid gap-5">
        {disciplines.map((discipline) => (
          <article
            key={discipline.label}
            className="grid overflow-hidden rounded-[1.65rem] border border-border-hairline bg-[#11161f]/78 shadow-[0_24px_70px_rgba(0,0,0,0.26)] lg:grid-cols-[0.74fr_1.26fr]"
          >
            <div className="relative min-h-[16rem] overflow-hidden">
              <Image
                src={discipline.image}
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover opacity-62"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(12,15,20,0.12),rgba(12,15,20,0.86))]" />
              <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border border-accent-gold/25 bg-accent-gold/10 text-accent-gold">
                {discipline.icon}
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold">
                  {discipline.number} / {discipline.label}
                </p>
              </div>
              <h3 className="font-display mt-4 text-4xl font-medium leading-none tracking-[-0.055em] text-text-primary">
                {discipline.title}
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-text-muted">
                {discipline.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {discipline.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border-hairline bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href={discipline.href}
                className="mt-6 inline-flex text-sm font-semibold text-accent-gold transition hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
              >
                Explore the service -&gt;
              </Link>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
