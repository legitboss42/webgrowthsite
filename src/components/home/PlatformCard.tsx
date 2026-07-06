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
    "border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] hover:border-blue-200 hover:shadow-[0_20px_46px_rgba(79,107,255,0.12)]",
  path:
    "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] hover:border-blue-200 hover:shadow-[0_22px_54px_rgba(79,107,255,0.14)]",
  tool:
    "border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]",
  highlight:
    "border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f4f7ff_100%)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] hover:border-blue-200 hover:shadow-[0_28px_68px_rgba(79,107,255,0.14)]",
};

const iconClasses: Record<PlatformCardVariant, string> = {
  category:
    "h-12 w-12 rounded-lg bg-[linear-gradient(135deg,#eef4ff_0%,#f4efff_100%)] text-blue-700 ring-1 ring-blue-100",
  path: "h-14 w-14 rounded-full bg-[linear-gradient(135deg,#eef4ff_0%,#f3f0ff_100%)] text-blue-700 ring-1 ring-blue-100",
  tool: "h-12 w-12 rounded-lg bg-[linear-gradient(135deg,#f0f7ff_0%,#f6f0ff_100%)] text-blue-700 ring-1 ring-blue-100",
  highlight:
    "h-12 w-12 rounded-lg bg-[linear-gradient(135deg,#eef4ff_0%,#f3efff_100%)] text-blue-700 ring-1 ring-blue-100",
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
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {badge}
          </span>
        ) : null}
      </div>
      {eyebrow ? (
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="mt-4 text-xl font-semibold leading-tight tracking-[-0.02em] text-slate-950">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
      {ctaLabel ? (
        <span className="mt-5 inline-flex text-sm font-semibold text-blue-700">
          {ctaLabel}
          <span aria-hidden="true" className="ml-2">
            -&gt;
          </span>
        </span>
      ) : null}
    </>
  );

  const cardClass = [
    "block h-full rounded-xl border transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600",
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
