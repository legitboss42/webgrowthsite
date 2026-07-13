import Link from "next/link";
import SectionShell from "./SectionShell";

export default function PlatformServicesCTA() {
  return (
    <SectionShell tone="canvas" spacing="compact">
      <div data-reveal className="overflow-hidden rounded-[1.65rem] border border-border-hairline bg-[radial-gradient(circle_at_88%_14%,rgba(232,163,61,0.15),transparent_24%),linear-gradient(135deg,#0a0d12_0%,#11161f_48%,#0C0F14_100%)] px-6 py-7 shadow-[0_26px_70px_rgba(0,0,0,0.32)] md:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h2 className="font-display text-[2rem] font-medium tracking-[-0.05em] text-text-primary md:text-[2.3rem]">
              All-in-one platform. Expert guidance. Real growth.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-text-muted">
              Premium websites, documented SEO foundations, and responsible
              monetization strategy
              working together.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((item) => (
                <span
                  key={item}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-gold/20 bg-accent-teal/35 text-xs font-bold text-text-primary shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
                >
                  WG
                </span>
              ))}
            </div>
            <Link
              href="/contact/"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent-gold px-6 text-sm font-bold text-bg-ink transition hover:bg-[#f1b75d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
            >
              Start With a Website Review -&gt;
            </Link>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
