type PageSectionProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  surface?: "default" | "white" | "tint" | "dark";
  spacing?: "sm" | "md" | "lg";
};

const surfaceStyles = {
  default: "bg-[#f7f8fc]",
  white: "bg-white",
  tint: "bg-[linear-gradient(180deg,#f7f8fc_0%,#eef2ff_100%)]",
  dark: "bg-[#0f172a] text-white",
} as const;

const spacingStyles = {
  sm: "py-14 md:py-16",
  md: "py-18 md:py-22",
  lg: "py-24 md:py-28",
} as const;

export default function PageSection({
  id,
  children,
  className,
  surface = "default",
  spacing = "md",
}: PageSectionProps) {
  return (
    <section
      id={id}
      className={[surfaceStyles[surface], spacingStyles[spacing], className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6">{children}</div>
    </section>
  );
}
