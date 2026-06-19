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
            We keep our guidance tied to first-party implementation processes,
            clearly identified examples, and sources readers can inspect.
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
                A named author drafts each guide. An editorial reviewer checks
                its scope, instructions, links, claims, and fit with the stated
                search intent before it is approved for the public blog.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white">
                How content is updated
              </h2>
              <p className="mt-3 text-white/72 leading-7">
                Publication and review dates are shown on articles. We update a
                guide when a platform, process, source, or recommendation has
                materially changed. Minor formatting edits do not receive a
                new substantive review date.
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

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white">Content standards</h2>
              <p className="mt-3 leading-7 text-white/72">
                Articles must answer a defined reader need, use original
                explanations, distinguish examples from documented results,
                and avoid filler, copied passages, keyword stuffing, or claims
                the author cannot support.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white">Sources and claims</h2>
              <p className="mt-3 leading-7 text-white/72">
                Product, policy, and technical claims should link to the
                relevant first-party documentation where practical. Statistics
                require an identifiable source. We do not invent customer
                outcomes, credentials, ratings, or research findings.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white">AI assistance</h2>
              <p className="mt-3 leading-7 text-white/72">
                AI tools may assist with outlining, editing, code checks, or
                research organization. They do not replace editorial review.
                A human remains accountable for accuracy, originality, source
                selection, and the decision to publish.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white">Corrections</h2>
              <p className="mt-3 leading-7 text-white/72">
                Confirmed factual errors are corrected promptly. Material
                corrections are reflected in the article and its review date.
                A correction request should identify the page, disputed text,
                and a reliable supporting source.
              </p>
            </section>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">Accountability and contact</h2>
            <p className="mt-3 text-white/72 leading-7">
              Web Growth is responsible for the content published on this
              domain. If you find an error, need clarification, or want to
              request a correction, contact us at{" "}
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
