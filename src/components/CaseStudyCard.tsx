import Image from "next/image";

interface CaseStudyCardProps {
  title: string;
  client?: string;
  status?: "Live" | "Proposal";
  summary: string;
  results?: string[];
  imageUrl?: string;
  imageAlt?: string;
  href?: string;
  className?: string;
  headingLevel?: "h2" | "h3" | "h4";
}

const CaseStudyCard: React.FC<CaseStudyCardProps> = ({
  title,
  client,
  status = "Live",
  summary,
  results,
  imageUrl = "/images/hero/Hero-Image-1.webp",
  imageAlt,
  href,
  className,
  headingLevel = "h3",
}) => {
  const CardComponent = href ? "a" : "div";
  const HeadingTag = headingLevel;
  const isExternal = Boolean(href && /^https?:\/\//.test(href));

  return (
    <CardComponent
      className={`group relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 transition-transform duration-300 hover:-translate-y-2 ${className || ""}`}
      {...(href
        ? {
            href,
            target: isExternal ? "_blank" : undefined,
            rel: isExternal ? "noreferrer" : undefined,
          }
        : {})}
    >
      {/* Image header */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={imageUrl}
          alt={imageAlt || `${title} project preview`}
          fill
          loading="lazy"
          quality={60}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="absolute inset-0 scale-110 object-cover object-center transition-transform duration-700 group-hover:scale-125"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute left-4 top-4 z-10">
          <span
            className={[
              "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
              status === "Proposal"
                ? "border-amber-300/40 bg-amber-500/15 text-amber-100"
                : "border-emerald-300/35 bg-emerald-500/15 text-emerald-100",
            ].join(" ")}
          >
            {status}
          </span>
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-emerald-500/20 blur-sm" />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        {client && <p className="text-sm text-emerald-400 mb-2">{client}</p>}
        <HeadingTag className="text-xl font-semibold mb-3">{title}</HeadingTag>
        <p className="text-white/70 leading-relaxed mb-4">{summary}</p>
        {results && results.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {results.map((result, index) => (
              <span key={index} className="px-3 py-1 bg-emerald-600/20 text-emerald-400 text-xs rounded-full">
                {result}
              </span>
            ))}
          </div>
        )}
      </div>
    </CardComponent>
  );
};

export default CaseStudyCard;
