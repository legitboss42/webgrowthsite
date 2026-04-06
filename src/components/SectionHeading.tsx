interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  level?: "h1" | "h2" | "h3";
  align?: "left" | "center";
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  level = "h2",
  align = "center",
}: SectionHeadingProps) {
  const HeadingTag = level;
  const isLeftAligned = align === "left";

  return (
    <div className={isLeftAligned ? "text-left" : "text-center"}>
      <span className="text-xs uppercase tracking-[0.22em] text-emerald-300/80">
        {eyebrow}
      </span>
      <HeadingTag className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
        {title}
      </HeadingTag>
      <p
        className={[
          "mt-4 max-w-2xl text-base leading-7 text-white/72 sm:text-lg",
          isLeftAligned ? "" : "mx-auto",
        ].join(" ")}
      >
        {description}
      </p>
    </div>
  );
}
