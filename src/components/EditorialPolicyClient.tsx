"use client";

import Link from "next/link";
import SectionShell from "@/components/home/SectionShell";

const sections = [
  {
    title: "What we publish",
    text: "Web Growth publishes original Academy guides, case studies, service guidance, and implementation-focused website growth resources intended to help business owners make better digital decisions.",
  },
  {
    title: "How content is created",
    text: "A named author drafts each guide. An editorial reviewer checks scope, clarity, links, claims, and fit with the article's search intent before it is approved for public use.",
  },
  {
    title: "Content standards",
    text: "Articles must answer a defined reader need, use original explanation, distinguish examples from documented outcomes, and avoid filler, copied passages, keyword stuffing, or unsupported claims.",
  },
  {
    title: "Sources and claims",
    text: "Platform, policy, and technical claims should link to the relevant first-party documentation where practical. Statistics require an identifiable source. We do not invent customer outcomes, credentials, ratings, or research findings.",
  },
  {
    title: "Review and updates",
    text: "Publication and review dates are shown on articles where applicable. We update a guide when a platform, process, source, or recommendation has materially changed.",
  },
  {
    title: "Corrections",
    text: "Confirmed factual errors are corrected promptly. Material corrections are reflected in the page and its review date. A correction request should identify the page, disputed text, and a reliable supporting source.",
  },
  {
    title: "AI assistance",
    text: "AI tools may assist with outlining, editing, code checks, or research organization. They do not replace editorial review. A human remains accountable for accuracy, originality, source selection, and publication decisions.",
  },
  {
    title: "Advertising and monetization",
    text: "Any advertising or monetization must remain secondary to usefulness, readability, and trust. Web Growth does not publish made-for-ads content or thin filler pages.",
  },
] as const;

export default function EditorialPolicyClient() {
  return (
    <main className="bg-[#f7f8fc] text-slate-950">
      <SectionShell tone="canvas" spacing="hero">
        <p className="inline-flex rounded-full border border-blue-100 bg-white/92 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700 shadow-sm">
          Editorial Policy
        </p>
        <h1 className="mt-5 max-w-4xl text-balance text-[3.6rem] font-semibold leading-[0.9] tracking-[-0.07em] text-slate-950 md:text-[4.6rem]">
          How Web Growth plans, writes, reviews, updates, and stands behind Academy content.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          The platform publishes practical content about website design, launch
          strategy, technical SEO, conversion improvement, and digital
          infrastructure. The editorial process is built for usefulness, trust, and
          accountability.
        </p>
      </SectionShell>

      <SectionShell tone="white" spacing="compact">
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
              <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
                {section.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{section.text}</p>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <article className="rounded-[1.45rem] border border-slate-200 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
          <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
            Accountability and contact
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            If you find an error, need clarification, or want to request a correction,
            contact{" "}
            <a href="mailto:admin@webgrowth.info" className="font-medium text-blue-700 hover:text-blue-800">
              admin@webgrowth.info
            </a>
            . For project enquiries, use the{" "}
            <Link href="/contact/" className="font-medium text-blue-700 hover:text-blue-800">
              contact page
            </Link>
            .
          </p>
        </article>
      </SectionShell>
    </main>
  );
}
