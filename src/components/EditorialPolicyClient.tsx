"use client";

import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/site";

const sections = [
  {
    title: "What we publish",
    text: "Web Growth publishes original Academy guides, case studies, service guidance, and implementation-focused website growth resources intended to help business owners make better digital decisions.",
  },
  {
    title: "How content is created",
    text: "A named author drafts each guide. Victor's founder-led review checks scope, clarity, links, claims, and fit with the article's search intent before publication.",
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
    <main className="trust-page">
      <section className="trust-hero">
        <div className="trust-container">
          <p className="trust-kicker">Editorial Policy</p>
          <h1>How Web Growth plans, writes, reviews, updates, and stands behind Academy content.</h1>
          <p>
            The platform publishes practical content about website design, launch strategy,
            technical SEO, conversion improvement, and digital infrastructure. The editorial process
            is built for usefulness, trust, and accountability.
          </p>
          <p><strong>Effective date:</strong> 13 July 2026</p>
        </div>
      </section>

      <section className="trust-content">
        <div className="trust-container trust-layout">
          <aside className="trust-sidebar" aria-label="Editorial policy summary">
            <p className="trust-kicker">Publishing standard</p>
            <h2>Useful, original, reviewed, and accountable.</h2>
            <p>
              Academy content must answer a real reader need and avoid unsupported claims, filler,
              copied passages, and made-for-ads publishing patterns.
            </p>
          </aside>

          <div className="trust-section-list">
            <article className="trust-section">
              <span>01</span>
              <div>
                <h2>Accountability</h2>
                <p>
                  <Link href="/victor-chinukwue/">Victor Chinukwue</Link>, founder and editor of Web
                  Growth, is accountable for publication and review decisions. The reviewer label on
                  Academy articles refers to this founder-led review, not to a separate or independent
                  editorial team.
                </p>
              </div>
            </article>
            {sections.map((section, index) => (
              <article key={section.title} className="trust-section">
                <span>{String(index + 2).padStart(2, "0")}</span>
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-contact">
        <div className="trust-container trust-contact-inner">
          <div>
            <p className="trust-kicker">Accountability and contact</p>
            <h2>Found an error or need clarification?</h2>
            <p>
              Send correction requests to <a href={CONTACT_EMAIL_HREF}>{CONTACT_EMAIL}</a>. For
              project enquiries, use the <Link href="/contact/">contact page</Link>.
            </p>
          </div>
          <Link className="trust-button" href="/contact/">
            Contact Web Growth
          </Link>
        </div>
      </section>
    </main>
  );
}
