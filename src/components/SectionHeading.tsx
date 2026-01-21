interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ eyebrow, title, description }) => {
  return (
    <div className="text-center">
      <span className="text-sm tracking-[0.25em] text-white/50 uppercase">
        {eyebrow}
      </span>
      <h1 className="mt-4 text-4xl md:text-6xl font-bold leading-tight">
        {title}
      </h1>
      <p className="mt-6 text-white/70 max-w-2xl mx-auto leading-relaxed text-lg">
        {description}
      </p>
    </div>
  );
};

export default SectionHeading;