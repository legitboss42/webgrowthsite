import Image from "next/image";
import Link from "next/link";
import { portfolioCases } from "@/lib/portfolioCases";
import type { Post } from "@/lib/posts";
import { getPublicPosts } from "@/lib/posts";

export type Service = {
  title: string;
  short: string;
  slug: string;
  serviceParam: string;
  bullets: string[];
  image: string;
};

type Props = {
  services?: Service[];
};

const preferredCoreSlugs = [
  "business-website-design",
  "landing-page-design",
  "website-redesign",
  "ecommerce-website-design",
  "business-automation",
  "search-engine-optimisation",
  "performance-optimisation",
  "website-maintenance",
  "website-audit",
];

const infrastructureSlugs = [
  "analytics-tracking-setup",
  "booking-platform-setup-integration",
  "crm-system-setup-configuration",
  "google-my-business-setup-optimisation",
  "email-marketing-setup-strategy",
  "marketing-automation-build-implementation",
  "domain-registration-hosting-guidance",
  "lead-magnet-strategy-build",
];

const processSteps = [
  ["01", "Diagnose", "Clarify the real bottleneck before design, SEO, or automation work starts."],
  ["02", "Architect", "Map the offer, content, user journey, trust sequence, and implementation path."],
  ["03", "Build", "Design and implement a premium website system with conversion and SEO foundations."],
  ["04", "Improve", "Use performance, tracking, content, and automation to keep the system moving."],
] as const;

const faqItems = [
  {
    question: "Can Web Growth handle only one service?",
    answer:
      "Yes. You can request a focused service such as website redesign, SEO setup, analytics tracking, or performance optimisation.",
  },
  {
    question: "Can services be combined?",
    answer:
      "Yes. Many projects combine strategy, design, SEO foundations, tracking, and post-launch optimisation when that is the right scope.",
  },
  {
    question: "Do these services include fabricated results or guarantees?",
    answer:
      "No. Web Growth presents honest outcomes and does not promise traffic, revenue, rankings, or AdSense approval that cannot be verified.",
  },
  {
    question: "What is the best first step?",
    answer:
      "If the problem is unclear, start with a website audit or consultation. If the problem is obvious, choose the relevant service page and request that scope.",
  },
] as const;

function Arrow() {
  return <span aria-hidden="true">-&gt;</span>;
}

function normalizeSlug(href: string) {
  return href.replace(/^\/services\//, "").replace(/\/$/, "");
}

function normalizeHref(href: string) {
  return href.endsWith("/") ? href : `${href}/`;
}

function selectBySlug(services: Service[], slugs: string[]) {
  const serviceMap = new Map(services.map((service) => [normalizeSlug(service.slug), service]));
  return slugs.map((slug) => serviceMap.get(slug)).filter((service): service is Service => Boolean(service));
}

function selectResources(): Post[] {
  const posts = getPublicPosts();
  const desired = [
    "how-to-build-a-small-business-website-that-converts",
    "small-business-website-redesign-checklist",
    "conversion-audit-checklist-service-homepage",
    "how-to-make-your-website-load-fast",
  ];

  const postMap = new Map(posts.map((post) => [post.slug, post]));
  const selected = desired.map((slug) => postMap.get(slug)).filter((post): post is Post => Boolean(post));
  return selected.length ? selected : posts.slice(0, 4);
}

function ServicePanel({ service, index }: { service: Service; index: number }) {
  return (
    <Link href={normalizeHref(service.slug)} className={`services-premium-card services-premium-card-${(index % 4) + 1}`}>
      <span>{String(index + 1).padStart(2, "0")}</span>
      <h3>{service.title}</h3>
      <p>{service.short}</p>
      <ul>
        {service.bullets.slice(0, 3).map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <small>
        Explore service <Arrow />
      </small>
    </Link>
  );
}

export default function ServicesClient({ services = [] }: Props) {
  const coreServices = selectBySlug(services, preferredCoreSlugs);
  const infrastructureServices = selectBySlug(services, infrastructureSlugs);
  const featuredService = coreServices[0] ?? services[0];
  const featuredCase = portfolioCases.find((item) => item.slug === "jluxe") ?? portfolioCases[0];
  const resources = selectResources();

  return (
    <div className="services-system">
      <section className="services-hero" aria-labelledby="services-title">
        <div className="services-container services-hero-grid">
          <div>
            <p className="services-kicker">Premium web design services</p>
            <h1 id="services-title">Website services for businesses ready to build, grow, and scale.</h1>
            <p>
              Web Growth combines design, SEO foundations, conversion strategy, analytics, automation, and support into
              a practical service system for business websites.
            </p>
            <div className="services-actions">
              <Link href="/contact/" className="services-button services-button-primary">
                Request a Website Review <Arrow />
              </Link>
              <Link href="/portfolio/" className="services-button services-button-secondary">
                View Case Studies
              </Link>
            </div>
          </div>
          {featuredService ? (
            <div className="services-hero-feature">
              <Image
                src={featuredService.image}
                alt={`${featuredService.title} service visual`}
                width={1100}
                height={820}
                quality={75}
                priority
              />
              <div>
                <span>Featured service</span>
                <strong>{featuredService.title}</strong>
                <small>{featuredService.bullets.slice(0, 3).join(" / ")}</small>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="services-direct-answer" aria-labelledby="services-answer-title">
        <div className="services-container services-answer-grid">
          <article>
            <p className="services-kicker">Direct answer</p>
            <h2 id="services-answer-title">What do Web Growth services actually help with?</h2>
          </article>
          <div>
            <p>
              Web Growth services help businesses create stronger websites, improve search visibility, fix conversion
              blockers, measure what matters, and install the technical systems needed to grow online.
            </p>
            <div className="services-answer-points">
              <span>Credibility</span>
              <span>Traffic</span>
              <span>Conversion</span>
              <span>Revenue systems</span>
            </div>
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="core-services-title">
        <div className="services-container services-section-heading">
          <div>
            <p className="services-kicker">Core website services</p>
            <h2 id="core-services-title">The core services that shape first impressions and keep your business moving.</h2>
          </div>
          <Link href="/contact/" className="services-text-link">
            Discuss your project <Arrow />
          </Link>
        </div>
        <div className="services-container services-core-layout">
          {coreServices.map((service, index) => (
            <ServicePanel service={service} index={index} key={service.slug} />
          ))}
        </div>
      </section>

      <section className="services-dark-band" aria-labelledby="infrastructure-title">
        <div className="services-container services-infrastructure-grid">
          <div>
            <p className="services-kicker">Growth infrastructure</p>
            <h2 id="infrastructure-title">The systems behind a website that keeps improving.</h2>
            <p>
              These services support lead capture, measurement, booking, follow-up, and launch readiness after the main
              website structure is in place.
            </p>
          </div>
          <div className="services-infrastructure-list">
            {infrastructureServices.map((service) => (
              <Link href={normalizeHref(service.slug)} key={service.slug}>
                <span>{service.title}</span>
                <small>{service.short}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section services-process" aria-labelledby="service-process-title">
        <div className="services-container services-section-heading">
          <div>
            <p className="services-kicker">Process</p>
            <h2 id="service-process-title">A premium service system, not disconnected tasks.</h2>
          </div>
        </div>
        <div className="services-container services-process-grid">
          {processSteps.map(([number, title, text]) => (
            <article key={title}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="services-proof" aria-labelledby="services-proof-title">
        <div className="services-container services-proof-grid">
          <div>
            <p className="services-kicker">Proof from real implementation</p>
            <h2 id="services-proof-title">Services are tied to real project constraints.</h2>
            <p>{featuredCase.summary}</p>
            <Link href="/portfolio/" className="services-button services-button-secondary">
              View Case Studies <Arrow />
            </Link>
          </div>
          <Image
            src={featuredCase.imageUrl}
            alt={featuredCase.imageAlt}
            width={1500}
            height={1000}
            quality={75}
            sizes="(max-width: 900px) 100vw, 54vw"
          />
        </div>
      </section>

      <section className="services-section" aria-labelledby="services-academy-title">
        <div className="services-container services-section-heading">
          <div>
            <p className="services-kicker">Academy resources</p>
            <h2 id="services-academy-title">Learn before you invest in implementation.</h2>
          </div>
          <Link href="/blog/" className="services-text-link">
            Explore Academy <Arrow />
          </Link>
        </div>
        <div className="services-container services-resource-grid">
          {resources.map((post) => (
            <Link href={`/blog/${post.slug}/`} key={post.slug}>
              <span>{String(post.category)}</span>
              <strong>{post.title}</strong>
              <small>{post.excerpt}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="services-section services-faq" aria-labelledby="services-faq-title">
        <div className="services-container services-section-heading">
          <div>
            <p className="services-kicker">Common questions</p>
            <h2 id="services-faq-title">Clear answers before you choose a service.</h2>
          </div>
        </div>
        <div className="services-container services-faq-grid">
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="services-final-cta">
        <div className="services-container services-final-inner">
          <div>
            <p className="services-kicker">Next step</p>
            <h2>Need the right service path for your website?</h2>
          </div>
          <div>
            <p>Tell Web Growth what is not working and what the website needs to help the business do next.</p>
            <Link href="/contact/" className="services-button services-button-primary">
              Start Your Website Review <Arrow />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
