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
  canvas: "bg-[#f7f8fc]",
  white: "bg-white",
  tint: "bg-[linear-gradient(180deg,#f5f7ff_0%,#eef4ff_100%)]",
  dark: "bg-[linear-gradient(180deg,#081122_0%,#0f172a_60%,#111c34_100%)] text-white",
};

const spacingClasses = {
  compact: "py-10 md:py-12",
  default: "py-12 md:py-16",
  hero: "pb-6 pt-14 md:pb-8 md:pt-18",
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
