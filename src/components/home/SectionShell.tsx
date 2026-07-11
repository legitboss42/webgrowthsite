import type { ReactNode } from "react";

type SectionShellProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  tone?: "canvas" | "white" | "tint" | "dark";
  spacing?: "compact" | "default" | "hero";
};

const toneClasses = {
  canvas: "bg-transparent",
  white: "bg-[#11161f]",
  tint: "bg-[linear-gradient(180deg,rgba(232,163,61,0.06)_0%,rgba(27,110,99,0.08)_100%)]",
  dark: "bg-[linear-gradient(180deg,#080a0e_0%,#11161f_100%)] text-text-primary",
};

const spacingClasses = {
  compact: "py-10 md:py-14",
  default: "py-14 md:py-20",
  hero: "pb-8 pt-14 md:pb-12 md:pt-20",
};

export default function SectionShell({
  id,
  children,
  className = "",
  innerClassName = "",
  tone = "canvas",
  spacing = "default",
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={[toneClasses[tone], spacingClasses[spacing], className].join(" ")}
    >
      <div className={["mx-auto max-w-[1240px] px-5 sm:px-6", innerClassName].join(" ")}>
        {children}
      </div>
    </section>
  );
}
