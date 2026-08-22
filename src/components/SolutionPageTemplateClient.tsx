import Link from "next/link";
import StructuredData from "@/components/StructuredData";
import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import FAQBlock from "@/components/content/FAQBlock";
import BrowserFrameMockup from "@/components/platform/BrowserFrameMockup";
import PageHero from "@/components/platform/PageHero";
import PageSection from "@/components/platform/PageSection";
import SurfaceCard from "@/components/platform/SurfaceCard";
import { buildBreadcrumbSchema } from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import type { SolutionPageConfig } from "@/lib/solutionPageConfigs";

type Props = {
  page: SolutionPageConfig;
};

export default function SolutionPageTemplateClient({ page }: Props) {
  const pageUrl = absoluteUrl(page.path);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      name: page.title,
      description: page.metaDescription,
      url: pageUrl,
      isPartOf: {
        "@id": `${SITE_URL}#website`,
      },
    },
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: page.title, path: page.path },
    ]),
  ];

  const answerItems = page.problemItems.map((item) => ({
    title: item.title,
    answer: item.answer,
    href: item.href,
    hrefLabel: item.hrefLabel,
  }));

  return (
    <main className="bg-[#eff1ec] text-slate-950">
      <StructuredData data={schema} />

      <PageHero
        eyebrow={page.eyebrow}
        title={page.heroTitle}
        description={page.heroDescription}
        primaryCta={{ label: "Start With a Website Review", href: "/contact/" }}
        secondaryCta={{ label: "View Services", href: "/services/" }}
        chips={page.chips}
        aside={
          <BrowserFrameMockup
            eyebrow="Growth surface"
            title={page.title}
            description={page.metaDescription}
            lines={page.capabilityItems.slice(0, 3).map((item) => item.title)}
            footer="Premium website growth direction"
          />
        }
      />

      <AnswerHighlightsSection
        eyebrow="Why this page exists"
        title={`What usually holds ${page.title.toLowerCase()} back`}
        description="These are the business-level issues Web Growth is trying to solve on this page, before design decisions get reduced to aesthetics alone."
        items={answerItems}
      />

      <PageSection surface="white" spacing="md">
        <SectionHeading
          eyebrow="What the website needs"
          title="The core capabilities this kind of page or platform should create"
          description="The goal is a website surface that helps visitors understand, trust, and act with less friction."
          align="left"
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {page.capabilityItems.map((item) => (
            <SurfaceCard key={item.title} className="h-full">
              <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </SurfaceCard>
          ))}
        </div>
      </PageSection>

      <PageSection surface="default" spacing="md">
        <div className="grid gap-10 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <SectionHeading
              eyebrow="Outcomes"
              title="What changes when the experience is built properly"
              description="The website becomes easier to trust, easier to use, and more useful as a growth asset."
              align="left"
            />
            <div className="mt-8 grid gap-4">
              {page.outcomeItems.map((item) => (
                <SurfaceCard key={item.title} tone="tint">
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </SurfaceCard>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Best fit"
              title="Who this direction is most useful for"
              description="These are the business types most likely to benefit from this page structure and implementation style."
              align="left"
            />
            <div className="mt-8 grid gap-4">
              {page.audienceItems.map((item) => (
                <SurfaceCard key={item.title} className="h-full">
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </SurfaceCard>
              ))}
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection surface="tint" spacing="md">
        <SectionHeading
          eyebrow="Implementation path"
          title="How Web Growth would move this from weak surface to stronger platform"
          description="The process stays strategic: diagnose the real bottlenecks, rebuild the structure, then launch with stronger trust and conversion support."
          align="left"
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {page.processItems.map((item, index) => (
            <SurfaceCard key={item.title} className="h-full">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                Step {index + 1}
              </p>
              <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-slate-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </SurfaceCard>
          ))}
        </div>
      </PageSection>

      <PageSection surface="white" spacing="sm">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <FAQBlock
            items={page.faqs}
            title={`${page.title} FAQs`}
            description="Straight answers to the questions people usually ask before deciding whether to move forward."
          />

          <SurfaceCard tone="tint" className="h-fit">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Recommended next steps
            </p>
            <div className="mt-4 space-y-4">
              {page.relatedServices.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-200"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {link.label}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-slate-950">{link.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{link.description}</p>
                </Link>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </PageSection>

      <PageSection surface="default" spacing="sm">
        <CTASection
          eyebrow={page.eyebrow}
          title={page.ctaTitle}
          description={page.ctaDescription}
          primaryCtaText="Request a Website Review"
          primaryHref="/contact/"
          secondaryCtaText="View Services"
          secondaryHref="/services/"
          imageUrl={page.detailImage}
        />
      </PageSection>
    </main>
  );
}
