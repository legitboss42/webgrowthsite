import Link from "next/link";
import {
  BuildIcon,
  CheckIcon,
  GrowthChartIcon,
  IconBadge,
  MonetizeIcon,
  ShieldIcon,
  SpeedIcon,
} from "@/components/home/HomeIcons";

const principles = [
  {
    title: "Clarity before decoration",
    text: "Every section has to make the offer, proof, and next action easier to understand.",
    icon: <BuildIcon />,
  },
  {
    title: "Performance as trust",
    text: "Speed, mobile quality, and stable implementation shape how credible a business feels.",
    icon: <SpeedIcon />,
  },
  {
    title: "Search and conversion together",
    text: "A stronger website should support traffic, enquiries, and the commercial path after the click.",
    icon: <GrowthChartIcon />,
  },
  {
    title: "Responsible monetization",
    text: "Revenue work has to respect policy, user experience, and the long-term value of the site.",
    icon: <MonetizeIcon />,
  },
] as const;

const expertise = [
  "Premium business website design",
  "Website redesign and migration planning",
  "Technical SEO and content architecture",
  "Performance, accessibility, and mobile UX",
  "Landing pages and enquiry journeys",
  "Analytics, automation, and growth tooling",
] as const;

const philosophy = [
  {
    label: "01",
    title: "Understand the business before the interface",
    text: "The work starts with the offer, audience, proof, objections, and commercial goal. Design follows that logic.",
  },
  {
    label: "02",
    title: "Build the trust path",
    text: "The site has to show why the business is credible, what the visitor should do next, and why that action is safe.",
  },
  {
    label: "03",
    title: "Protect the growth foundation",
    text: "Routes, metadata, internal links, content quality, speed, accessibility, and tracking are treated as core build quality.",
  },
] as const;

const selectedLinks = [
  {
    href: "/portfolio/",
    eyebrow: "Case studies",
    title: "Selected work and project evidence",
    text: "See how Web Growth presents completed work without inflated results claims.",
  },
  {
    href: "/services/",
    eyebrow: "Services",
    title: "Website design, SEO, and growth systems",
    text: "Explore the implementation support available for businesses that need a stronger web presence.",
  },
  {
    href: "/blog/",
    eyebrow: "Academy",
    title: "Practical website growth guidance",
    text: "Read the editorial guides behind the Web Growth approach to design, SEO, and conversion.",
  },
] as const;

const trustLinks = [
  { href: "/editorial-policy/", label: "Editorial Policy" },
  { href: "/disclaimer/", label: "Disclaimer" },
  { href: "/privacy/", label: "Privacy Policy" },
  { href: "/terms/", label: "Terms" },
] as const;

export default function AboutClient() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-container about-hero-grid">
          <div className="about-hero-copy">
            <p className="about-kicker">About Web Growth</p>
            <h1>Premium websites built with strategy, craft, and commercial discipline.</h1>
            <p>
              Web Growth is led by Victorious for businesses that need a website to do more
              than look presentable. The work connects design, SEO, speed, content structure, and
              conversion thinking so the website can support credibility, traffic, enquiries, and
              responsible revenue growth.
            </p>
            <div className="about-actions">
              <Link className="about-button about-button-primary" href="/contact/">
                Request a Website Review
              </Link>
              <Link className="about-button about-button-secondary" href="/portfolio/">
                View Case Studies
              </Link>
            </div>
          </div>

          <div className="about-founder-frame" aria-label="Founder-led Web Growth operating system visual">
            <div className="about-founder-orbit">
              <span className="about-orbit-node about-orbit-node-1">SEO</span>
              <span className="about-orbit-node about-orbit-node-2">UX</span>
              <span className="about-orbit-node about-orbit-node-3">CRO</span>
              <span className="about-orbit-node about-orbit-node-4">CWV</span>
              <div className="about-orbit-core">
                <strong>Web Growth</strong>
                <small>Strategy / design / build</small>
              </div>
            </div>
            <div className="about-founder-caption">
              <span>Founder-led</span>
              <strong>Victorious</strong>
              <small>Website strategy, design, SEO, and growth systems.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="about-answer">
        <div className="about-container about-answer-grid">
          <article>
            <p className="about-kicker">Direct answer</p>
            <h2>What is Web Growth?</h2>
            <p>
              Web Growth is a premium website growth platform for business owners who want a
              stronger digital presence. It combines services, Academy content, tools, and project
              evidence around one goal: helping websites become clearer, faster, more trustworthy,
              and more commercially useful.
            </p>
          </article>
          <article>
            <p className="about-kicker">Why it exists</p>
            <h2>Most websites fail before the visitor decides.</h2>
            <p>
              Weak positioning, slow pages, unclear services, thin proof, poor mobile flow, and
              disconnected SEO make good businesses look smaller than they are. Web Growth exists to
              fix those fundamentals with disciplined implementation.
            </p>
          </article>
        </div>
      </section>

      <section className="about-founder">
        <div className="about-container about-founder-grid">
          <div>
            <p className="about-kicker">Founder story</p>
            <h2>A practical design practice for businesses that need the web to work harder.</h2>
          </div>
          <div className="about-founder-story">
            <p>
              Web Growth is built around a simple observation: many businesses do not need more
              noise, they need a better website foundation. The work is intentionally senior-led so
              strategy, copy direction, design quality, technical SEO, and implementation decisions
              stay connected.
            </p>
            <p>
              The platform brings the service work, Academy resources, free tools, and case-study
              thinking into one place. That makes the approach visible before a business starts a
              project and keeps the advice grounded in practical website outcomes rather than vague
              marketing language.
            </p>
            <Link className="about-founder-link" href="/victorious/">
              Meet the Founder
            </Link>
          </div>
        </div>
      </section>

      <section className="about-principles">
        <div className="about-container">
          <div className="about-section-heading">
            <p className="about-kicker">Working philosophy</p>
            <h2>The standards behind the work.</h2>
            <p>
              The site should feel premium because the structure, copy, visuals, and technical
              foundation are doing their jobs.
            </p>
          </div>
          <div className="about-principle-grid">
            {principles.map((item) => (
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

      <section className="about-process">
        <div className="about-container about-process-grid">
          <div>
            <p className="about-kicker">Process</p>
            <h2>Build the website around the decision journey.</h2>
            <p>
              Every project should reduce uncertainty for the visitor and give the business a
              stronger foundation for search, conversion, and future growth.
            </p>
          </div>
          <div className="about-process-list">
            {philosophy.map((item) => (
              <article key={item.title}>
                <span>{item.label}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-expertise">
        <div className="about-container about-expertise-grid">
          <div>
            <p className="about-kicker">Technical and strategic expertise</p>
            <h2>Design quality backed by growth infrastructure.</h2>
            <p>
              Web Growth focuses on the parts of a website that affect trust, discoverability,
              enquiry quality, and long-term maintainability.
            </p>
          </div>
          <ul>
            {expertise.map((item) => (
              <li key={item}>
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="about-selected">
        <div className="about-container">
          <div className="about-section-heading">
            <p className="about-kicker">Explore the platform</p>
            <h2>See the work, the services, and the thinking.</h2>
          </div>
          <div className="about-selected-grid">
            {selectedLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <span>{item.eyebrow}</span>
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="about-trust">
        <div className="about-container about-trust-grid">
          <div>
            <p className="about-kicker">Trust and accountability</p>
            <h2>No fake claims. No hidden standards.</h2>
            <p>
              Web Growth avoids fabricated metrics, invented testimonials, and unrealistic traffic
              promises. These pages explain the operating boundaries behind the platform.
            </p>
          </div>
          <div className="about-trust-links">
            {trustLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <ShieldIcon />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="about-final">
        <div className="about-container about-final-inner">
          <div>
            <p className="about-kicker">Next step</p>
            <h2>If the website is no longer helping the business, start with a direct review.</h2>
            <p>
              Share the website, the business context, and the problem you want solved. Web Growth
              will use that context to identify the practical next move.
            </p>
          </div>
          <Link className="about-button about-button-primary" href="/contact/">
            Request a Website Review
          </Link>
        </div>
      </section>
    </main>
  );
}
