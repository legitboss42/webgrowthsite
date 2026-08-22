import type { ReactNode } from "react";

type SvgProps = {
  className?: string;
};

type IconBadgeProps = {
  children: ReactNode;
  tone?: "blue" | "purple" | "green" | "amber" | "cyan" | "slate";
  shape?: "square" | "pill" | "circle";
  className?: string;
};

const toneClasses: Record<NonNullable<IconBadgeProps["tone"]>, string> = {
  blue: "bg-[linear-gradient(135deg,#e9f2ec_0%,#dde9e0_100%)] text-blue-700 ring-blue-100",
  purple:
    "bg-[linear-gradient(135deg,#f5efdf_0%,#efe6cc_100%)] text-[#755b16] ring-[#ece0c6]",
  green:
    "bg-[linear-gradient(135deg,#ecfdf5_0%,#e6f9ef_100%)] text-emerald-700 ring-emerald-100",
  amber:
    "bg-[linear-gradient(135deg,#fff7ed_0%,#fff2db_100%)] text-amber-700 ring-amber-100",
  cyan: "bg-[linear-gradient(135deg,#e9f2ec_0%,#dde9e0_100%)] text-cyan-700 ring-cyan-100",
  slate:
    "bg-[linear-gradient(135deg,#f6f7f2_0%,#eef1ec_100%)] text-slate-700 ring-slate-200",
};

const shapeClasses: Record<NonNullable<IconBadgeProps["shape"]>, string> = {
  square: "rounded-xl",
  pill: "rounded-2xl",
  circle: "rounded-full",
};

export function IconBadge({
  children,
  tone = "blue",
  shape = "square",
  className = "",
}: IconBadgeProps) {
  return (
    <span
      className={[
        "flex items-center justify-center ring-1 shadow-sm",
        toneClasses[tone],
        shapeClasses[shape],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function iconClassName(className = "") {
  return ["h-5 w-5", className].join(" ");
}

export function PlanIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M9 2v4M15 2v4M8 9h8M8 13h5" />
    </svg>
  );
}

export function BuildIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M8 7 4 12l4 5M16 7l4 5-4 5M13 5l-2 14" />
    </svg>
  );
}

export function OptimizeIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M12 4a8 8 0 1 0 8 8" />
      <path d="M12 12 17 7" />
      <path d="M15 7h2v2" />
    </svg>
  );
}

export function AttractIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M12 3v18M5 8a7 7 0 0 0 14 0M6 16a6 6 0 0 1 12 0" />
    </svg>
  );
}

export function ConvertIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
    </svg>
  );
}

export function MonetizeIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1 1.7-2.5 2c-1.5.2-2.5.9-2.5 2 0 1.1 1.1 2 2.5 2s2.5-.9 2.5-2M12 6v12" />
    </svg>
  );
}

export function SearchIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

export function CodeWindowIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M7.5 11.5 10 9l-2.5-2.5M16.5 11.5 14 9l2.5-2.5M12 6.5 11 11.5" />
    </svg>
  );
}

export function SpeedIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M5 15a7 7 0 1 1 14 0" />
      <path d="M12 12 16.5 9.5" />
      <path d="M8 18h8" />
    </svg>
  );
}

export function ShieldIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.6 2.9 7.8 7 10 4.1-2.2 7-5.4 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.5-3.7" />
    </svg>
  );
}

export function PencilIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="m4 20 4.5-1 9-9a2 2 0 0 0-2.8-2.8l-9 9L4 20Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

export function RevenueIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M5 17V7M10 17v-5M15 17V9M20 17V5" />
    </svg>
  );
}

export function RocketIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M6 14c0-5.5 5.5-9 12-10-1 6.5-4.5 12-10 12H6v-2Z" />
      <path d="M6 14 4 20l6-2M14 10h.01" />
    </svg>
  );
}

export function GrowthChartIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M4 18h16" />
      <path d="m6 15 3-3 3 2 5-6" />
      <path d="M17 8h3v3" />
    </svg>
  );
}

export function DollarIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M12 3v18M15 7.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.2 1.7 3 2c1.8.2 3 .9 3 2s-1.3 2-3 2-3-.9-3-2" />
    </svg>
  );
}

export function AuditIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M8 8h8M8 12h5M15.5 15.5 18 18" />
      <circle cx="13.5" cy="13.5" r="2.5" />
    </svg>
  );
}

export function TagIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M4 12 12 4h8v8l-8 8L4 12Z" />
      <circle cx="16" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SitemapIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <rect x="10" y="3.5" width="4" height="4" rx="1" />
      <rect x="3.5" y="16.5" width="4" height="4" rx="1" />
      <rect x="10" y="16.5" width="4" height="4" rx="1" />
      <rect x="16.5" y="16.5" width="4" height="4" rx="1" />
      <path d="M12 7.5v4M5.5 16.5v-2h13v2M12 11.5h0" />
    </svg>
  );
}

export function LightbulbIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M9 18h6M10 21h4M8.5 14.5c-1.4-1-2.5-2.8-2.5-4.8a6 6 0 1 1 12 0c0 2-1.1 3.8-2.5 4.8-.7.5-1.1 1.3-1.1 2.2h-4.8c0-.9-.4-1.7-1.1-2.2Z" />
    </svg>
  );
}

export function MailIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="m5.5 8 6.5 5 6.5-5" />
    </svg>
  );
}

export function CheckIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName(className)} aria-hidden="true">
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

export function CapIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="m3 9 9-4 9 4-9 4-9-4Z" />
      <path d="M7 11.5v3c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-3" />
    </svg>
  );
}

export function WrenchIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <path d="M14.5 5.5a4 4 0 0 0 4.7 4.7l-7.8 7.8a2 2 0 1 1-2.8-2.8l7.8-7.8a4 4 0 0 0-1.9-7.1Z" />
    </svg>
  );
}

export function TargetIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName(className)} aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 5V3M19 12h2M12 19v2M3 12H5" />
    </svg>
  );
}
