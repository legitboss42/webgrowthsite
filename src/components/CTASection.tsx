import Image from "next/image";

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

const CTASection: React.FC<CTASectionProps> = ({
  eyebrow,
  title,
  description,
  primaryCtaText = "Request a Quote",
  primaryHref = "/contact",
  secondaryCtaText = "View Portfolio",
  secondaryHref = "/portfolio",
  imageUrl = "/images/placeholder.webp",
  className
}) => {
  return (
    <section className={`py-16 bg-gradient-to-r from-emerald-900/20 to-black backdrop-blur ${className || ''}`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-2 items-center">
          {/* Text content */}
          <div>
            {eyebrow && <span className="text-sm tracking-[0.25em] text-white/50 uppercase">{eyebrow}</span>}
            <h2 className="mt-4 text-3xl md:text-5xl font-bold">{title}</h2>
            <p className="mt-4 text-white/70 leading-relaxed">{description}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href={primaryHref}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-4 px-8 rounded-lg transition-colors text-center"
              >
                {primaryCtaText}
              </a>
              <a
                href={secondaryHref}
                className="border border-white/20 hover:border-white/40 text-white font-semibold py-4 px-8 rounded-lg transition-colors text-center"
              >
                {secondaryCtaText}
              </a>
            </div>
          </div>

          {/* Image placeholder */}
          <div className="relative">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10">
              <Image
                src={imageUrl}
                alt=""
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
    </section>
  );
};

export default CTASection;
