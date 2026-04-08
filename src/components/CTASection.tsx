import Image from "next/image";
import Link from "next/link";
import GeneratedSectionBackground from "@/components/GeneratedSectionBackground";

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

function CTAButton({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const className = primary
    ? "inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.24)] transition hover:bg-emerald-600"
    : "inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-black/30 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-black/45";

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
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
      <GeneratedSectionBackground variant="cta" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(16,185,129,0.16),transparent_32%),radial-gradient(circle_at_82%_82%,rgba(16,185,129,0.1),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(8,12,10,0.96)_55%,rgba(0,0,0,0.92))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.24)] sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />

          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              {eyebrow ? (
                <span className="text-xs uppercase tracking-[0.22em] text-emerald-300/80">
                  {eyebrow}
                </span>
              ) : null}
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
                {title}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                {description}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <CTAButton href={primaryHref} primary>
                  {primaryCtaText}
                </CTAButton>
                <CTAButton href={secondaryHref}>{secondaryCtaText}</CTAButton>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
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
        </div>
      </div>
    </section>
  );
}
