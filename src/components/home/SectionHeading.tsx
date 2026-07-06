import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
  invert?: boolean;
  density?: "compact" | "default" | "feature";
};

const titleClasses = {
  compact: "text-2xl md:text-3xl",
  default: "text-3xl md:text-4xl",
  feature: "text-3xl md:text-5xl",
};

const bodyClasses = {
  compact: "text-sm leading-6",
  default: "text-base leading-7",
  feature: "text-lg leading-8",
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  invert = false,
  density = "default",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={[
        "flex gap-6",
        centered
          ? "mx-auto max-w-3xl flex-col items-center text-center"
          : "flex-col md:flex-row md:items-end md:justify-between",
      ].join(" ")}
    >
      <div className="max-w-3xl">
        {eyebrow ? (
          <p
            className={[
              "text-xs font-bold uppercase tracking-[0.18em]",
              invert ? "text-blue-200" : "text-blue-700",
            ].join(" ")}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={[
            "mt-3 text-balance font-semibold leading-tight tracking-[-0.03em]",
            titleClasses[density],
            invert ? "text-white" : "text-slate-950",
          ].join(" ")}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={[
              "mt-4 max-w-2xl",
              bodyClasses[density],
              invert ? "text-slate-300" : "text-slate-600",
              centered ? "mx-auto" : "",
            ].join(" ")}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
