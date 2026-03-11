import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
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
  "Website design in 48 hours for businesses in Nigeria and international clients who need a professional one-page website live fast with domain guidance, hosting, and basic SEO handled.";

export const metadata = buildPageMetadata({
  title: "Website Design in 48 Hours",
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
          title="Website Design in 48 Hours | Get a Professional Website Live Fast"
          description="Domain + hosting + a high-converting one-page site - done for you."
          primaryLabel="Get Started"
          primaryHref={GET_STARTED_PATH}
          secondaryLabel="See Pricing"
          secondaryHref="/pricing"
          trustLine="Fast turnaround | Mobile-first | Simple pricing"
          locationNote="Built for businesses in Nigeria, Lagos, and international clients who want a remote launch partner without agency drag."
          asideTitle="Launch sequence"
          asideItems={[
            "Offer, structure, and conversion path locked in quickly.",
            "Domain, hosting, page build, and SEO basics handled in one flow.",
            "Launch-ready delivery so you can start sending traffic immediately.",
          ]}
          showCodeRain
          showHomeAnimations
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
