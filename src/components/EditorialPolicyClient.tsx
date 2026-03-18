"use client";

import Link from "next/link";

export default function EditorialPolicyClient() {
  return (
    <main className="bg-black text-white">
      <section className="border-b border-white/10 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            Editorial Policy
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            How Web Growth plans, writes, reviews, and updates content
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
            This site publishes practical content about website design, launch
            strategy, technical SEO, conversion improvement, and digital
            infrastructure for businesses in Nigeria and international markets.
            We keep our guidance tied to real client work, internal process, and
            implementation experience.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white">
                What we publish
              </h2>
              <p className="mt-3 text-white/72 leading-7">
                We publish original articles, case studies, service guidance,
                and website launch resources intended to help business owners
                make better digital decisions.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white">
                How content is created
              </h2>
              <p className="mt-3 text-white/72 leading-7">
                Posts are drafted and reviewed in-house by Web Growth based on
                active website strategy, redesign, launch, SEO, and conversion
                work. We aim for practical accuracy over filler or generic
                summaries.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white">
                How content is updated
              </h2>
              <p className="mt-3 text-white/72 leading-7">
                We update content when our process changes, when implementation
                details need clarification, or when a page no longer reflects
                how we currently execute work.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white">
                Advertising and monetization
              </h2>
              <p className="mt-3 text-white/72 leading-7">
                Our primary focus is publishing useful first-party content and
                showcasing our services. Any advertising or monetization must
                remain secondary to user experience, clarity, and content
                quality.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">
              Contact and corrections
            </h2>
            <p className="mt-3 text-white/72 leading-7">
              If you find an error, need clarification, or want to discuss a
              page on this site, contact us at{" "}
              <a
                href="mailto:admin@webgrowth.info"
                className="text-emerald-300 transition hover:text-emerald-200"
              >
                admin@webgrowth.info
              </a>
              . For project enquiries, you can also use our{" "}
              <Link
                href="/contact"
                className="text-emerald-300 transition hover:text-emerald-200"
              >
                contact page
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
