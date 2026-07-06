import FAQAccordion from "@/components/FAQAccordion";
import PageHero from "@/components/platform/PageHero";
import PageSection from "@/components/platform/PageSection";
import SurfaceCard from "@/components/platform/SurfaceCard";
import StructuredData from "@/components/StructuredData";
import { launchFaqs } from "@/lib/launchOffer";
import { buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";

const pageDescription =
  "Frequently asked questions about Web Growth's website launch, pricing, timing, ownership, and support.";

export const metadata = buildPageMetadata({
  title: "Web Growth FAQ | Pricing, Timing, and Ownership",
  description: pageDescription,
  path: "/faq",
  keywords: [
    "web growth faq",
    "website launch faq",
    "website design nigeria faq",
    "pricing and ownership faq",
  ],
});

export default function FaqPage() {
  return (
    <>
      <StructuredData data={buildProfessionalServiceSchema("/faq", pageDescription)} />

      <main className="bg-[#f7f8fc] text-slate-950">
        <PageHero
          eyebrow="FAQ"
          title="Clear answers about pricing, timelines, ownership, and what happens next."
          description="Short, direct answers for people deciding whether Web Growth is the right fit for a website review, redesign, or implementation project."
          primaryCta={{ label: "Request a Website Review", href: "/contact/" }}
          secondaryCta={{ label: "View Services", href: "/services/" }}
          chips={["Trust page", "Service clarity", "No vague sales copy"]}
        />

        <PageSection surface="white" spacing="sm">
          <div className="grid gap-6 lg:grid-cols-[0.74fr_1.26fr]">
            <SurfaceCard tone="tint">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">What this page covers</p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-600">
                <li>How pricing and scope are approached</li>
                <li>What ownership looks like after delivery</li>
                <li>How timelines and revisions are handled</li>
                <li>What happens after you submit an enquiry</li>
              </ul>
            </SurfaceCard>

            <FAQAccordion items={launchFaqs} />
          </div>
        </PageSection>
      </main>
    </>
  );
}
