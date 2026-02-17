import React from "react";
import Link from "next/link";

interface ServiceCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  href?: string;
  className?: string;
  headingLevel?: "h2" | "h3" | "h4";
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  imageUrl = "/images/placeholder.png",
  href,
  className,
  headingLevel = "h3",
}) => {
  const HeadingTag = headingLevel;

  const content = (
    <>
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110 opacity-60 transition-transform duration-700 group-hover:scale-125"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" />

      {/* Glow effect */}
      <div className="absolute -inset-20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60 bg-emerald-500/20" />

      {/* Card content */}
      <div className="relative z-10 p-7">
        <HeadingTag className="text-xl font-semibold text-white">{title}</HeadingTag>

        <p className="mt-3 text-white/65 leading-relaxed">{description}</p>

        <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
          Learn more
          <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
            {"->"}
          </span>
        </div>
      </div>
    </>
  );

  const baseClass =
    "group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 hover:-translate-y-2 transition-transform duration-300";
  const combinedClass = `${baseClass} ${className || ""}`;

  if (href) {
    return <Link href={href} className={combinedClass}>{content}</Link>;
  }

  return <div className={combinedClass}>{content}</div>;
};

export default ServiceCard;
