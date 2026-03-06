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
import { buildWhatsAppUrl } from "@/lib/site";

const pageDescription =
  "Website design in 48 hours for Nigeria-based businesses and international clients that need a professional site live fast with domain guidance, hosting, and a conversion-focused one-page build.";

export const metadata = buildPageMetadata({
  title: "Launch in 48 Hours",
  description: pageDescription,
  path: "/launch",
  keywords: [
    ...launchKeywordSet,
    "website launch in nigeria",
    "remote website launch service",
  ],
  image: "/images/hero/Hero-Image-1.webp",
});

export default function LaunchPage() {
  return (
    <>
      <StructuredData data={buildProfessionalServiceSchema("/launch", pageDescription)} />

      <main className="bg-[#050806] text-white">
        <HeroSection
          eyebrow="Launch Offer"
          title="Website design in 48 hours for Nigeria-based and international businesses"
          description="Domain + hosting + a high-converting one-page site - done for you."
          primaryLabel="Start Now"
          primaryHref={buildWhatsAppUrl(
            "Hello, I want the website design in 48 hours launch offer."
          )}
          secondaryLabel="See What's Included"
          secondaryHref="#inclusions"
          trustLine="Fast turnaround | Mobile-first | Simple pricing"
          locationNote="This offer works well for founders, service businesses, and lean teams in Nigeria or abroad that need to launch quickly without adding unnecessary complexity."
          asideTitle="Why this offer works"
          asideItems={[
            "One page keeps the launch focused and fast.",
            "Direct CTA flow fits outreach, referrals, and local service traffic.",
            "The setup is ready to expand later into services, blog, or SEO content.",
          ]}
        />

        <WhatYouGetSection items={whatYouGetItems} />
        <PricingSection
          tiers={pricingTiers}
          description="Straight USD pricing for a focused launch. Ideal when speed, clarity, and clean delivery matter more than bloated scope."
        />
        <SocialProofSection cards={socialProofCards} />
        <FAQSection
          items={launchFaqs}
          title="Questions about the 48-hour launch"
          description="These are the practical questions people ask before they commit to a fast website build."
        />
        <FinalCTASection description="If the offer fits your stage, the fastest path is to start on WhatsApp and send the basics needed for the build." />
      </main>
    </>
  );
}
