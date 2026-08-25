import StructuredData from "@/components/StructuredData";
import AutomationFaq, { automationFaqs } from "@/components/automation/AutomationFaq";
import AutomationHero from "@/components/automation/AutomationHero";
import AutomationTracking from "@/components/automation/AutomationTracking";
import BenefitsSection from "@/components/automation/BenefitsSection";
import EarlyAccessSteps from "@/components/automation/EarlyAccessSteps";
import ProductPreview from "@/components/automation/ProductPreview";
import TikTokSection from "@/components/automation/TikTokSection";
import WaitlistSection from "@/components/automation/WaitlistSection";
import WhatsAppSection from "@/components/automation/WhatsAppSection";
import WorkflowSection from "@/components/automation/WorkflowSection";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/automation/";

const pageDescription =
  "Web Growth Automation is building a WhatsApp Business platform and a TikTok scheduler to automate the work that slows your business down. Both are in development. Join the waitlist for early access.";

export const metadata = buildPageMetadata({
  title: "Web Growth Automation | WhatsApp Automation & TikTok Scheduling",
  description: pageDescription,
  path: PAGE_PATH,
  keywords: [
    "WhatsApp Business automation",
    "TikTok scheduler",
    "WhatsApp Business API platform",
    "business automation tools",
    "social media scheduling tool",
    "customer messaging automation",
    "small business automation software",
    "early access waitlist",
  ],
});

const pageUrl = absoluteUrl(PAGE_PATH);

/**
 * Structured data.
 *
 * Two SoftwareApplication entries, both marked PreOrder because neither product
 * has launched. Deliberately no `offers` with a price, no `aggregateRating` and
 * no `review`: there is no pricing, there are no ratings, and inventing either
 * would misrepresent a product that is not yet available.
 */
const schema = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: "Web Growth Automation",
    description: pageDescription,
    isPartOf: { "@id": `${SITE_URL}#website` },
    about: [
      { "@id": `${pageUrl}#whatsapp-platform` },
      { "@id": `${pageUrl}#tiktok-scheduler` },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${pageUrl}#whatsapp-platform`,
    name: "Web Growth WhatsApp Business API Platform",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web browser",
    description:
      "A WhatsApp Business platform in development for shared team inboxes, saved replies, contact management and opt-in campaigns.",
    url: `${pageUrl}#whatsapp`,
    releaseNotes: "In development. Early access opens to waitlist members first.",
    availability: "https://schema.org/PreOrder",
    publisher: { "@id": `${SITE_URL}#professional-service` },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${pageUrl}#tiktok-scheduler`,
    name: "Web Growth TikTok Scheduler",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web browser",
    description:
      "A TikTok scheduling tool in development for planning content ahead, preparing captions and publishing from a visible queue.",
    url: `${pageUrl}#tiktok`,
    releaseNotes: "In development. Early access opens to waitlist members first.",
    availability: "https://schema.org/PreOrder",
    publisher: { "@id": `${SITE_URL}#professional-service` },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: automationFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  },
  buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Web Growth Automation", path: PAGE_PATH },
  ]),
];

export default function AutomationPage() {
  return (
    <div className="automation-page" data-automation-root>
      <StructuredData data={schema} />
      <AutomationTracking />

      <AutomationHero />
      <ProductPreview />
      <WhatsAppSection />
      <TikTokSection />
      <WorkflowSection />
      <BenefitsSection />
      <EarlyAccessSteps />
      <WaitlistSection />
      <AutomationFaq />
    </div>
  );
}
