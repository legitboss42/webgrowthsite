type SurfaceCardProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "tint" | "dark";
};

const toneStyles = {
  default: "border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]",
  tint: "border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7f8f4_100%)] shadow-[0_18px_48px_rgba(18,74,56,0.08)]",
  dark: "border border-white/10 bg-white/5 text-white shadow-[0_18px_48px_rgba(0,0,0,0.18)]",
} as const;

export default function SurfaceCard({
  children,
  className,
  tone = "default",
}: SurfaceCardProps) {
  return (
    <div className={["rounded-3xl p-6 md:p-7", toneStyles[tone], className ?? ""].join(" ")}>
      {children}
    </div>
  );
}
