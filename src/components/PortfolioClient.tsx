import Image from "next/image";
import Link from "next/link";
import { portfolioCases } from "@/lib/portfolioCases";
import { getPost, getPublicPosts } from "@/lib/posts";
import type { Post } from "@/lib/posts";

const processSteps = [
  ["01", "Context", "Understand the business, offer, audience, and trust gaps before shaping the page."],
  ["02", "Structure", "Organise services, products, proof, and calls to action around buyer decisions."],
  ["03", "Presentation", "Use responsive visuals, hierarchy, and premium spacing to make the brand easier to trust."],
  ["04", "Growth path", "Connect the project to SEO, conversion, booking, ordering, or lead-generation priorities."],
] as const;

const relatedServices = [
  { href: "/services/business-website-design/", label: "Business Website Design" },
  { href: "/services/website-redesign/", label: "Website Redesign" },
  { href: "/services/ecommerce-website-design/", label: "eCommerce Website Design" },
  { href: "/services/landing-page-design/", label: "Landing Page Design" },
  { href: "/services/search-engine-optimisation/", label: "SEO Setup" },
  { href: "/services/performance-optimisation/", label: "Performance Optimisation" },
] as const;

const academySlugs = [
  "jluxe-medical-aesthetics-case-study",
  "how-to-build-a-small-business-website-that-converts",
  "small-business-website-redesign-checklist",
  "conversion-audit-checklist-service-homepage",
] as const;

function Arrow() {
  return <span aria-hidden="true">-&gt;</span>;
}

function getRelatedReads() {
  const publicPosts = getPublicPosts();
  const postMap = new Map(publicPosts.map((post) => [post.slug, post]));
  const selected = academySlugs
    .map((slug) => postMap.get(slug) ?? getPost(slug))
    .filter((post): post is Post => Boolean(post));
  return selected.length ? selected : publicPosts.slice(0, 4);
}

export default function PortfolioClient() {
  const featuredCase = portfolioCases.find((item) => item.slug === "jluxe") ?? portfolioCases[0];
  const supportingCases = portfolioCases.filter((item) => item.slug !== featuredCase?.slug);
  const relatedReads = getRelatedReads();

  if (!featuredCase) return null;

  return (
    <main className="portfolio-system">
      <section className="portfolio-hero" aria-labelledby="portfolio-title">
        <div className="portfolio-container portfolio-hero-grid">
          <div>
            <p className="portfolio-kicker">Case studies and selected work</p>
            <h1 id="portfolio-title">Premium websites built around trust, clarity, and action.</h1>
            <p>
              Explore real Web Growth projects and the thinking behind them. Each example is presented with honest
              qualitative outcomes, not fabricated performance claims.
            </p>
            <div className="portfolio-actions">
              <Link href="/contact/" className="portfolio-button portfolio-button-primary">
                Discuss Your Website <Arrow />
              </Link>
              <Link href="/services/" className="portfolio-button portfolio-button-secondary">
                Explore Services
              </Link>
            </div>
          </div>
          <p className="portfolio-note">Portfolio outcomes describe delivered design and implementation improvements. Unless a case study names a baseline, date range, and measurement source, they are not claims of measured traffic, ranking, revenue, or conversion gains.</p>
          <div className="portfolio-hero-image">
            <Image
              src={featuredCase.imageUrl}
              alt={featuredCase.imageAlt}
              width={1600}
              height={1200}
              quality={75}
              priority
              sizes="(max-width: 900px) 100vw, 54vw"
            />
            <div>
              <span>Featured case study</span>
              <strong>{featuredCase.title}</strong>
              <small>{featuredCase.whatToNotice}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="portfolio-featured" aria-labelledby="featured-title">
        <div className="portfolio-container portfolio-featured-grid">
          <div>
            <p className="portfolio-kicker">Featured project</p>
            <h2 id="featured-title">{featuredCase.title}</h2>
            <p>{featuredCase.summary}</p>
            <div className="portfolio-meta-row">
              <span>{featuredCase.type}</span>
              <span>{featuredCase.industry}</span>
              <span>{featuredCase.status ?? "Selected work"}</span>
            </div>
            <div className="portfolio-actions">
              <Link href="/blog/jluxe-medical-aesthetics-case-study/" className="portfolio-button portfolio-button-primary">
                Read Case Study <Arrow />
              </Link>
              <Link href={featuredCase.liveUrl} className="portfolio-button portfolio-button-secondary" target="_blank" rel="noreferrer">
                Visit Live Site
              </Link>
            </div>
          </div>
          <div className="portfolio-featured-proof">
            <article>
              <span>Challenge</span>
              <p>{featuredCase.purpose}</p>
            </article>
            <article>
              <span>Strategy</span>
              <ul>
                {featuredCase.stack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article>
              <span>Qualitative outcomes</span>
              <ul>
                {featuredCase.deliveredImprovements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="portfolio-section" aria-labelledby="gallery-title">
        <div className="portfolio-container portfolio-section-heading">
          <div>
            <p className="portfolio-kicker">Project gallery</p>
            <h2 id="gallery-title">Selected website work across service, product, and conversion contexts.</h2>
          </div>
          <Link href="/contact/" className="portfolio-text-link">
            Request a review <Arrow />
          </Link>
        </div>
        <div className="portfolio-container portfolio-gallery">
          {portfolioCases.map((item, index) => (
            <article className={`portfolio-card portfolio-card-${(index % 3) + 1}`} key={item.slug}>
              <div className="portfolio-card-image">
                <Image
                  src={item.imageUrl}
                  alt={item.imageAlt}
                  width={1200}
                  height={860}
                  quality={75}
                  sizes="(max-width: 900px) 100vw, 33vw"
                />
              </div>
              <div className="portfolio-card-body">
                <div className="portfolio-card-labels">
                  <span>{item.type}</span>
                  <span>{item.status ?? "Selected"}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <ul>
                  {item.deliveredImprovements.map((result) => (
                    <li key={result}>{result}</li>
                  ))}
                </ul>
                <div className="portfolio-card-actions">
                  {item.slug === "jluxe" ? (
                    <Link href="/blog/jluxe-medical-aesthetics-case-study/">Read case study <Arrow /></Link>
                  ) : null}
                  <Link href={item.liveUrl} target="_blank" rel="noreferrer">
                    View live site <Arrow />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="portfolio-dark" aria-labelledby="process-title">
        <div className="portfolio-container portfolio-process-grid">
          <div>
            <p className="portfolio-kicker">How the work is shaped</p>
            <h2 id="process-title">Case studies are about decisions, not decoration.</h2>
            <p>
              The portfolio highlights how Web Growth connects business context, site structure, responsive presentation,
              and conversion paths.
            </p>
          </div>
          <div className="portfolio-process-list">
            {processSteps.map(([number, title, text]) => (
              <article key={title}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-section" aria-labelledby="related-title">
        <div className="portfolio-container portfolio-related-grid">
          <article>
            <p className="portfolio-kicker">Related services</p>
            <h2 id="related-title">Services behind this type of work.</h2>
            <div className="portfolio-link-grid">
              {relatedServices.map((item) => (
                <Link href={item.href} key={item.href}>
                  <span>Service</span>
                  <strong>{item.label}</strong>
                </Link>
              ))}
            </div>
          </article>
          <article>
            <p className="portfolio-kicker">Related Academy reads</p>
            <h2>Learn the strategy behind better websites.</h2>
            <div className="portfolio-link-grid">
              {relatedReads.map((post) => (
                <Link href={`/blog/${post.slug}/`} key={post.slug}>
                  <span>{String(post.category)}</span>
                  <strong>{post.title}</strong>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="portfolio-final-cta">
        <div className="portfolio-container portfolio-final-inner">
          <div>
            <p className="portfolio-kicker">Next step</p>
            <h2>Want your website to feel this credible?</h2>
          </div>
          <div>
            <p>Send Web Growth your current website or project idea and get a practical recommendation on what to fix, build, or redesign first.</p>
            <Link href="/contact/" className="portfolio-button portfolio-button-primary">
              Start With a Website Review <Arrow />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
