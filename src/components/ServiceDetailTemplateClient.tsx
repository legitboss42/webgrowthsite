import Link from "next/link";
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

      <SectionShell tone="canvas" spacing="hero" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
          <div className="absolute left-[-10%] top-[-6%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.12),transparent_70%)]" />
          <div className="absolute right-[-8%] top-[4%] h-[25rem] w-[25rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.12),transparent_70%)]" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-blue-100 bg-white/92 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700 shadow-sm">
              {service.title}
            </p>
            <h1 className="mt-5 max-w-[34rem] text-balance text-[3.8rem] font-semibold leading-[0.9] tracking-[-0.07em] text-slate-950 md:text-[5rem]">
              {service.heroTitle}
            </h1>
            <p className="mt-4 max-w-[33rem] text-lg leading-8 text-slate-600">
              {service.heroDescription}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {service.highlights.map((item, index) => (
                <span
                  key={item}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    index === 0
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600",
                  ].join(" ")}
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/contact?service=${encodeURIComponent(service.serviceParam)}`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3557ff_0%,#4f6bff_45%,#7c5cff_100%)] px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,107,255,0.28)] transition hover:brightness-105"
              >
                Request This Service
              </Link>
              <Link
                href="/services/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-white px-6 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50"
              >
                View All Services
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Who this is for
              </p>
              <ul className="mt-5 space-y-3">
                {service.targetAudience.slice(0, 4).map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                    <span className="mt-[9px] h-2 w-2 rounded-full bg-blue-500/80" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Included
              </p>
              <ul className="mt-5 space-y-3">
                {service.deliverables.slice(0, 4).map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                    <span className="mt-[9px] h-2 w-2 rounded-full bg-blue-500/80" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </SectionShell>

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
              {service.relatedGuideSlugs.slice(0, 4).map((slug) => (
                <Link
                  key={slug}
                  href={`/blog/${slug}/`}
                  className="flex items-center gap-3 rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                >
                  <IconBadge tone="purple" className="h-9 w-9 rounded-[0.9rem]">
                    <SearchIcon />
                  </IconBadge>
                  <span>{slug.replace(/-/g, " ")}</span>
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
              <Link
                href={`/contact?service=${encodeURIComponent(service.serviceParam)}`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                Request a Website Review
              </Link>
              <Link
                href="/portfolio/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-transparent px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View Case Studies
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}
