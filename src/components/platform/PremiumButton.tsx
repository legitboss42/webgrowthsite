import TrackedLink from "@/components/analytics/TrackedLink";

type PremiumButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  target?: string;
  rel?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};

const styles = {
  primary:
    "inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1c7a54_0%,#124a38_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(18,74,56,0.28)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700",
  secondary:
    "inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700",
  ghost:
    "inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-blue-700 transition duration-200 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700",
} as const;

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export default function PremiumButton({
  href,
  children,
  variant = "primary",
  className,
  target,
  rel,
  type = "button",
  disabled,
  onClick,
}: PremiumButtonProps) {
  const resolvedClassName = [
    styles[variant],
    disabled ? "pointer-events-none opacity-50" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!href) {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={resolvedClassName}
      >
        {children}
      </button>
    );
  }

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target={target}
        rel={rel ?? (target === "_blank" ? "noreferrer noopener" : undefined)}
        className={resolvedClassName}
      >
        {children}
      </a>
    );
  }

  return (
    <TrackedLink
      href={href}
      className={resolvedClassName}
      ctaName={typeof children === "string" ? children.toLowerCase().replace(/\s+/g, "_") : "premium_button"}
      ctaLocation="platform_component"
      destination={href}
      pageType="platform_page"
    >
      {children}
    </TrackedLink>
  );
}
