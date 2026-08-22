import Image from "next/image";
import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import StructuredData from "@/components/StructuredData";
import { ALL_SERVICE_PAGES } from "@/lib/newServiceConfigs";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const service = ALL_SERVICE_PAGES["business-automation"];

const SERVICE_PATH = "/services/business-automation/";
const serviceUrl = absoluteUrl(SERVICE_PATH);
const contactHref = `/contact?service=${encodeURIComponent(service.serviceParam)}`;

export const metadata = buildPageMetadata({
  title: service.seoTitle ?? service.title,
  description: service.metaDescription,
  path: SERVICE_PATH,
  keywords: service.keywords,
});

function Arrow() {
  return <span aria-hidden="true">-&gt;</span>;
}

const problems = [
  {
    tag: "Speed",
    title: "Slow lead response",
    text: "Enquiries wait because someone has to spot them and reply by hand, and the fastest response usually wins the job.",
  },
  {
    tag: "Admin",
    title: "Duplicate data entry",
    text: "The same customer details get typed into a form, a CRM, and a spreadsheet, wasting time and creating errors.",
  },
  {
    tag: "Follow-up",
    title: "Dropped follow-ups",
    text: "Bookings, reminders, and check-ins depend on a person remembering to send them, so some never go out.",
  },
  {
    tag: "Reporting",
    title: "Manual reporting",
    text: "Reporting means exporting from several tools and stitching numbers together again every single week.",
  },
];

const popularAutomations = [
  "Instant lead response - a new form or WhatsApp enquiry triggers an auto-reply and creates a follow-up task.",
  "Lead-to-CRM sync - every enquiry lands in your CRM with its source, tags, and owner already set.",
  "Booking to reminder - a confirmed booking creates a calendar hold and schedules reminders automatically.",
  "Invoice follow-up - unpaid invoices trigger polite, timed reminders without anyone chasing manually.",
  "Review requests - a completed job triggers a review invitation at the right moment.",
  "Scheduled reporting - numbers from your tools are pulled into one summary and sent on a set schedule.",
];

const categories = [
  {
    name: "Lead & follow-up automation",
    text: "Capture, route, and follow up with new enquiries automatically so no lead waits on manual entry.",
  },
  {
    name: "CRM & data sync",
    text: "Keep contact records, deal stages, and tags consistent across the tools your team uses.",
  },
  {
    name: "Booking & scheduling",
    text: "Connect booking tools to calendars, reminders, and CRM updates to cut no-shows and admin.",
  },
  {
    name: "Billing & payments",
    text: "Automate invoicing, payment reminders, and receipts so cash flow does not depend on memory.",
  },
  {
    name: "Email & messaging",
    text: "Trigger the right message at the right step of the customer journey across email and messaging.",
  },
  {
    name: "Reporting & dashboards",
    text: "Pull data from multiple tools into scheduled reports and live dashboards you can actually read.",
  },
];

const toolCategories = [
  "CRM systems",
  "Email platforms",
  "Form builders",
  "Calendars & booking",
  "Messaging & WhatsApp",
  "Spreadsheets & databases",
  "Payments & invoicing",
  "Support & helpdesk",
];

const apiCapabilities = [
  "Direct API connections between tools that have no ready-made integration",
  "Webhook handling so actions in one tool trigger work in another in real time",
  "Data mapping and transformation so fields line up correctly between systems",
  "Secure authentication and credential handling kept on the server side",
];

const aiCapabilities = [
  "Draft replies and messages for a person to review and send",
  "Classify and route incoming enquiries by intent or priority",
  "Summarise long email threads, documents, or notes",
  "Extract key details from enquiries into structured fields",
];

const reliabilityPoints = [
  "Error handling so a single failed step does not silently break the workflow",
  "Alerts when something fails, so problems are visible and fixable",
  "Testing against real scenarios before an automation goes live",
  "Documentation so your team understands and can extend each workflow",
];

const securityPoints = [
  "Least-privilege access - automations only get the permissions they need",
  "Credentials handled server-side and stored in each tool's own secure vault",
  "No unnecessary copying of sensitive data between systems",
  "Automations built to respect each platform's rate limits and terms",
];

const schema = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${serviceUrl}#service`,
    name: service.title,
    description: service.metaDescription,
    url: serviceUrl,
    serviceType: "Business automation and workflow integration",
    provider: {
      "@id": `${SITE_URL}#professional-service`,
    },
    category: "Business Process Automation",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${serviceUrl}#faq`,
    mainEntity: service.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  },
  buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Services", path: "/services/" },
    { name: service.title, path: SERVICE_PATH },
  ]),
];

export default function Page() {
  return (
    <div className="service-detail-system">
      <StructuredData data={schema} />

      <section className="service-detail-hero" aria-labelledby="automation-hero-title">
        <div className="services-container service-detail-hero-grid">
          <div>
            <Link href="/services/" className="service-breadcrumb">
              Services <Arrow />
            </Link>
            <p className="services-kicker">Business automation</p>
            <h1 id="automation-hero-title">{service.heroTitle}</h1>
            <p>{service.heroDescription}</p>
            <div className="services-actions">
              <TrackedLink
                href={contactHref}
                ctaName="automate_workflow"
                ctaLocation="automation_hero"
                destination="contact"
                pageType="service_detail"
                className="services-button services-button-primary"
              >
                Automate Your Workflow <Arrow />
              </TrackedLink>
              <TrackedLink
                href="/services/"
                ctaName="view_all_services"
                ctaLocation="automation_hero"
                destination="services"
                pageType="service_detail"
                className="services-button services-button-secondary"
              >
                View All Services
              </TrackedLink>
            </div>
          </div>
          <div className="service-detail-visual">
            <Image
              src={service.heroImage}
              alt="Web Growth business automation and workflow integration service"
              width={1300}
              height={960}
              quality={75}
              priority
            />
            <div>
              <span>Engagement focus</span>
              <strong>Workflow automation & integration</strong>
              <small>{service.highlights.slice(0, 3).join(" / ")}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="automation-problems-title">
        <div className="services-container">
          <p className="services-kicker">Problems automation solves</p>
          <h2 id="automation-problems-title">Where repetitive work quietly costs you.</h2>
          <p>
            Most small teams lose hours every week to manual steps that could run on their own. These are the patterns
            automation is built to remove.
          </p>
          <div className="services-process-grid" style={{ marginTop: "34px" }}>
            {problems.map((problem, index) => (
              <article key={problem.title}>
                <span>{problem.tag}</span>
                <h3>{problem.title}</h3>
                <p>{problem.text}</p>
                <span className="sr-only">{`Problem ${index + 1}`}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="automation-popular-title">
        <div className="services-container service-detail-split">
          <div>
            <p className="services-kicker">Popular automations</p>
            <h2 id="automation-popular-title">The automations businesses ask for most.</h2>
            <p>
              These are practical, high-impact workflows we set up regularly. Each one removes a manual step that slows
              down response, follow-up, or reporting.
            </p>
          </div>
          <div className="service-deliverable-grid">
            {popularAutomations.map((item, index) => (
              <article key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="automation-categories-title">
        <div className="services-container">
          <p className="services-kicker">Automation categories</p>
          <h2 id="automation-categories-title">Areas of your business we can automate.</h2>
          <p>
            Expand a category to see what it covers. Most projects combine a few of these into one connected workflow.
          </p>
          <div className="services-faq-grid" style={{ marginTop: "30px" }}>
            {categories.map((category) => (
              <details key={category.name}>
                <summary>{category.name}</summary>
                <p>{category.text}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="service-detail-dark" aria-labelledby="automation-process-title">
        <div className="services-container service-process-grid">
          <div>
            <p className="services-kicker">How it works</p>
            <h2 id="automation-process-title">From manual workflow to dependable automation.</h2>
            <p>
              We keep the process practical: understand the real workflow first, build carefully, then test before
              anything runs on its own.
            </p>
          </div>
          <div className="service-process-list">
            {service.process.map((step, index) => (
              <article key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="automation-tools-title">
        <div className="services-container">
          <p className="services-kicker">Tools we can connect</p>
          <h2 id="automation-tools-title">We work with the tools you already use.</h2>
          <p>
            We regularly connect tools such as CRMs, email and messaging platforms, form builders, calendars, booking
            apps, spreadsheets, and payment tools. Tool names and categories are shown as examples of common
            integrations, not partnerships or endorsements. If a tool offers an API or webhook, we can usually connect
            it.
          </p>
          <div className="service-highlight-list">
            {toolCategories.map((tool) => (
              <span key={tool}>{tool}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="automation-api-title">
        <div className="services-container service-detail-split">
          <div>
            <p className="services-kicker">Custom API integrations</p>
            <h2 id="automation-api-title">When off-the-shelf connectors are not enough.</h2>
            <p>
              Some tools do not have a ready-made integration. When both tools expose an API, we build a direct
              connection so data moves automatically instead of being copied by hand.
            </p>
          </div>
          <div className="service-deliverable-grid">
            {apiCapabilities.map((item, index) => (
              <article key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="automation-ai-title">
        <div className="services-container service-detail-split">
          <div>
            <p className="services-kicker">AI automation</p>
            <h2 id="automation-ai-title">Add AI where it genuinely helps.</h2>
            <p>
              AI can handle first drafts and sorting so your team moves faster. We keep a person in control of anything
              that matters - AI assists the workflow, it does not run your business unattended.
            </p>
          </div>
          <div className="service-highlight-list">
            {aiCapabilities.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="automation-reliability-title">
        <div className="services-container service-fit-grid">
          <article>
            <p className="services-kicker">Reliability</p>
            <h2 id="automation-reliability-title">Built to stay reliable.</h2>
            <ul>
              {reliabilityPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
          <article>
            <p className="services-kicker">Security</p>
            <h2>Handled securely.</h2>
            <ul>
              {securityPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="services-section" aria-labelledby="automation-faq-title">
        <div className="services-container">
          <p className="services-kicker">FAQs</p>
          <h2 id="automation-faq-title">Business automation FAQs</h2>
          <div className="services-faq-grid" style={{ marginTop: "30px" }}>
            {service.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="services-final-cta" aria-labelledby="automation-cta-title">
        <div className="services-container services-final-inner">
          <div>
            <p className="services-kicker">Next step</p>
            <h2 id="automation-cta-title">{service.ctaTitle}</h2>
          </div>
          <div>
            <p>{service.ctaDescription}</p>
            <TrackedLink
              href={contactHref}
              ctaName="automate_workflow_final"
              ctaLocation="automation_final_cta"
              destination="contact"
              pageType="service_detail"
              className="services-button services-button-primary"
            >
              Automate Your Workflow <Arrow />
            </TrackedLink>
          </div>
        </div>
      </section>
    </div>
  );
}
