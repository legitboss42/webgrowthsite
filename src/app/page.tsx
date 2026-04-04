import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import HeroSection from "@/components/HeroSection";
import HomeTrustSection from "@/components/HomeTrustSection";
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

const pageDescription =
  "Web Growth builds websites for Lagos service businesses that want to look more credible, work better on mobile, and get more enquiries.";

const homeBuyerAnswers = [
  {
    title: "Who this is for",
    answer:
      "Best for Lagos service businesses that already get some attention but still lose people because the website feels weak, confusing, or old.",
    href: "/pricing",
    hrefLabel: "See pricing",
  },
  {
    title: "What you actually get",
    answer:
      "A website that explains what you do more clearly, feels better on mobile, and makes it easier for people to contact you.",
    href: "/launch",
    hrefLabel: "See the offer",
  },
  {
    title: "What happens after you enquire",
    answer:
      "You get a direct reply from Victor with what makes sense, what it will take, and what the next step should be.",
    href: "/contact",
    hrefLabel: "Send project details",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Web Design for Lagos Service Businesses | Web Growth",
  description: pageDescription,
  path: "/",
  keywords: [
    ...launchKeywordSet,
    "website design lagos",
    "lagos service business website",
    "conversion focused web design",
    "small business website design lagos",
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
          eyebrow="Web Design for Service Businesses"
          title="Websites that help service businesses look more credible and get more enquiries"
          description="I build websites for businesses that are tired of looking average online and want something clearer, faster, and easier for people to act on."
          primaryLabel="Get My Website Quote"
          primaryHref="/contact"
          secondaryLabel="See Pricing"
          secondaryHref="/pricing"
          trustLine="Work directly with Victor | Built mobile-first | You keep control of your domain and hosting"
          locationNote="Best for Lagos service businesses that need a stronger website before putting more money into ads, outreach, or referrals."
          fitTags={["Lagos", "Service businesses", "Fast launch"]}
          asideTitle="What you get"
          asideItems={[
            "A clearer site that tells people what you do without making them work for it.",
            "A mobile-first layout that feels more trustworthy from the first visit.",
            "A simple next step so people know how to contact you or book.",
          ]}
          imageAlt="Website design in 48 hours hero image for Web Growth"
          showCodeRain
          showHomeAnimations
          pageType="homepage"
        />

        <HomeTrustSection />

        <AnswerHighlightsSection
          eyebrow="Buyer questions"
          title="The questions people usually ask before they reach out"
          description="These are the quick answers most people want before they decide whether to start the conversation."
          items={homeBuyerAnswers}
        />

        <WhatYouGetSection items={whatYouGetItems} />
        <PricingSection tiers={pricingTiers} pageType="homepage_pricing" />
        <SocialProofSection cards={socialProofCards} />
        <FAQSection items={launchFaqs} />
        <FinalCTASection pageType="homepage_final_cta" />
      </main>
    </>
  );
}
