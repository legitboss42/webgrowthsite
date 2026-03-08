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
      className={`relative overflow-hidden rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.22),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-8 transition-all duration-300 hover:-translate-y-2 ${recommended ? "ring-1 ring-emerald-500/40 md:scale-105" : ""} ${className || ""}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.08)_0%,transparent_46%,rgba(16,185,129,0.04)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:22px_22px] opacity-15" />

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 bg-emerald-500/10 blur-xl -z-10" />

      {recommended && (
        <div className="absolute -top-3 left-1/2 z-10 transform -translate-x-1/2">
          <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Recommended
          </span>
        </div>
      )}

      <div className="relative z-10 mb-6 text-center">
        <h3 className="text-2xl font-semibold mb-2">{name}</h3>
        <div className="text-4xl font-bold mb-1">
          {price}
          {period && <span className="text-lg font-normal text-white/60">{period}</span>}
        </div>
        <p className="text-white/70">{description}</p>
      </div>

      <ul className="relative z-10 mb-8 space-y-3">
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
        className={`relative z-10 block w-full rounded-lg px-6 py-3 text-center font-semibold transition-colors ${
          recommended
            ? "bg-emerald-600 text-white hover:bg-emerald-500"
            : "bg-white/10 text-white hover:bg-white/20"
        }`}
      >
        {ctaText}
      </a>
    </div>
  );
};

export default PricingCard;
