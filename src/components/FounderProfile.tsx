import Image from "next/image";
import Link from "next/link";
import { portfolioCases } from "@/lib/portfolioCases";

const capabilities = [
  {
    number: "01",
    title: "Website strategy and development",
    text: "Premium business websites, landing pages, ecommerce experiences, redesigns, responsive interfaces, and maintainable component systems.",
  },
  {
    number: "02",
    title: "SEO and performance",
    text: "Technical SEO foundations, site architecture, metadata, internal linking, accessibility, image optimisation, and Core Web Vitals protection.",
  },
  {
    number: "03",
    title: "Conversion and lead generation",
    text: "Offer structure, calls to action, enquiry paths, booking journeys, analytics, and landing-page decisions shaped around visitor intent.",
  },
  {
    number: "04",
    title: "Connected growth systems",
    text: "Practical website integrations, analytics and tracking, email workflows, automation, and the digital infrastructure behind the interface.",
  },
] as const;

const principles = [
  "Understand the business before designing the interface.",
  "Build around the customer’s decision journey.",
  "Protect performance, accessibility, and search visibility.",
  "Measure the work by its usefulness to the business.",
] as const;

const technologyGroups = [
  {
    title: "Development",
    items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Responsive interfaces"],
  },
  {
    title: "Search and quality",
    items: ["Technical SEO", "Structured data", "Accessibility", "Core Web Vitals", "Performance"],
  },
  {
    title: "Growth infrastructure",
    items: ["Analytics and tracking", "Conversion systems", "Email workflows", "Automation", "Website audits"],
  },
] as const;

const featuredWork = portfolioCases.filter((item) =>
  ["jluxe", "tlc-interiors", "treats-by-ann"].includes(item.slug)
);

export default function FounderProfile() {
  return (
    <main className="founder-page">
      <section className="founder-hero">
        <div className="founder-container founder-hero-grid">
          <div className="founder-hero-copy">
            <p className="founder-kicker">Founder of Web Growth</p>
            <h1>Victorious</h1>
            <p className="founder-positioning">
              Frontend-focused full-stack developer, website strategist, and growth systems builder.
            </p>
            <p className="founder-intro">
              I build premium websites and connected digital systems that help businesses present
              their value clearly, improve search visibility, and turn more of the right visits into
              useful enquiries and next steps.
            </p>
            <div className="founder-actions">
              <Link className="founder-button founder-button-primary" href="/contact/">
                Request a Website Review
              </Link>
              <Link className="founder-button founder-button-secondary" href="/portfolio/">
                View Selected Work
              </Link>
            </div>
            <ul className="founder-meta" aria-label="Founder location and availability">
              <li>Lagos, Nigeria</li>
              <li>Nigerian and international projects</li>
              <li>Next.js, SEO, performance, and growth systems</li>
            </ul>
          </div>

          <div className="founder-portrait-panel">
            <div className="founder-portrait-frame">
              <Image
                src="/images/authors/victorious-clean.webp"
                alt="Illustrated portrait of Victorious, founder of Web Growth"
                fill
                priority
                sizes="(max-width: 900px) 82vw, 420px"
                className="founder-portrait"
              />
            </div>
            <div className="founder-status-card">
              <span aria-hidden="true" />
              <div>
                <small>Founder-led delivery</small>
                <strong>Strategy and implementation stay connected.</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="founder-credibility" aria-label="Professional focus">
        <div className="founder-container founder-credibility-grid">
          <p>Founder-led project delivery</p>
          <p>Frontend-focused full-stack development</p>
          <p>Technical SEO and performance</p>
          <p>Conversion-aware implementation</p>
        </div>
      </section>

      <section className="founder-story founder-section">
        <div className="founder-container founder-story-grid">
          <div className="founder-section-heading">
            <p className="founder-kicker">More than interface design</p>
            <h2>I build around how the business and its customers actually work.</h2>
          </div>
          <div className="founder-story-copy">
            <p>
              Web Growth brings website strategy, frontend development, technical SEO, content
              structure, performance, conversion thinking, analytics, and practical automation into
              one connected process.
            </p>
            <p>
              I do not begin with decoration or a template. I begin with the offer, the audience,
              the proof a visitor needs, the friction weakening trust, and the action the website
              needs to make easier.
            </p>
          </div>
        </div>
      </section>

      <section className="founder-capabilities founder-section">
        <div className="founder-container">
          <div className="founder-section-heading founder-section-heading-wide">
            <p className="founder-kicker">What I do</p>
            <h2>Design quality backed by growth infrastructure.</h2>
          </div>
          <div className="founder-capability-grid">
            {capabilities.map((capability) => (
              <article key={capability.title}>
                <span>{capability.number}</span>
                <h3>{capability.title}</h3>
                <p>{capability.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="founder-work founder-section">
        <div className="founder-container">
          <div className="founder-work-heading">
            <div className="founder-section-heading">
              <p className="founder-kicker">Selected work</p>
              <h2>Real project evidence, without inflated outcome claims.</h2>
            </div>
            <Link href="/portfolio/">Explore all case studies</Link>
          </div>

          <article className="founder-platform-card">
            <div>
              <p className="founder-kicker">Platform built and led by Victorious</p>
              <h3>Web Growth</h3>
              <p>
                A Next.js website growth platform connecting premium website services, practical
                Academy content, free tools, project evidence, technical SEO, and conversion paths.
              </p>
            </div>
            <ul>
              <li>Build, Grow, Monetize, and Scale framework</li>
              <li>Server-rendered Academy publishing system</li>
              <li>Interactive website planning and audit tools</li>
              <li>Governed routes, structured data, and performance controls</li>
            </ul>
          </article>

          <div className="founder-project-grid">
            {featuredWork.map((project) => (
              <article key={project.slug} className="founder-project-card">
                <div className="founder-project-image">
                  <Image
                    src={project.imageUrl}
                    alt={project.imageAlt}
                    fill
                    sizes="(max-width: 760px) 92vw, (max-width: 1100px) 44vw, 360px"
                    className="object-cover"
                  />
                </div>
                <div className="founder-project-copy">
                  <p>{project.projectType}</p>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  <Link
                    href={
                      project.slug === "jluxe"
                        ? "/blog/jluxe-medical-aesthetics-case-study/"
                        : "/portfolio/"
                    }
                  >
                    View project evidence
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="founder-principles founder-section">
        <div className="founder-container founder-principles-grid">
          <div className="founder-section-heading">
            <p className="founder-kicker">Working philosophy</p>
            <h2>The interface is only one part of a useful website.</h2>
            <p>
              The offer, proof, technical foundation, customer journey, and wider business systems
              have to work together.
            </p>
          </div>
          <ol>
            {principles.map((principle, index) => (
              <li key={principle}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{principle}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="founder-technology founder-section">
        <div className="founder-container">
          <div className="founder-section-heading founder-section-heading-wide">
            <p className="founder-kicker">Technical capabilities</p>
            <h2>Tools grouped by the job they need to do.</h2>
          </div>
          <div className="founder-technology-grid">
            {technologyGroups.map((group) => (
              <article key={group.title}>
                <h3>{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="founder-statement founder-section">
        <div className="founder-container">
          <blockquote>
            “I am most useful where design, technology, and business growth need to work together. A
            website should explain the offer clearly, earn trust quickly, protect search and
            performance, and make the next action easier.”
          </blockquote>
          <p>Victorious &middot; Founder, Web Growth</p>
        </div>
      </section>

      <section className="founder-final">
        <div className="founder-container founder-final-inner">
          <div>
            <p className="founder-kicker">Start with the business context</p>
            <h2>Have a website or digital system that needs stronger execution?</h2>
            <p>
              Share what is currently not working and what the finished system needs to achieve.
            </p>
          </div>
          <div className="founder-actions">
            <Link className="founder-button founder-button-primary" href="/contact/">
              Request a Website Review
            </Link>
            <Link className="founder-button founder-button-secondary" href="/portfolio/">
              View Case Studies
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
