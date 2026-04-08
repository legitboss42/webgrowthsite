import Image from "next/image";
import Link from "next/link";
import GeneratedSectionBackground from "@/components/GeneratedSectionBackground";

const trustCards = [
  {
    eyebrow: "TLC Interiors",
    title: "A site built to feel more premium",
    body: "This project was about making the business look more established and making it easier for the right client to enquire.",
    imageUrl: "/images/portfolio/tlc-interiors-desktop.jpg",
    imageAlt: "TLC Interiors Limited project preview",
  },
  {
    eyebrow: "J Luxe",
    title: "A London clinic site built around trust",
    body: "The focus here was a calmer first impression, clearer treatment pages, and a site that feels more credible when someone lands on it cold.",
    imageUrl: "/images/portfolio/jluxe-mockup.webp",
    imageAlt: "J Luxe Medical Aesthetics project preview",
  },
  {
    eyebrow: "iFitness proposal",
    title: "A proposal I still think is worth showing",
    body: "It was not a shipped project, so I say that plainly. I keep it here because the landing page direction is strong and the idea still holds up.",
    imageUrl: "/images/portfolio/ifitness-desktop.jpg",
    imageAlt: "iFitness proposal preview",
  },
] as const;

export default function HomeTrustSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#060907] py-16">
      <GeneratedSectionBackground variant="trust" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="rounded-2xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.18),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-7 shadow-[0_16px_36px_rgba(0,0,0,0.22)]">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
              Work directly with me
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl">
              I design and build the work myself, so you are not dealing with layers
            </h2>
            <p className="mt-4 text-base leading-7 text-white/72">
              I&apos;m Victor Chinukwue, founder of Web Growth. I work with service
              businesses that need a site that looks more credible, works better
              on mobile, and gives people a clearer reason to reach out.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-emerald-200/85">
                  What it&apos;s like to work with me
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  You speak to me directly from the first message to the final
                  handoff. No middlemen, no account managers, and no dragged-out
                  process.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-emerald-200/85">
                  What happens when you reach out
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  In most cases, I reply the same day with a clear sense of fit,
                  scope, and the fastest way to improve the site.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/72">
              <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                Founder-led
              </span>
              <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                3 live projects
              </span>
              <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                Lagos + selective UK
              </span>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-black/35 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
              >
                Meet Victor
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                See Projects
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 md:auto-rows-fr">
            {trustCards.map((card) => (
              <article
                key={card.title}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/35 shadow-[0_14px_30px_rgba(0,0,0,0.2)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={card.imageUrl}
                    alt={card.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
                  <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
                    {card.eyebrow}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-white/72">
                    {card.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
