import Image from "next/image";
import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import StructuredData from "@/components/StructuredData";
import { portfolioCases } from "@/lib/portfolioCases";
import { getPost } from "@/lib/posts";
import { buildBreadcrumbSchema } from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import type { ServicePageConfig } from "@/lib/newServiceConfigs";

type Props = {
  service: ServicePageConfig;
};

function Arrow() {
  return <span aria-hidden="true">-&gt;</span>;
}

function serviceTone(service: ServicePageConfig) {
  const title = service.title.toLowerCase();
  if (title.includes("seo") || title.includes("analytics")) return "Measurement";
  if (title.includes("landing") || title.includes("lead")) return "Conversion";
  if (title.includes("maintenance") || title.includes("hosting")) return "Support";
  if (title.includes("automation") || title.includes("crm") || title.includes("email")) return "Systems";
  return "Website design";
}

function relatedGuides(service: ServicePageConfig) {
  return service.relatedGuideSlugs
    .slice(0, 4)
    .map((slug) => ({ slug, post: getPost(slug) }));
}

function supportLinks(service: ServicePageConfig) {
  return (
    service.relatedLinks ?? [
      {
        href: "/services/website-audit/",
        label: "Audit",
        title: "Start with diagnosis",
        description: "Use a website review when the bottleneck is unclear and the right implementation path matters.",
      },
      {
        href: "/services/",
        label: "Services",
        title: "Compare service paths",
        description: "Review the wider Web Growth service system before choosing the correct scope.",
      },
      {
        href: "/blog/",
        label: "Academy",
        title: "Learn before you buy",
        description: "Use Academy resources to understand the build, growth, and monetization decisions around this work.",
      },
    ]
  );
}

export default function ServiceDetailTemplateClient({ service }: Props) {
  const servicePath = `/services/${service.slug}/`;
  const serviceUrl = absoluteUrl(servicePath);
  const featuredCase = portfolioCases[0];
  const guides = relatedGuides(service);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${serviceUrl}#service`,
      name: service.title,
      description: service.metaDescription,
      url: serviceUrl,
      serviceType: service.title,
      provider: {
        "@id": `${SITE_URL}#professional-service`,
      },
      category: service.title,
    },
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services/" },
      { name: service.title, path: servicePath },
    ]),
  ];

  return (
    <div className="service-detail-system">
      <StructuredData data={schema} />

      <section className="service-detail-hero" aria-labelledby="service-detail-title">
        <div className="services-container service-detail-hero-grid">
          <div>
            <Link href="/services/" className="service-breadcrumb">
              Services <Arrow />
            </Link>
            <p className="services-kicker">{serviceTone(service)}</p>
            <h1 id="service-detail-title">{service.heroTitle}</h1>
            <p>{service.heroDescription}</p>
            <div className="services-actions">
              <TrackedLink
                href={`/contact?service=${encodeURIComponent(service.serviceParam)}`}
                ctaName="request_service"
                ctaLocation="service_hero"
                destination="contact"
                pageType="service_detail"
                className="services-button services-button-primary"
              >
                Request This Service <Arrow />
              </TrackedLink>
              <TrackedLink
                href="/services/"
                ctaName="view_all_services"
                ctaLocation="service_hero"
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
              alt={`${service.title} service presentation`}
              width={1300}
              height={960}
              quality={75}
              priority
            />
            <div>
              <span>Engagement focus</span>
              <strong>{service.title}</strong>
              <small>{service.highlights.slice(0, 3).join(" / ")}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="service-detail-answer" aria-labelledby="service-answer-title">
        <div className="services-container service-detail-answer-grid">
          <article>
            <p className="services-kicker">Business problem</p>
            <h2 id="service-answer-title">What this service is designed to fix.</h2>
            <p>{service.metaDescription}</p>
          </article>
          <article>
            <p className="services-kicker">Service outcome</p>
            <h2>What changes when the work is done well.</h2>
            <div className="service-highlight-list">
              {service.highlights.slice(0, 3).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="services-section" aria-labelledby="deliverables-title">
        <div className="services-container service-detail-split">
          <div>
            <p className="services-kicker">Deliverables</p>
            <h2 id="deliverables-title">The practical work included in this service.</h2>
            <p>
              Each deliverable is tied to clarity, trust, technical quality, conversion, or maintainability rather than
              decorative website work.
            </p>
          </div>
          <div className="service-deliverable-grid">
            {service.deliverables.map((item, index) => (
              <article key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="service-detail-dark" aria-labelledby="service-process-title">
        <div className="services-container service-process-grid">
          <div>
            <p className="services-kicker">Process</p>
            <h2 id="service-process-title">How this service moves from diagnosis to implementation.</h2>
            <p>
              The process keeps the work commercially focused while protecting content quality, SEO foundations, and
              responsive usability.
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

      <section className="services-section" aria-labelledby="fit-title">
        <div className="services-container service-fit-grid">
          <article>
            <p className="services-kicker">Good fit</p>
            <h2 id="fit-title">Who this is for.</h2>
            <ul>
              {service.targetAudience.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <p className="services-kicker">Not a fit</p>
            <h2>Who this is not for.</h2>
            <ul>
              {service.notFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="service-detail-proof" aria-labelledby="proof-title">
        <div className="services-container service-proof-grid">
          <div>
            <p className="services-kicker">Visual proof area</p>
            <h2 id="proof-title">Premium presentation with practical constraints.</h2>
            <p>
              Service pages use real project framing and honest qualitative outcomes. No invented performance statistics
              are added.
            </p>
            <Link href="/portfolio/" className="services-button services-button-secondary">
              View Case Studies <Arrow />
            </Link>
          </div>
          <div className="service-image-stack">
            <Image
              src={service.detailImage}
              alt={`${service.title} detail visual`}
              width={1100}
              height={820}
              quality={75}
              sizes="(max-width: 900px) 100vw, 48vw"
            />
            {featuredCase ? (
              <div>
                <span>{featuredCase.type}</span>
                <strong>{featuredCase.title}</strong>
                <small>{featuredCase.deliveredImprovements.join(" / ")}</small>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="transformation-title">
        <div className="services-container service-transformation-grid">
          <div>
            <p className="services-kicker">Transformation</p>
            <h2 id="transformation-title">Before and after patterns this service addresses.</h2>
          </div>
          <div className="service-before-after">
            {service.beforeAfter.map((item) => (
              <article key={`${item.before}-${item.after}`}>
                <div>
                  <span>Before</span>
                  <p>{item.before}</p>
                </div>
                <div>
                  <span>After</span>
                  <p>{item.after}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="mistakes-title">
        <div className="services-container service-mistakes-grid">
          <article>
            <p className="services-kicker">Common mistakes</p>
            <h2 id="mistakes-title">What this service helps you avoid.</h2>
            <ul>
              {service.commonMistakes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <p className="services-kicker">Realistic examples</p>
            <h2>How the work can show up in practice.</h2>
            <ul>
              {service.useCases.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="services-section" aria-labelledby="service-faq-title">
        <div className="services-container service-faq-related-grid">
          <article>
            <p className="services-kicker">FAQs</p>
            <h2 id="service-faq-title">{service.title} FAQs</h2>
            <div className="services-faq-grid">
              {service.faqs.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </article>
          <aside>
            <p className="services-kicker">Related links</p>
            <div className="service-related-list">
              {guides.map(({ slug, post }) => (
                <Link href={`/blog/${slug}/`} key={slug}>
                  <span>Academy</span>
                  <strong>{post?.title ?? slug.replace(/-/g, " ")}</strong>
                </Link>
              ))}
              {supportLinks(service).map((item) => (
                <Link href={item.href} key={item.href}>
                  <span>{item.label}</span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="services-final-cta">
        <div className="services-container services-final-inner">
          <div>
            <p className="services-kicker">Next step</p>
            <h2>{service.ctaTitle}</h2>
          </div>
          <div>
            <p>{service.ctaDescription}</p>
            <TrackedLink
              href={`/contact?service=${encodeURIComponent(service.serviceParam)}`}
              ctaName="request_service_final"
              ctaLocation="service_final_cta"
              destination="contact"
              pageType="service_detail"
              className="services-button services-button-primary"
            >
              Request a Website Review <Arrow />
            </TrackedLink>
          </div>
        </div>
      </section>
    </div>
  );
}
