type BrowserFrameMockupProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  lines?: string[];
  footer?: string;
  className?: string;
};

export default function BrowserFrameMockup({
  eyebrow,
  title,
  subtitle,
  description,
  lines = [],
  footer,
  className,
}: BrowserFrameMockupProps) {
  const bodyCopy = description ?? subtitle;

  return (
    <div
      className={[
        "overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <div className="ml-3 h-8 flex-1 rounded-full border border-slate-200 bg-white px-4 text-xs leading-8 text-slate-400">
          webgrowth.info
        </div>
      </div>

      <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f7f8f4_100%)] p-6">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p>
        ) : null}
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h3>
        <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">{bodyCopy}</p>

        <div className="mt-6 space-y-3">
          <div className="h-3 w-2/3 rounded-full bg-slate-200" />
          <div className="h-3 w-5/6 rounded-full bg-slate-100" />
          <div className="h-3 w-1/2 rounded-full bg-slate-100" />
        </div>

        {lines.length ? (
          <div className="mt-6 grid gap-3">
            {lines.map((line) => (
              <div
                key={line}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              >
                <span className="h-2 w-2 rounded-full bg-[linear-gradient(135deg,#1c7a54_0%,#124a38_100%)]" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        ) : null}

        {footer ? (
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {footer}
          </p>
        ) : null}
      </div>
    </div>
  );
}
