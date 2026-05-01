import Image from "next/image";

interface CaseStudyCardProps {
  title: string;
  client?: string;
  eyebrow?: string;
  status?: "Live";
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
  eyebrow,
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
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageUrl}
          alt={imageAlt || `${title} project preview`}
          fill
          loading="lazy"
          quality={75}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="absolute inset-0 scale-[1.03] object-cover object-top transition-transform duration-700 group-hover:scale-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/42 to-black/12" />
        <div className="absolute left-4 top-4 z-10">
          {status ? (
            <span className="inline-flex rounded-full border border-emerald-300/35 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
              {status}
            </span>
          ) : null}
        </div>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-emerald-500/20 blur-sm" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        {(eyebrow || client) && (
          <p className="mb-2 text-sm text-emerald-400">{eyebrow || client}</p>
        )}
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
