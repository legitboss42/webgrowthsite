import { finalCtaLinks } from "@/lib/launchOffer";

export default function FinalCTASection({
  title = "Website Design in 48 Hours | Get a Professional Website Live Fast",
  description = "Ready to launch? Send your details and move from idea to live website without dragging the project out for weeks.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[#050806] py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.1),transparent_32%)]" />

      <div className="mx-auto max-w-6xl px-6">
        <article className="relative overflow-hidden rounded-3xl border border-emerald-500/35 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(8,12,10,0.96)_55%,rgba(0,0,0,0.9))] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/90">
                Final CTA
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">
                {title}
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                {description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/72">
                <span className="rounded-full border border-white/10 bg-black/25 px-4 py-2">
                  Fast delivery
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-4 py-2">
                  USD pricing
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-4 py-2">
                  Nigeria + remote clients
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={finalCtaLinks.primaryHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.25)] transition-colors hover:bg-emerald-600"
              >
                Start Now
              </a>

              <a
                href={finalCtaLinks.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-black/35 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-black/50"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-7 border-t border-white/10 pt-5 text-sm text-white/70">
            <span>Email: </span>
            <a
              href={finalCtaLinks.emailHref}
              className="text-emerald-300 hover:text-emerald-200"
            >
              {finalCtaLinks.emailLabel}
            </a>
            <span className="mx-2 text-white/40">|</span>
            <span>WhatsApp: </span>
            <a
              href={finalCtaLinks.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-300 hover:text-emerald-200"
            >
              {finalCtaLinks.whatsappLabel}
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
