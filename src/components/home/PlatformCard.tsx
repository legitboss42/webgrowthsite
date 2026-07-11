import Link from "next/link";
import type { ReactNode } from "react";

type PlatformCardVariant = "category" | "path" | "tool" | "highlight";

type PlatformCardProps = {
  title: string;
  description: string;
  href?: string;
  ctaLabel?: string;
  eyebrow?: string;
  icon?: ReactNode;
  badge?: string;
  className?: string;
  children?: ReactNode;
  variant?: PlatformCardVariant;
};

const variantClasses: Record<PlatformCardVariant, string> = {
  category:
    "border-border-hairline bg-[#11161f]/88 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] hover:border-accent-gold/55 hover:shadow-[0_22px_54px_rgba(232,163,61,0.1)]",
  path:
    "border-border-hairline bg-[linear-gradient(180deg,rgba(237,234,233,0.07),rgba(237,234,233,0.025))] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.2)] hover:border-accent-gold/55 hover:shadow-[0_22px_54px_rgba(232,163,61,0.1)]",
  tool:
    "border-border-hairline bg-[#11161f]/88 p-5 shadow-[0_14px_34px_rgba(0,0,0,0.2)] hover:border-accent-teal/70",
  highlight:
    "border-border-hairline bg-[linear-gradient(135deg,rgba(237,234,233,0.08)_0%,rgba(27,110,99,0.08)_100%)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] hover:border-accent-gold/55 hover:shadow-[0_28px_68px_rgba(232,163,61,0.12)]",
};

const iconClasses: Record<PlatformCardVariant, string> = {
  category:
    "h-12 w-12 rounded-lg bg-accent-gold/10 text-accent-gold ring-1 ring-accent-gold/25",
  path: "h-14 w-14 rounded-full bg-accent-teal/18 text-accent-gold ring-1 ring-accent-teal/35",
  tool: "h-12 w-12 rounded-lg bg-accent-teal/18 text-accent-gold ring-1 ring-accent-teal/35",
  highlight:
    "h-12 w-12 rounded-lg bg-accent-gold/10 text-accent-gold ring-1 ring-accent-gold/25",
};

export default function PlatformCard({
  title,
  description,
  href,
  ctaLabel,
  eyebrow,
  icon,
  badge,
  className = "",
  children,
  variant = "category",
}: PlatformCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        {icon ? (
          <div
            className={[
              "flex shrink-0 items-center justify-center text-sm font-bold",
              iconClasses[variant],
            ].join(" ")}
          >
            {icon}
          </div>
        ) : null}
        {badge ? (
          <span className="rounded-full border border-border-hairline bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            {badge}
          </span>
        ) : null}
      </div>
      {eyebrow ? (
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-accent-gold">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="font-display mt-4 text-xl font-medium leading-tight tracking-[-0.02em] text-text-primary">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-text-muted">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
      {ctaLabel ? (
        <span className="mt-5 inline-flex text-sm font-semibold text-accent-gold">
          {ctaLabel}
          <span aria-hidden="true" className="ml-2">
            -&gt;
          </span>
        </span>
      ) : null}
    </>
  );

  const cardClass = [
    "wg-card-hover block h-full rounded-xl border transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold",
    variantClasses[variant],
    href ? "hover:-translate-y-0.5" : "",
    className,
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {body}
      </Link>
    );
  }

  return <article className={cardClass}>{body}</article>;
}
