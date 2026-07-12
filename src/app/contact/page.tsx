import { Suspense } from "react";
import Link from "next/link";
import ContactClient from "@/components/ContactClient";
import StructuredData from "@/components/StructuredData";
import TrackedLink from "@/components/analytics/TrackedLink";
import {
  AuditIcon,
  BuildIcon,
  ConvertIcon,
  GrowthChartIcon,
  IconBadge,
  MailIcon,
  SearchIcon,
  TargetIcon,
} from "@/components/home/HomeIcons";
import { buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";
import {
  BUSINESS_PHONE_DISPLAY,
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  buildWhatsAppUrl,
} from "@/lib/site";
import { isEmailDeliveryConfigured } from "@/lib/email";

const pageDescription =
  "Request a website review from Web Growth. Send your website link or business details and get guidance on clarity, trust, speed, mobile experience, and enquiry flow.";

export const metadata = buildPageMetadata({
  title: "Contact Web Growth | Website Review, SEO, and Redesign Enquiries",
  description: pageDescription,
  path: "/contact/",
  keywords: [
    "contact web growth",
    "request a website review",
    "website review request",
    "website audit enquiry",
    "website redesign enquiry",
    "website speed review",
  ],
});

const enquiryReasons = [
  {
    title: "The site is not earning trust",
    text: "The business may be credible, but the current website does not make that clear fast enough.",
    icon: <SearchIcon />,
  },
  {
    title: "The offer needs a stronger path",
    text: "Visitors need clearer service pages, better CTAs, and a more confident enquiry journey.",
    icon: <TargetIcon />,
  },
  {
    title: "The build needs senior execution",
    text: "A redesign, migration, landing page, or new website needs strategy and implementation to stay connected.",
    icon: <BuildIcon />,
  },
  {
    title: "Growth systems are missing",
    text: "SEO, tracking, speed, content structure, and automation need to support the website after launch.",
    icon: <GrowthChartIcon />,
  },
] as const;

const nextSteps = [
  {
    number: "01",
    title: "Send the context",
    text: "Share the website, business type, main issue, and what you want the website to help achieve.",
    icon: <MailIcon />,
  },
  {
    number: "02",
    title: "Web Growth reviews the signal",
    text: "The response focuses on the clearest blockers across trust, clarity, SEO, speed, and enquiry flow.",
    icon: <AuditIcon />,
  },
  {
    number: "03",
    title: "Choose the right next move",
    text: "That may be an audit, redesign, landing page, SEO improvement, or a more complete website build.",
    icon: <ConvertIcon />,
  },
] as const;

const startingPoints = [
  {
    href: "/services/website-audit/",
    title: "Website Audit",
    text: "Best when you need the main trust, SEO, conversion, and performance blockers identified first.",
  },
  {
    href: "/services/business-website-design/",
    title: "Business Website Design",
    text: "Best when the current site is missing the structure and polish needed to represent the business well.",
  },
  {
    href: "/services/website-redesign/",
    title: "Website Redesign",
    text: "Best when an existing website needs a stronger premium presentation and better conversion path.",
  },
  {
    href: "/services/search-engine-optimisation/",
    title: "SEO Setup",
    text: "Best when discoverability, technical SEO, internal linking, and commercial search pages need attention.",
  },
] as const;

const faqItems = [
  {
    question: "Do I need a complete project brief before contacting Web Growth?",
    answer:
      "No. A website link, business context, and the main problem are enough to start the conversation.",
  },
  {
    question: "Can I ask about a specific service?",
    answer:
      "Yes. Use the service interest field or include the service in your message so the response can focus on the right scope.",
  },
  {
    question: "Is a website review a guaranteed result or ranking promise?",
    answer:
      "No. It is a practical review of visible website issues and possible next steps, not a guarantee of traffic, rankings, leads, or revenue.",
  },
] as const;

export default function ContactPage() {
  const directDeliveryConfigured = isEmailDeliveryConfigured();
  const whatsappHref = buildWhatsAppUrl(
    "Hello Web Growth, I would like a website review. Here is my website/business detail:"
  );

  return (
    <>
      <StructuredData data={buildProfessionalServiceSchema("/contact/", pageDescription)} />

      <main className="contact-page">
        <section className="contact-hero">
          <div className="contact-container contact-hero-grid">
            <div>
              <p className="contact-kicker">Contact Web Growth</p>
              <h1>Request a Website Review. Start with the website problem.</h1>
              <p>
                Request a website review, ask a focused project question, or discuss implementation.
                You do not need a polished brief. Clear business context is enough.
              </p>
              <div className="contact-actions">
                <Link className="contact-button contact-button-primary" href="#contact-form">
                  Start Your Website Review
                </Link>
                <TrackedLink
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-button contact-button-secondary"
                  ctaName="whatsapp"
                  ctaLocation="contact_hero"
                  destination="whatsapp"
                  pageType="contact"
                  offerType="website_review"
                >
                  Message on WhatsApp
                </TrackedLink>
              </div>
            </div>

            <aside className="contact-hero-panel" aria-label="Contact details and response process">
              <p className="contact-kicker">Direct contact</p>
              <div className="contact-detail-list">
                <a href={CONTACT_EMAIL_HREF}>
                  <span>Email</span>
                  <strong>{CONTACT_EMAIL}</strong>
                </a>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <span>WhatsApp</span>
                  <strong>{BUSINESS_PHONE_DISPLAY}</strong>
                </a>
              </div>
              <ol>
                {nextSteps.map((step) => (
                  <li key={step.number}>
                    <span>{step.number}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <small>{step.text}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <section className="contact-intake">
          <div className="contact-container contact-intake-grid">
            <Suspense fallback={<div className="contact-form-loading">Loading form...</div>}>
              <ContactClient directDeliveryConfigured={directDeliveryConfigured} />
            </Suspense>

            <aside className="contact-side">
              <p className="contact-kicker">Best use of this form</p>
              <h2>Send enough context to make the response useful.</h2>
              <p>
                The most useful enquiries include the website URL, what feels weak, the type of
                service you are considering, and the business outcome you want the site to support.
              </p>
              <div className="contact-side-note">
                <span>No fake guarantees</span>
                <p>
                  Web Growth will not promise rankings, traffic, enquiries, or revenue from a form
                  submission. The goal is to identify the next practical step.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="contact-reasons">
          <div className="contact-container">
            <div className="contact-section-heading">
              <p className="contact-kicker">When to enquire</p>
              <h2>Useful reasons to start a conversation.</h2>
              <p>
                Web Growth is strongest when the website has to improve trust, search visibility,
                conversion quality, and business presentation together.
              </p>
            </div>
            <div className="contact-reason-grid">
              {enquiryReasons.map((item) => (
                <article key={item.title}>
                  <IconBadge tone="blue" className="h-11 w-11">
                    {item.icon}
                  </IconBadge>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-starting">
          <div className="contact-container contact-starting-grid">
            <div>
              <p className="contact-kicker">Starting points</p>
              <h2>If you already know the issue, start with the closest service.</h2>
            </div>
            <div className="contact-link-list">
              {startingPoints.map((item) => (
                <Link key={item.href} href={item.href}>
                  <span>{item.title}</span>
                  <small>{item.text}</small>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-faq">
          <div className="contact-container">
            <div className="contact-section-heading">
              <p className="contact-kicker">Common questions</p>
              <h2>Before you send the enquiry.</h2>
              <Link href="/faq/">View all FAQs</Link>
            </div>
            <div className="contact-faq-grid">
              {faqItems.map((item) => (
                <details key={item.question}>
                  <summary>
                    <span>{item.question}</span>
                    <b>+</b>
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-final">
          <div className="contact-container contact-final-inner">
            <div>
              <p className="contact-kicker">Final trust message</p>
              <h2>A better website starts with a clearer diagnosis.</h2>
              <p>
                Send the current state honestly. The reply can then focus on whether the right next
                step is audit, rebuild, SEO, performance, conversion work, or a smaller fix first.
              </p>
            </div>
            <Link className="contact-button contact-button-primary" href="#contact-form">
              Start Your Website Review
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
