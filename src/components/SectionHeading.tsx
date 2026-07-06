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
      <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
        {eyebrow}
      </span>
      <HeadingTag className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
        {title}
      </HeadingTag>
      <p
        className={[
          "mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg",
          isLeftAligned ? "" : "mx-auto",
        ].join(" ")}
      >
        {description}
      </p>
    </div>
  );
}
