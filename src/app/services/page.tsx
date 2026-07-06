import ServicesClient from "@/components/ServicesClient";
import { NEW_SERVICES_LIST } from "@/lib/newServiceConfigs";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Website Growth Services | Web Growth",
  description:
    "Website growth services for businesses that need stronger websites, clearer conversion paths, better SEO foundations, and practical implementation support.",
  path: "/services",
  keywords: [
    "website growth services",
    "business website design service",
    "website redesign service",
    "landing page design service",
    "ecommerce website design service",
    "website speed optimization service",
    "website audit service",
    "seo service for service businesses",
    "analytics tracking setup service",
    "website maintenance service",
    "small business website design",
    "conversion-focused website services",
  ],
});

export default function Page() {
  return <ServicesClient services={NEW_SERVICES_LIST} />;
}
