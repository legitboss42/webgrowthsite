import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ALL_SERVICE_PAGES } from "@/lib/newServiceConfigs";
import { portfolioCases } from "@/lib/portfolioCases";
import { getPublicPosts } from "@/lib/posts";
import { PUBLIC_TOOLS } from "@/lib/tools";
import HomeMotion from "@/components/home/HomeMotion";

const processSteps = [
  {
    label: "01",
    title: "Build",
    text: "Design and develop a clear, credible website around your offer, audience, and conversion path.",
  },
  {
    label: "02",
    title: "Grow",
    text: "Strengthen search foundations, content structure, speed, and user experience so the site can attract better traffic.",
  },
  {
    label: "03",
    title: "Monetize",
    text: "Turn attention into enquiries, bookings, product interest, or AdSense-ready content journeys without false promises.",
  },
  {
    label: "04",
    title: "Scale",
    text: "Create a maintainable web system that supports future services, articles, tools, campaigns, and growth decisions.",
  },
];

const trustItems = [
  ["Practical strategy", "No template theatre. Every section has a business job."],
  ["SEO-aware builds", "Metadata, structure, internal links, and performance stay part of the work."],
  ["Conversion focus", "Offers, proof, forms, and calls to action are designed for real decisions."],
  ["Premium execution", "Considered presentation that never hides core content behind JavaScript."],
];

const serviceSlugs = [
  "business-website-design",
  "landing-page-design",
  "website-redesign",
  "ecommerce-website-design",
  "search-engine-optimisation",
  "performance-optimisation",
  "business-automation",
];

const serviceTone = ["Design", "Campaigns", "Redesign", "Commerce", "SEO", "Speed", "Automation"];

function Arrow() {
  return <span aria-hidden="true">-&gt;</span>;
}

function getHomepageServices() {
  return serviceSlugs
    .map((slug, index) => {
      const service = ALL_SERVICE_PAGES[slug];
      if (!service) return null;

      return {
        title: service.title,
        description: service.metaDescription || service.heroDescription,
        href: `/services/${service.slug}/`,
        tone: serviceTone[index],
      };
    })
    .filter(Boolean);
}

function getHomepageArticles() {
  return getPublicPosts()
    .filter((post) => post.cover)
    .slice(0, 3)
    .map((post) => ({
      title: post.title,
      category: String(post.category),
      readTime: post.readTime,
      image: post.cover || "/images/blog/homepage.webp",
      alt: post.coverAlt,
      href: `/blog/${post.slug}/`,
    }));
}

export default function ApprovedHomepage() {
  const services = getHomepageServices();
  const tools = PUBLIC_TOOLS.slice(0, 5);
  const articles = getHomepageArticles();
  const featuredCase = portfolioCases.find((item) => item.slug === "jluxe") || portfolioCases[0];
  const supportingCases = portfolioCases.filter((item) => item.slug !== featuredCase.slug).slice(0, 3);

  return (
    <div className="approved-homepage">
      <HomeMotion />
      <section className="approved-hero" aria-labelledby="homepage-hero-title">
        <div className="approved-hero-grid approved-container">
          <div className="approved-hero-copy">
            <p className="approved-kicker" data-home-hero>Design &middot; Growth &middot; Monetization</p>
            <h1 id="homepage-hero-title" data-home-hero>
              Websites that <span>earn</span>.
            </h1>
            <p className="approved-lede" data-home-hero>
              Web Growth builds premium websites and growth systems designed to earn attention, trust, and enquiries,
              built on real strategy, SEO foundations, and honest conversion paths, never inflated promises.
            </p>
            <div className="approved-actions" aria-label="Homepage actions" data-home-hero>
              <Link className="approved-button approved-button-primary" href="/contact/">
                Work With Us <Arrow />
              </Link>
              <Link className="approved-button approved-button-secondary" href="/portfolio/">
                View Case Studies
              </Link>
            </div>
            <p className="approved-hero-note" data-home-hero>A six-stage growth cycle &middot; build to monetize</p>
          </div>

          <div className="approved-hero-visual" aria-label="Web Growth's six-stage growth cycle">
            <div className="approved-cycle">
              <span className="approved-cycle-ring" aria-hidden="true" data-cycle-ring />
              <span className="approved-cycle-needle" aria-hidden="true" />
              <div className="approved-cycle-core" data-cycle-core>
                <span className="approved-hub-eyebrow">The method</span>
                <strong>Growth cycle</strong>
                <small>Six stages &middot; one system</small>
              </div>
              <div className="approved-cycle-orbit">
                {["Plan", "Build", "Optimise", "Attract", "Convert", "Monetize"].map((title, index) => (
                  <div
                    className={`approved-cycle-node approved-cycle-node-${index + 1}`}
                    key={title}
                    style={{ "--i": index } as CSSProperties}
                  >
                    <div className="approved-cycle-node-inner" data-cycle-node>
                      <span>{`0${index + 1}`}</span>
                      <strong>{title}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="approved-container approved-credibility-strip" aria-label="Web Growth advantages">
          {trustItems.map(([title, copy]) => (
            <div key={title} data-credibility-item>
              <span aria-hidden="true" />
              <strong>{title}</strong>
              <small>{copy}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="approved-section approved-process" id="process" aria-labelledby="process-title">
        <div className="approved-container approved-section-heading" data-home-reveal>
          <div>
            <p className="approved-kicker">Build - Grow - Monetize - Scale</p>
            <h2 id="process-title">A connected process for websites that need to perform.</h2>
          </div>
          <Link className="approved-text-link" href="/about/">
            See how we work <Arrow />
          </Link>
        </div>
        <div className="approved-container approved-process-grid" data-home-stagger>
          {processSteps.map((step) => (
            <article className="approved-process-card" key={step.title}>
              <span>{step.label}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="approved-featured" aria-labelledby="featured-case-title">
        <div className="approved-container approved-featured-grid">
          <div className="approved-featured-copy" data-home-reveal>
            <p className="approved-kicker">Featured case study</p>
            <h2 id="featured-case-title">{featuredCase.title}</h2>
            <p>{featuredCase.summary}</p>
            <Link className="approved-button approved-button-secondary" href="/portfolio/">
              View Case Studies <Arrow />
            </Link>
          </div>
          <div className="approved-device-frame" data-home-reveal data-home-depth>
            <Image
              src={featuredCase.imageUrl}
              alt={featuredCase.imageAlt}
              width={1600}
              height={1200}
              quality={75}
              sizes="(max-width: 900px) 100vw, 58vw"
            />
          </div>
          <div className="approved-proof-list" aria-label="Verified project notes" data-home-stagger>
            {featuredCase.deliveredImprovements.map((result) => (
              <div key={result}>
                <strong>{result}</strong>
                <span>{featuredCase.type}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="approved-section approved-services" aria-labelledby="services-title">
        <div className="approved-container approved-section-heading" data-home-reveal>
          <div>
            <p className="approved-kicker">Services</p>
            <h2 id="services-title">Premium web design services with strategy built in.</h2>
          </div>
          <Link className="approved-text-link" href="/services/">
            View all services <Arrow />
          </Link>
        </div>
        <div className="approved-container approved-services-layout" data-home-stagger>
          {services.map((service, index) =>
            service ? (
              <Link href={service.href} className={`approved-service-card approved-service-card-${index + 1}`} key={service.href}>
                <span>{service.tone}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <small>
                  Explore service <Arrow />
                </small>
              </Link>
            ) : null
          )}
        </div>
      </section>

      <section className="approved-advantage" aria-labelledby="advantage-title">
        <div className="approved-container approved-advantage-grid">
          <div data-home-reveal>
            <p className="approved-kicker">The Web Growth advantage</p>
            <h2 id="advantage-title">A premium website should feel sharp, but it must also work.</h2>
          </div>
          <div className="approved-advantage-copy" data-home-reveal>
            <p>
              The system combines editorial clarity, technical SEO, and conversion thinking, so the website supports
              credibility, discovery, enquiries, and revenue paths, not just a strong first impression.
            </p>
            <div>
              <span>Strategy before styling</span>
              <span>Content remains crawlable</span>
              <span>Performance stays protected</span>
            </div>
          </div>
        </div>
      </section>

      <section className="approved-section approved-academy" aria-labelledby="academy-title">
        <div className="approved-container approved-section-heading" data-home-reveal>
          <div>
            <p className="approved-kicker">Web Growth Academy</p>
            <h2 id="academy-title">Learn the systems behind better websites.</h2>
          </div>
          <Link className="approved-text-link" href="/blog/">
            Explore Academy <Arrow />
          </Link>
        </div>
        <div className="approved-container approved-academy-grid" data-home-stagger>
          {articles.map((article, index) => (
            <Link href={article.href} className={index === 0 ? "approved-article approved-article-featured" : "approved-article"} key={article.href}>
              <Image src={article.image} alt={article.alt} width={720} height={460} quality={75} sizes="(max-width: 900px) 100vw, 33vw" />
              <span>{article.category}</span>
              <strong>{article.title}</strong>
              <small>{article.readTime}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="approved-section approved-tools" aria-labelledby="tools-title">
        <div className="approved-container approved-tools-panel" data-home-reveal>
          <div>
            <p className="approved-kicker">Free tools</p>
            <h2 id="tools-title">Practical tools for better website decisions.</h2>
            <p>Use live Web Growth tools for planning, SEO checks, launch readiness, and conversion reviews.</p>
            <Link className="approved-button approved-button-primary" href="/tools/">
              View All Tools <Arrow />
            </Link>
          </div>
          <div className="approved-tool-list" data-home-stagger>
            {tools.map((tool) => (
              <Link href={`/tools/${tool.slug}/`} key={tool.slug}>
                <span>{tool.category}</span>
                <strong>{tool.shortTitle}</strong>
                <small>{tool.description}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="approved-trust" aria-labelledby="proof-title">
        <div className="approved-container approved-trust-grid">
          <div data-home-reveal>
            <p className="approved-kicker">Real projects, real constraints</p>
            <h2 id="proof-title">Selected work without fabricated metrics.</h2>
            <p>
              Web Growth presents qualitative outcomes that can be supported by the project record: clearer structure,
              stronger trust, responsive journeys, and better conversion paths.
            </p>
          </div>
          <div className="approved-case-stack" data-home-stagger>
            {supportingCases.map((item) => (
              <article key={item.slug}>
                <Image src={item.imageUrl} alt={item.imageAlt} width={520} height={360} quality={75} sizes="(max-width: 900px) 100vw, 22vw" />
                <div>
                  <span>{item.type}</span>
                  <strong>{item.title}</strong>
                  <small>{item.deliveredImprovements.join(" / ")}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="approved-closing" aria-labelledby="closing-title">
        <div className="approved-container approved-closing-inner" data-home-reveal>
          <div>
            <p className="approved-kicker">Start your next chapter</p>
            <h2 id="closing-title">Ready to build a website that earns trust and creates momentum?</h2>
          </div>
          <div>
            <p>
              Tell Web Growth what you are building, what is not working, and what the site needs to help your business
              do next.
            </p>
            <Link className="approved-button approved-button-primary" href="/contact/">
              Work With Us <Arrow />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
