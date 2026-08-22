import Image from "next/image";
import PremiumButton from "@/components/platform/PremiumButton";
import SurfaceCard from "@/components/platform/SurfaceCard";

interface CTASectionProps {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCtaText?: string;
  primaryHref?: string;
  secondaryCtaText?: string;
  secondaryHref?: string;
  imageUrl?: string;
  className?: string;
}

export default function CTASection({
  eyebrow,
  title,
  description,
  primaryCtaText = "Get My Website Quote",
  primaryHref = "/contact",
  secondaryCtaText = "See Real Projects",
  secondaryHref = "/portfolio",
  imageUrl = "/images/hero/Hero-Image-1.webp",
  className,
}: CTASectionProps) {
  return (
    <section className={`relative overflow-hidden py-16 sm:py-20 ${className || ""}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(28,122,84,0.10),transparent_32%),radial-gradient(circle_at_82%_82%,rgba(180,128,47,0.12),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <SurfaceCard className="relative overflow-hidden rounded-[2rem] border-slate-200/80 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(28,122,84,0.05),transparent_38%,rgba(180,128,47,0.07)_100%)]" />
          <div className="pointer-events-none absolute -right-24 top-0 h-48 w-48 rounded-full bg-purple-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-blue-100/70 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              {eyebrow ? (
                <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
                  {eyebrow}
                </span>
              ) : null}
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
                {title}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                {description}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <PremiumButton href={primaryHref}>{primaryCtaText}</PremiumButton>
                <PremiumButton href={secondaryHref} variant="secondary">
                  {secondaryCtaText}
                </PremiumButton>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 shadow-[0_22px_60px_rgba(15,23,42,0.22)]">
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                <Image
                  src={imageUrl}
                  alt={`${title} supporting visual`}
                  fill
                  loading="lazy"
                  quality={65}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </section>
  );
}
