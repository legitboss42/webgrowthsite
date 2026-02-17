import Image from "next/image";

interface CaseStudyCardProps {
  title: string;
  client?: string;
  summary: string;
  results?: string[];
  imageUrl?: string;
  href?: string;
  className?: string;
  headingLevel?: "h2" | "h3" | "h4";
}

const CaseStudyCard: React.FC<CaseStudyCardProps> = ({
  title,
  client,
  summary,
  results,
  imageUrl = "/images/placeholder.png",
  href,
  className,
  headingLevel = "h3",
}) => {
  const CardComponent = href ? "a" : "div";
  const HeadingTag = headingLevel;

  return (
    <CardComponent
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 hover:-translate-y-2 transition-transform duration-300 ${className || ""}`}
      {...(href ? { href } : {})}
    >
      {/* Image header */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={imageUrl}
          alt=""
          fill
          loading="lazy"
          quality={60}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="absolute inset-0 scale-110 object-cover object-center transition-transform duration-700 group-hover:scale-125"
        />
        <div className="absolute inset-0 bg-black/50" />
        {/* Glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-emerald-500/20 blur-sm" />
      </div>

      {/* Body */}
      <div className="p-6">
        {client && <p className="text-sm text-emerald-400 mb-2">{client}</p>}
        <HeadingTag className="text-xl font-semibold mb-3">{title}</HeadingTag>
        <p className="text-white/70 leading-relaxed mb-4">{summary}</p>
        {results && results.length > 0 && (
          <div className="flex flex-wrap gap-2">
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
