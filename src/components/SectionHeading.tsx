interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  level?: "h1" | "h2" | "h3";
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  level = "h2",
}) => {
  const HeadingTag = level;

  return (
    <div className="text-center">
      <span className="text-sm tracking-[0.25em] text-white/50 uppercase">
        {eyebrow}
      </span>
      <HeadingTag className="mt-4 text-4xl md:text-6xl font-bold leading-tight">
        {title}
      </HeadingTag>
      <p className="mt-6 text-white/70 max-w-2xl mx-auto leading-relaxed text-lg">
        {description}
      </p>
    </div>
  );
};

export default SectionHeading;
