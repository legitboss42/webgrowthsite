"use client";

import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/site";

const sections = [
  {
    title: "Information we collect",
    body: [
      "We may collect information you submit directly, such as your name, email address, phone number, business details, and website details when you contact us or request a review.",
      "We may also collect technical information such as browser type, pages visited, referral source, approximate location, and device data through analytics or server logs.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "We use submitted information to respond to enquiries, deliver requested services, improve the website experience, and understand which content or service pages are helping visitors best.",
      "We may also use data for analytics, spam prevention, and operational security.",
    ],
  },
  {
    title: "Cookies and analytics",
    body: [
      "This website may use cookies or similar technologies for analytics, performance measurement, security, and user experience improvements.",
      "Analytics tools help us understand how people use the site so we can improve content quality, navigation, and conversions.",
    ],
  },
  {
    title: "Third-party services",
    body: [
      "Some forms, analytics, or communication workflows may rely on third-party service providers. Those providers process data according to their own terms and privacy policies.",
      "We use only the services required to operate, measure, or protect the platform.",
    ],
  },
  {
    title: "Data sharing",
    body: [
      "We do not sell personal data. Information is only shared when required to deliver a requested service, operate the website, comply with law, or protect the platform and its users.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can contact us to request access, correction, or deletion of personal information you submitted directly, subject to any legal or operational requirements that still apply.",
    ],
  },
  {
    title: "Updates to this policy",
    body: [
      "We may update this Privacy Policy when the website, services, or legal requirements change. The latest version will always appear on this page.",
    ],
  },
] as const;

export default function PrivacyClient() {
  return (
    <main className="trust-page">
      <section className="trust-hero">
        <div className="trust-container">
          <p className="trust-kicker">Privacy Policy</p>
          <h1>How Web Growth handles information submitted through the platform.</h1>
          <p>
            This page explains how Web Growth collects, uses, and protects information on the
            website.
          </p>
        </div>
      </section>

      <section className="trust-content">
        <div className="trust-container trust-layout">
          <aside className="trust-sidebar" aria-label="Privacy policy summary">
            <p className="trust-kicker">Policy summary</p>
            <h2>Clear data handling for enquiries, analytics, and security.</h2>
            <p>
              Web Growth uses submitted information to respond to requests and operate the platform.
              Personal data is not sold.
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
            <h2>Questions about privacy or data handling?</h2>
            <p>
              Send privacy questions to{" "}
              <a href={CONTACT_EMAIL_HREF}>{CONTACT_EMAIL}</a>. For general project enquiries,
              use the <Link href="/contact/">contact page</Link>.
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
