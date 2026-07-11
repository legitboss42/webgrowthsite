import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import CinematicHero from "@/components/platform/CinematicHero";
import StructuredData from "@/components/StructuredData";
import BeforeAfterResults from "@/components/content/BeforeAfterResults";
import CommonMistakes from "@/components/content/CommonMistakes";
import EvidenceGallery from "@/components/content/EvidenceGallery";
import FAQBlock from "@/components/content/FAQBlock";
import InternalResourceCallout from "@/components/content/InternalResourceCallout";
import ProcessSteps from "@/components/content/ProcessSteps";
import RealExamples from "@/components/content/RealExamples";
import ServiceDeliverables from "@/components/content/ServiceDeliverables";
import WhoThisIsFor from "@/components/content/WhoThisIsFor";
import WhoThisIsNotFor from "@/components/content/WhoThisIsNotFor";
import {
  BuildIcon,
  ConvertIcon,
  GrowthChartIcon,
  IconBadge,
  MonetizeIcon,
  OptimizeIcon,
  PlanIcon,
  SearchIcon,
} from "@/components/home/HomeIcons";
import SectionShell from "@/components/home/SectionShell";
import { getPost } from "@/lib/posts";
import { buildBreadcrumbSchema } from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import type { ServicePageConfig } from "@/lib/newServiceConfigs";

type Props = {
  service: ServicePageConfig;
};

const processIcons = [<PlanIcon key="1" />, <BuildIcon key="2" />, <OptimizeIcon key="3" />, <ConvertIcon key="4" />];

export default function ServiceDetailTemplateClient({ service }: Props) {
  const servicePath = `/services/${service.slug}`;
  const serviceUrl = absoluteUrl(servicePath);
  const relatedGuides = service.relatedGuideSlugs
    .slice(0, 4)
    .map((slug) => ({
      slug,
      post: getPost(slug),
    }));
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

  const supportLinks =
    service.relatedLinks ?? [
      {
        href: "/services/website-audit/",
        label: "Audit",
        title: "Start with diagnosis",
        description:
          "Use a website review when the bottleneck is still unclear and you need the right implementation path first.",
      },
      {
        href: "/pricing/",
        label: "Pricing",
        title: "Review scope and budget",
        description:
          "See how Web Growth frames scope, pricing context, and the right next step before kickoff.",
      },
      {
        href: "/blog/",
        label: "Academy",
        title: "Learn before you buy",
        description:
          "Use Academy resources to understand the build, growth, and monetization decisions around this service.",
      },
    ];

  return (
    <main className="bg-[#f7f8fc] text-slate-950">
      <StructuredData data={schema} />

      <CinematicHero
        eyebrow={service.title}
        title={service.heroTitle}
        description={service.heroDescription}
        pageType="service_detail"
        variant="split"
        primaryAction={{
          label: "Request This Service",
          href: `/contact?service=${encodeURIComponent(service.serviceParam)}`,
          ctaName: "request_this_service",
          destination: "contact",
        }}
        secondaryAction={{
          label: "View All Services",
          href: "/services/",
          ctaName: "view_all_services",
          destination: "services",
        }}
        aside={
          <div className="border-l border-border-hairline pl-6 md:pl-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-teal">Engagement dossier</p>
            <ol className="mt-6 space-y-5">
              {service.deliverables.slice(0, 4).map((item, index) => (
                <li key={item} className="grid grid-cols-[2rem_1fr] gap-4 border-b border-border-hairline pb-5 text-sm leading-6 text-text-muted">
                  <span className="font-display text-xl text-accent-gold">0{index + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        }
        footer={
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border-hairline bg-border-hairline sm:grid-cols-3">
            {service.highlights.slice(0, 3).map((item) => (
              <div key={item} className="bg-bg-ink px-5 py-4 text-sm text-text-muted">{item}</div>
            ))}
          </div>
        }
      />

      <SectionShell tone="white" spacing="compact">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-6">
            <WhoThisIsFor items={service.targetAudience} />
            <WhoThisIsNotFor items={service.notFor} />
          </div>
          <ServiceDeliverables items={service.deliverables} />
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <article className="rounded-[1.55rem] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Process
            </p>
            <div className="mt-5 space-y-4">
              {service.process.map((step, index) => (
                <div key={step.title} className="flex items-start gap-4 rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-4">
                  <IconBadge tone="blue" className="h-10 w-10 rounded-[1rem] shrink-0">
                    {processIcons[index] ?? <GrowthChartIcon />}
                  </IconBadge>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-6">
            <CommonMistakes items={service.commonMistakes} />
            <RealExamples items={service.useCases} />
          </div>
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_22px_54px_rgba(15,23,42,0.06)]">
          <div className="grid gap-6 px-6 py-7 md:px-8 md:py-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Transformation
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                What changes when this work is implemented well
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                These before-and-after patterns show the kind of commercial lift the
                service is meant to create.
              </p>
            </div>
            <EvidenceGallery items={service.evidence} />
          </div>
          <div className="border-t border-slate-200 px-6 py-7 md:px-8">
            <BeforeAfterResults items={service.beforeAfter} />
          </div>
        </div>
      </SectionShell>

      <SectionShell tone="white" spacing="compact">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <FAQBlock
            items={service.faqs}
            title={`${service.title} FAQs`}
            description="Direct answers to common planning, scope, and implementation questions."
          />
          <article className="rounded-[1.55rem] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Related Academy guides
            </p>
            <div className="mt-5 space-y-3">
              {relatedGuides.map(({ slug, post }) => (
                <Link
                  key={slug}
                  href={`/blog/${slug}/`}
                  className="flex items-center gap-3 rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                >
                  <IconBadge tone="purple" className="h-9 w-9 rounded-[0.9rem]">
                    <SearchIcon />
                  </IconBadge>
                  <span>{post?.title ?? slug.replace(/-/g, " ")}</span>
                </Link>
              ))}
            </div>
            <InternalResourceCallout
              title="Browse the Academy"
              description="Use Academy resources to understand this work before you invest in implementation."
              href="/blog/"
              label="Explore Academy"
            />
          </article>
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="grid gap-4 lg:grid-cols-3">
          {supportLinks.map((item) => (
            <article
              key={item.href}
              className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                {item.label}
              </p>
              <h3 className="mt-3 text-[1.25rem] font-semibold tracking-[-0.03em] text-slate-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              <Link href={item.href} className="mt-5 inline-flex text-sm font-semibold text-blue-700">
                Open page -&gt;
              </Link>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="overflow-hidden rounded-[1.8rem] border border-blue-950/60 bg-[radial-gradient(circle_at_88%_14%,rgba(108,84,255,0.42),transparent_24%),linear-gradient(135deg,#091226_0%,#0c1631_48%,#0b1230_100%)] px-8 py-9 shadow-[0_26px_70px_rgba(6,14,35,0.28)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="max-w-2xl text-[2.2rem] font-semibold tracking-[-0.05em] text-white">
                {service.ctaTitle}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-8 text-blue-100">
                {service.ctaDescription}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <TrackedLink
                href={`/contact?service=${encodeURIComponent(service.serviceParam)}`}
                ctaName="request_website_review"
                ctaLocation="service_final_cta"
                destination="contact"
                pageType="service_detail"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                Request a Website Review
              </TrackedLink>
              <TrackedLink
                href="/portfolio/"
                ctaName="view_case_studies"
                ctaLocation="service_final_cta"
                destination="portfolio"
                pageType="service_detail"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-transparent px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View Case Studies
              </TrackedLink>
            </div>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}
