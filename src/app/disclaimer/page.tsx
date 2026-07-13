import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";

const pageDescription =
  "Read the Web Growth disclaimer on educational guidance, affiliate context, and the limits of results claims, platform advice, and implementation examples.";

export const metadata = buildPageMetadata({
  title: "Website Disclaimer and Affiliate Disclosure | Web Growth",
  description: pageDescription,
  path: "/disclaimer",
  keywords: [
    "web growth disclaimer",
    "website growth disclaimer",
    "affiliate disclosure",
    "results disclaimer",
    "educational content disclaimer",
  ],
});

const sections = [
  {
    title: "Educational content only",
    body:
      "Web Growth publishes educational content, implementation guidance, and strategic opinions to help business owners make better website decisions. Nothing on this site should be treated as legal, financial, tax, or guaranteed platform approval advice.",
  },
  {
    title: "No guaranteed results",
    body:
      "Search visibility, lead generation, conversion performance, and monetization outcomes depend on the quality of the offer, competition, traffic sources, implementation quality, market conditions, and decisions outside Web Growth's control. We do not guarantee rankings, revenue, AdSense approval, or a specific number of enquiries.",
  },
  {
    title: "Platform and policy references",
    body:
      "When Web Growth discusses Google Search, AdSense, analytics platforms, hosting companies, or software tools, the information is based on the best available source material and practical experience at the time of publication. Platform rules, eligibility standards, and interfaces can change without notice.",
  },
  {
    title: "Affiliate and partner context",
    body:
      "Some recommendations and resource pages include affiliate links. Web Growth may receive a commission if you buy through one of those links, at no additional cost to you. Affiliate relationships do not determine the editorial conclusion: a recommendation must still be useful, relevant, and defensible, and the disclosure is placed near the affected recommendation.",
  },
  {
    title: "Examples and proof",
    body:
      "Case studies, examples, workflows, and screenshots are shared to explain strategy, implementation choices, or project direction. They should not be interpreted as a promise that the same outcome will happen in another business context.",
  },
  {
    title: "External links and third-party tools",
    body:
      "External websites, software providers, and third-party resources are outside Web Growth's control. We are not responsible for changes, outages, security issues, pricing changes, or content updates on external services linked from this site.",
  },
] as const;

export default function DisclaimerPage() {
  return (
    <main className="trust-page">
      <section className="trust-hero">
        <div className="trust-container">
          <p className="trust-kicker">Disclaimer</p>
          <h1>Clear boundaries around guidance, examples, and website growth claims.</h1>
          <p>
            This page explains how to interpret the educational, strategic, and commercial
            information published on Web Growth.
          </p>
        </div>
      </section>

      <section className="trust-content">
        <div className="trust-container trust-layout">
          <aside className="trust-sidebar" aria-label="Disclaimer summary">
            <p className="trust-kicker">Results boundary</p>
            <h2>Guidance is not a guarantee.</h2>
            <p>
              Web Growth does not guarantee rankings, revenue, AdSense approval, or a specific
              number of enquiries. Website outcomes depend on factors outside any single build.
            </p>
          </aside>

          <div className="trust-section-list">
            {sections.map((section, index) => (
              <article key={section.title} className="trust-section">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-contact">
        <div className="trust-container trust-contact-inner">
          <div>
            <p className="trust-kicker">Need context?</p>
            <h2>Use this page alongside the editorial and privacy policies.</h2>
            <p>
              Review the <Link href="/editorial-policy/">Editorial Policy</Link>,{" "}
              <Link href="/privacy/">Privacy Policy</Link>, or{" "}
              <Link href="/contact/">contact Web Growth</Link> if you need clarification.
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
