import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import HeroSection from "@/components/HeroSection";
import HomeTrustSection from "@/components/HomeTrustSection";
import PricingSection from "@/components/PricingSection";
import SocialProofSection from "@/components/SocialProofSection";
import StructuredData from "@/components/StructuredData";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import { launchFaqs, pricingTiers } from "@/lib/launchOffer";
import { portfolioCases } from "@/lib/portfolioCases";
import {
  buildFaqSchema,
  buildPageMetadata,
  buildProfessionalServiceSchema,
  launchKeywordSet,
} from "@/lib/seo";

const pageDescription =
  "High-performance web design services built in Next.js for serious brands that need speed, stronger SEO foundations, and better conversion.";

const buyerAnswers = [
  {
    title: "Why does a slow website cost real money?",
    answer:
      "Because paid traffic, referrals, and organic clicks land on a page that feels heavy, generic, or hard to trust before the buyer ever considers enquiring.",
    href: "/launch",
    hrefLabel: "See the premium package",
  },
  {
    title: "What does builder bloat do to conversion?",
    answer:
      "It slows load times, weakens the mobile experience, and forces buyers through clumsy layouts that make strong businesses look less established than they are.",
    href: "/about",
    hrefLabel: "See why custom code wins",
  },
  {
    title: "Why can good traffic still underperform?",
    answer:
      "Traffic does not convert on intent alone. If the page structure is unclear, the trust signals are weak, or the offer feels flat, valuable visits still leak away.",
    href: "/portfolio",
    hrefLabel: "Review the proof",
  },
  {
    title: "What changes when the architecture is right?",
    answer:
      "You get faster pages, cleaner SEO foundations, stronger UX, and a conversion path that makes it easier for serious buyers to trust the brand and take action.",
    href: "/contact",
    hrefLabel: "Request a website quote",
  },
] as const;

const homepageWhatYouGet = [
  {
    title: "Performance architecture",
    description:
      "Custom-coded Next.js builds engineered to load fast, feel smooth on mobile, and protect the traffic you already paid to earn.",
  },
  {
    title: "SEO foundations",
    description:
      "Clean page structure, metadata, crawlability basics, and technical decisions that give search visibility something solid to build on.",
  },
  {
    title: "Premium UX design",
    description:
      "A sharper interface, stronger hierarchy, and a more trustworthy first impression for buyers comparing serious options.",
  },
  {
    title: "Conversion-focused flow",
    description:
      "Clear messaging, stronger calls to action, and a tighter enquiry path so visitors do not have to work to understand what to do next.",
  },
  {
    title: "Scalable codebase",
    description:
      "A flexible technical foundation that can expand into new pages, SEO content, integrations, and future growth without becoming messy.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "High-Performance Web Design Services | Web Growth",
  description: pageDescription,
  path: "/",
  keywords: [
    "high-performance web design",
    "high-performance web design services",
    "next.js web design agency",
    "premium web design agency",
    "custom next.js website development",
    ...launchKeywordSet,
  ],
  image: "/images/hero/Hero-Image-1.webp",
});

export default function Page() {
  const featuredCases = portfolioCases
    .filter((item) => item.status !== "Proposal")
    .slice(0, 3);

  return (
    <>
      <StructuredData
        data={[
          buildProfessionalServiceSchema("/", pageDescription),
          buildFaqSchema(launchFaqs),
        ]}
      />

      <main className="relative overflow-x-clip bg-[#050806] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />

        <HeroSection
          eyebrow="High-Performance Next.js Web Design"
          title="Premium Next.js websites engineered to convert high-value traffic"
          description="Web Growth delivers high-performance web design services with custom-coded Next.js architecture, stronger SEO foundations, and premium UX built to turn serious traffic into enquiries and revenue."
          primaryLabel="Request a Premium Website Quote"
          primaryHref="/contact"
          secondaryLabel="View the Website Package"
          secondaryHref="/launch"
          trustLine="Custom-coded in Next.js | Fast-loading by design | Built for SEO and conversion"
          locationNote="Best for serious service businesses, premium clinics, and ambitious e-commerce brands that want stronger performance before they spend more on traffic."
          fitTags={["Next.js", "Performance", "Premium brands"]}
          asideTitle="Engineered for"
          asideItems={[
            "Fast-loading architecture that protects ad spend, organic traffic, and first impressions.",
            "Premium UX that makes the brand feel more established the moment the page opens.",
            "Conversion architecture that guides serious buyers toward an enquiry instead of losing them in clutter.",
          ]}
          imageAlt="High-performance Next.js website design hero for Web Growth"
          showCodeRain
          showHomeAnimations
          pageType="homepage"
        />

        <HomeTrustSection />

        <AnswerHighlightsSection
          eyebrow="The cost of slow websites"
          title="What weak architecture does to trust, leads, and revenue"
          description="A slow, bloated, generic website is not just a design issue. It is a conversion problem that makes every traffic source work harder for less return."
          items={buyerAnswers}
        />

        <WhatYouGetSection
          items={homepageWhatYouGet}
          title="What serious brands should expect from a modern website"
          description="Performance, SEO, design, and conversion support are treated as revenue infrastructure, not decorative extras."
        />

        <PricingSection
          tiers={pricingTiers}
          title="Premium website packages built to launch with commercial intent"
          description="Straightforward USD pricing for businesses that want a serious website foundation without paying for unnecessary complexity."
          pageType="homepage_pricing"
        />

        <SocialProofSection
          cards={featuredCases}
          eyebrow="Engineered proof"
          title="Proof of premium build quality in live projects"
          description="These projects show how Web Growth handles premium UX, clearer conversion flow, and business-ready frontend execution across live brands."
        />

        <FAQSection
          items={launchFaqs}
          title="Questions before you move"
          description="The practical answers most buyers want before they send the first message."
        />

        <FinalCTASection
          title="If the website is underperforming, fix the build before you buy more traffic"
          description="Send the brief and get a direct recommendation on the right architecture, the likely scope, and the fastest route to a premium website that earns its keep."
          pageType="homepage_final_cta"
        />
      </main>
    </>
  );
}
