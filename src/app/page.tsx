import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import CorePageLinks from "@/components/CorePageLinks";
import EntitySnapshotSection from "@/components/EntitySnapshotSection";
import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";
import SocialProofSection from "@/components/SocialProofSection";
import StructuredData from "@/components/StructuredData";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import {
  launchFaqs,
  pricingTiers,
  socialProofCards,
  whatYouGetItems,
} from "@/lib/launchOffer";
import {
  buildPageMetadata,
  buildProfessionalServiceSchema,
  launchKeywordSet,
} from "@/lib/seo";
import { GET_STARTED_PATH } from "@/lib/site";

const pageDescription =
  "Website design in 48 hours for businesses in Nigeria and international clients who need a professional one-page website live fast, with domain guidance, hosting, basic SEO, and pricing from $150.";

const homeBuyerAnswers = [
  {
    title: "How fast can this go live?",
    answer:
      "If your core business details and approvals are ready, the website can be launched in 48 hours without dragging the project into weeks of back-and-forth.",
    href: "/launch",
    hrefLabel: "See the launch offer",
  },
  {
    title: "What kind of business is this for?",
    answer:
      "It is best for service businesses, founders, and lean teams that need a clear online presence before outreach, ads, referrals, or local search starts sending traffic.",
    href: "/faq",
    hrefLabel: "Read the FAQ",
  },
  {
    title: "What do you actually get?",
    answer:
      "You get a conversion-focused one-page website, domain and hosting guidance, mobile-first structure, and the essential launch SEO basics needed to go live confidently.",
    href: "/pricing",
    hrefLabel: "Review pricing",
  },
  {
    title: "What should I do first?",
    answer:
      "Start with the launch page if you are ready to move, or use the pricing and FAQ pages if you need to compare the offer before you commit.",
    href: "/contact",
    hrefLabel: "Start your website",
  },
] as const;

const entitySnapshotItems = [
  {
    title: "What Web Growth does",
    description:
      "Web Growth helps businesses launch clearer, faster, more conversion-focused websites instead of vague brochure sites that do not support growth.",
  },
  {
    title: "Who it is for",
    description:
      "The site is built for service businesses, founders, and lean teams in Nigeria and international markets that need a credible online presence quickly.",
  },
  {
    title: "What the main offer is",
    description:
      "The fastest entry point is website design in 48 hours, with domain guidance, hosting setup, and a focused one-page launch from $150.",
  },
  {
    title: "What to read next",
    description:
      "Use the launch page for the service, pricing for scope and budget, FAQ for decision support, and the blog for supporting SEO and website strategy guidance.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Website Design in 48 Hours | Fast Business Website Launch",
  description: pageDescription,
  path: "/",
  keywords: [
    ...launchKeywordSet,
    "website design nigeria",
    "professional website launch",
    "one-page website service",
  ],
  image: "/images/hero/Hero-Image-1.webp",
});

export default function Page() {
  return (
    <>
      <StructuredData data={buildProfessionalServiceSchema("/", pageDescription)} />

      <main className="relative overflow-x-clip bg-[#050806] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:42px_42px] opacity-25" />

        <HeroSection
          eyebrow="48-Hour Website Launch"
          title="Website design in 48 hours for businesses that need a professional website live fast"
          description="Website design in 48 hours with domain guidance, hosting setup, and a high-converting one-page business website done for you."
          primaryLabel="Get Started"
          primaryHref={GET_STARTED_PATH}
          secondaryLabel="See the Launch Offer"
          secondaryHref="/launch"
          trustLine="Fast turnaround | Mobile-first | Simple pricing"
          locationNote="Built for businesses in Nigeria, Lagos, and international clients who want a remote launch partner without agency drag."
          asideTitle="Launch sequence"
          asideItems={[
            "Offer, structure, and conversion path locked in quickly.",
            "Domain, hosting, page build, and SEO basics handled in one flow.",
            "Launch-ready delivery so you can start sending traffic immediately.",
          ]}
          imageAlt="Website design in 48 hours hero image for Web Growth"
          showCodeRain
          showHomeAnimations
        />

        <AnswerHighlightsSection
          eyebrow="Buyer questions"
          title="The questions serious prospects usually ask first"
          description="This gives you the fast version up front, so you can tell quickly whether the offer matches your business, timeline, and launch stage."
          items={homeBuyerAnswers}
        />

        <EntitySnapshotSection
          title="A clearer summary of what this website is here to help you do"
          description="This makes the business easier to understand quickly, which helps both human visitors and AI-style answer systems interpret the site without guessing."
          items={entitySnapshotItems}
          links={[
            { href: "/about", label: "About Web Growth" },
            { href: "/launch", label: "See the main offer" },
            { href: "/blog", label: "Browse practical guides" },
          ]}
        />

        <CorePageLinks
          eyebrow="Core pages"
          title="See how the 48-hour website launch works before you commit"
          description="These crawlable text links make it easy to review the offer, compare pricing, and check launch questions without losing your place."
          links={[
            {
              href: "/launch",
              label: "Offer",
              title: "Explore the 48-hour launch service",
              description:
                "See exactly what is included in the done-for-you website design in 48 hours offer.",
            },
            {
              href: "/pricing",
              label: "Pricing",
              title: "Review 48-hour launch pricing",
              description:
                "Compare the one-page business website package and the blog-ready option starting at $150.",
            },
            {
              href: "/faq",
              label: "FAQ",
              title: "Read the launch FAQ",
              description:
                "Get quick answers on timing, ownership, revisions, support, and launch expectations.",
            },
          ]}
        />

        <WhatYouGetSection items={whatYouGetItems} />
        <PricingSection tiers={pricingTiers} />
        <SocialProofSection cards={socialProofCards} />
        <FAQSection items={launchFaqs} />
        <FinalCTASection />
      </main>
    </>
  );
}
