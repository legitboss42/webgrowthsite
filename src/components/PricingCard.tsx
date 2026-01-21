interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  ctaText?: string;
  href?: string;
  recommended?: boolean;
  className?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  period,
  description,
  features,
  ctaText = "Get Started",
  href = "#contact",
  recommended = false,
  className
}) => {
  return (
    <div
      className={`relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-8 hover:-translate-y-2 transition-all duration-300 ${recommended ? 'ring-1 ring-emerald-500/40 md:scale-105' : ''} ${className || ''}`}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 bg-emerald-500/10 blur-xl -z-10" />

      {recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Recommended
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-semibold mb-2">{name}</h3>
        <div className="text-4xl font-bold mb-1">
          {price}
          {period && <span className="text-lg font-normal text-white/60">{period}</span>}
        </div>
        <p className="text-white/70">{description}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-emerald-400 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-white/80">{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href={href}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors text-center block ${
          recommended
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        {ctaText}
      </a>
    </div>
  );
};

export default PricingCard;