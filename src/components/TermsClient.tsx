"use client";

import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/site";

const sections = [
  {
    title: "Use of the website",
    body: [
      "You agree to use this website for lawful purposes only. You must not attempt to disrupt, damage, or gain unauthorized access to any part of the website or related systems.",
    ],
  },
  {
    title: "Enquiries and proposals",
    body: [
      "Information on this site is provided for general purposes. Any quote, proposal, or timeline is confirmed only after we review your project requirements and agree on scope in writing.",
    ],
  },
  {
    title: "Scope of work",
    body: [
      "Project scope is defined in writing through a proposal, statement of work, or agreement. Work outside the agreed scope may require additional fees and timeline adjustments.",
    ],
  },
  {
    title: "Client responsibilities",
    body: [
      "Clients are responsible for providing timely approvals, accurate business information, and access to required tools or accounts where needed.",
      "Delays in providing these may affect delivery timelines.",
    ],
  },
  {
    title: "Payments and revisions",
    body: [
      "Payment terms, deposits, milestones, and revision limits are defined in the relevant proposal or invoice. Additional work or excessive revisions may require extra fees.",
    ],
  },
  {
    title: "Intellectual property",
    body: [
      "Unless stated otherwise, once final payment is received, you own the final deliverables created specifically for your project.",
      "Web Growth may continue using general techniques, reusable components, and non-client-specific code.",
    ],
  },
  {
    title: "Third-party tools and limitations",
    body: [
      "Websites may rely on hosting, analytics, plugins, payment tools, or other third-party services. Web Growth is not responsible for outages, policy changes, or service limitations imposed by those providers.",
    ],
  },
  {
    title: "Results and liability",
    body: [
      "Web Growth provides services with reasonable care and skill, but does not guarantee specific rankings, sales, traffic, or revenue outcomes.",
      "Business performance depends on many factors outside our control.",
    ],
  },
  {
    title: "Termination and updates",
    body: [
      "Either party may end a project with written notice. Work completed up to termination remains payable.",
      "These Terms may be updated from time to time, and the latest version will appear on this page.",
    ],
  },
] as const;

export default function TermsClient() {
  return (
    <main className="trust-page">
      <section className="trust-hero">
        <div className="trust-container">
          <p className="trust-kicker">Terms of Service</p>
          <h1>The terms that govern use of the platform and project engagement.</h1>
          <p>
            These terms apply to use of the website and, where applicable, the terms under which
            Web Growth provides website and growth services.
          </p>
        </div>
      </section>

      <section className="trust-content">
        <div className="trust-container trust-layout">
          <aside className="trust-sidebar" aria-label="Terms summary">
            <p className="trust-kicker">Engagement boundaries</p>
            <h2>Scope, ownership, payment, and results are defined clearly.</h2>
            <p>
              Web Growth confirms project commitments in writing and does not guarantee rankings,
              traffic, sales, or revenue outcomes.
            </p>
          </aside>

          <div className="trust-section-list">
            {sections.map((section, index) => (
              <article key={section.title} className="trust-section">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2>{section.title}</h2>
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-contact">
        <div className="trust-container trust-contact-inner">
          <div>
            <p className="trust-kicker">Contact</p>
            <h2>Questions about these terms?</h2>
            <p>
              Send terms questions to <a href={CONTACT_EMAIL_HREF}>{CONTACT_EMAIL}</a>. For project
              enquiries, use the <Link href="/contact/">contact page</Link>.
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
