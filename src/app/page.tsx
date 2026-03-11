import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import CorePageLinks from "@/components/CorePageLinks";
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
