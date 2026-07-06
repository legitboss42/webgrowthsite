import Link from "next/link";
import SectionShell from "./SectionShell";

export default function PlatformServicesCTA() {
  return (
    <SectionShell tone="canvas" spacing="compact">
      <div className="overflow-hidden rounded-[1.65rem] border border-blue-950/60 bg-[radial-gradient(circle_at_88%_14%,rgba(108,84,255,0.42),transparent_24%),linear-gradient(135deg,#091226_0%,#0c1631_48%,#0b1230_100%)] px-6 py-7 shadow-[0_26px_70px_rgba(6,14,35,0.28)] md:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-white md:text-[2.3rem]">
              All-in-one platform. Expert guidance. Real growth.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Premium websites, proven SEO systems, and monetization strategy
              working together.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((item) => (
                <span
                  key={item}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(135deg,#303f87_0%,#6544ff_100%)] text-xs font-bold text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
                >
                  WG
                </span>
              ))}
            </div>
            <Link
              href="/contact/"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Start With a Website Review -&gt;
            </Link>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
