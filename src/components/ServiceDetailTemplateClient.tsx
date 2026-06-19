import Link from "next/link";
import StructuredData from "@/components/StructuredData";

import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import CorePageLinks from "@/components/CorePageLinks";
import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import GeneratedSectionBackground from "@/components/GeneratedSectionBackground";
import ServiceDeliverables from "@/components/content/ServiceDeliverables";
import WhoThisIsFor from "@/components/content/WhoThisIsFor";
import WhoThisIsNotFor from "@/components/content/WhoThisIsNotFor";
import CommonMistakes from "@/components/content/CommonMistakes";
import RealExamples from "@/components/content/RealExamples";
import BeforeAfterResults from "@/components/content/BeforeAfterResults";
import ProcessSteps from "@/components/content/ProcessSteps";
import FAQBlock from "@/components/content/FAQBlock";
import EvidenceGallery from "@/components/content/EvidenceGallery";
import InternalResourceCallout from "@/components/content/InternalResourceCallout";
import type { ServicePageConfig } from "@/lib/newServiceConfigs";
import { buildBreadcrumbSchema } from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/site";

type Props = {
  service: ServicePageConfig;
};

export default function ServiceDetailTemplateClient({ service }: Props) {
  const servicePath = `/services/${service.slug}`;
  const serviceUrl = absoluteUrl(servicePath);
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
      { name: "Services", path: "/services" },
      { name: service.title, path: servicePath },
    ]),
  ];

  const answerItems = service.faqs.slice(0, 4).map((item) => ({
    title: item.question,
    answer: item.answer,
    href: `/contact?service=${encodeURIComponent(service.serviceParam)}`,
    hrefLabel: "Request this service",
  }));

  const relatedGuides = service.relatedGuideSlugs.slice(0, 4).map((slug) => ({
    href: `/blog/${slug}`,
    title: slug.replace(/-/g, " "),
  }));

  const supportLinks =
    service.relatedLinks ?? [
      {
        href: "/services/website-audit",
        label: "Audit",
        title: "Need diagnosis before implementation?",
        description:
          "Start with a website audit if the bottleneck is not fully clear yet.",
      },
      {
        href: "/launch",
        label: "Launch",
        title: "Need a faster commercial launch path?",
        description:
          "Use the launch package if speed to market matters more than full custom scope right now.",
      },
      {
        href: "/pricing",
        label: "Pricing",
        title: "Need scope and budget context first?",
        description:
          "Review package pricing to compare implementation routes before kickoff.",
      },
    ];

  const whoFor = service.targetAudience;

  const whoNotFor = service.notFor;

  const mistakes = service.commonMistakes;

  const examples = service.useCases;
  const beforeAfter = service.beforeAfter;
  const evidence = service.evidence;

  return (
    <div className="bg-black text-white">
      <StructuredData data={schema} />

      <section className="relative overflow-hidden py-24">
        <GeneratedSectionBackground variant="service" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm uppercase tracking-[0.25em] text-white/50">{service.title}</div>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">{service.heroTitle}</h1>
              <p className="mt-6 text-lg leading-relaxed text-white/70">{service.heroDescription}</p>

              <div className="mt-10 flex gap-3 flex-col sm:flex-row">
                <Link
                  href={`/contact?service=${encodeURIComponent(service.serviceParam)}`}
                  className="rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white text-center hover:bg-emerald-500 transition"
                >
                  Request a Quote
                </Link>
                <Link
                  href="/services"
                  className="rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-sm font-semibold text-white/90 text-center hover:bg-black/50 transition"
                >
                  View Services
                </Link>
              </div>

              <ul className="mt-8 space-y-2">
                {service.highlights.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-white/70">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div className="h-[360px] bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${service.heroImage})` }} />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          </div>
        </div>
      </section>

      <AnswerHighlightsSection
        eyebrow="Quick answers"
        title={`What people usually want to know about ${service.title.toLowerCase()}`}
        description="Practical answers to help you choose this service only when it clearly matches your business objective."
        items={answerItems}
      />

      <section data-reveal=".fit-reveal" className="fit-reveal relative overflow-hidden border-y border-white/10 bg-[#060907] py-20">
        <GeneratedSectionBackground variant="snapshot" />
        <div className="relative mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Fit Check"
            title="Who this service is for and who it is not for"
            description="Specific fit criteria reduce low-intent enquiries and keep delivery focused on outcomes."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <WhoThisIsFor items={whoFor} />
            <WhoThisIsNotFor items={whoNotFor} />
          </div>
        </div>
      </section>

      <section data-reveal=".deliverables-reveal" className="deliverables-reveal relative overflow-hidden py-20 bg-gray-950">
        <GeneratedSectionBackground variant="service" />
        <div className="relative mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Deliverables"
            title="What is included and what you receive"
            description="A clear scope reduces ambiguity and improves implementation speed."
          />
          <div className="mt-10">
            <ServiceDeliverables items={service.deliverables} />
          </div>
        </div>
      </section>

      <section data-reveal=".builder-reveal" className="builder-reveal relative overflow-hidden border-y border-white/10 bg-[#060907] py-20">
        <GeneratedSectionBackground variant="service" />
        <div className="relative mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Differentiator"
            title="How this differs from a generic page-builder setup"
            description="This service is engineered for commercial outcomes, not just visual delivery."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/35 p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                Generic builder workflow
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-white/72">
                <li>Template-first layout with weak differentiation.</li>
                <li>Plugin and visual bloat that hurts performance.</li>
                <li>Low flexibility when conversion goals evolve.</li>
                <li>Inconsistent implementation quality across pages.</li>
              </ul>
            </article>
            <article className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/90">
                Web Growth implementation
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-white/82">
                <li>Business-first architecture tied to conversion intent.</li>
                <li>Cleaner performance and stronger mobile usability.</li>
                <li>Scalable structure that supports future SEO and growth.</li>
                <li>Senior-led implementation with measurable priorities.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section data-reveal=".process-reveal" className="process-reveal relative overflow-hidden py-20">
        <GeneratedSectionBackground variant="service" />
        <div className="relative mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Process"
            title="How implementation runs in practice"
            description="Execution sequence is designed to protect quality and reduce delays."
          />
          <div className="mt-10">
            <ProcessSteps items={service.process.map((step) => `${step.title}: ${step.text}`)} />
          </div>
        </div>
      </section>

      <section data-reveal=".mistakes-reveal" className="mistakes-reveal relative overflow-hidden border-y border-white/10 bg-[#060907] py-20">
        <GeneratedSectionBackground variant="snapshot" />
        <div className="relative mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Risk Reduction"
            title="Common mistakes businesses make before hiring"
            description="Knowing these mistakes helps you avoid scope waste and delayed outcomes."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <CommonMistakes items={mistakes} />
            <RealExamples items={examples} />
          </div>
        </div>
      </section>

      <section data-reveal=".proof-reveal" className="proof-reveal relative overflow-hidden py-20 bg-gray-950">
        <GeneratedSectionBackground variant="service" />
        <div className="relative mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Evidence"
            title="How the service changes the working state"
            description="These are representative before-and-after patterns, not promises of a specific result."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <BeforeAfterResults items={beforeAfter} />
            <EvidenceGallery items={evidence} />
          </div>
        </div>
      </section>

      <section data-reveal=".faq-reveal" className="faq-reveal relative overflow-hidden py-20">
        <GeneratedSectionBackground variant="faq" />
        <div className="relative mx-auto max-w-6xl px-6">
          <FAQBlock
            items={service.faqs}
            title={`${service.title} FAQs`}
            description="Service-specific questions to help you decide with less uncertainty."
          />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#060907] py-16">
        <div className="mx-auto max-w-6xl px-6">
          {relatedGuides.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {relatedGuides.map((guide) => (
                <InternalResourceCallout
                  key={guide.href}
                  title={guide.title}
                  description="Read the guide before kickoff to improve inputs and speed up implementation."
                  href={guide.href}
                  label="Read Guide"
                />
              ))}
            </div>
          ) : (
            <InternalResourceCallout
              title="Need practical preparation guidance before this service?"
              description="Use the blog resources to understand scope, priorities, and quality standards before implementation starts."
              href="/blog"
              label="Browse Guides"
            />
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12">
            <CorePageLinks
              eyebrow="Useful next steps"
              title="Choose the next page that supports this service"
              description="Use these pages for pricing context, diagnostic support, or a faster launch path."
              links={supportLinks}
            />
          </div>

          <CTASection
            eyebrow="READY"
            title={service.ctaTitle}
            description={service.ctaDescription}
            primaryCtaText="Request a Quote"
            primaryHref={`/contact?service=${encodeURIComponent(service.serviceParam)}`}
            secondaryCtaText="View Portfolio"
            secondaryHref="/portfolio"
            imageUrl={service.detailImage}
          />
        </div>
      </section>
    </div>
  );
}
