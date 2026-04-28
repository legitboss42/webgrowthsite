import type { Metadata } from "next";
import ServicesClient from "@/components/ServicesClient";
import { NEW_SERVICES_LIST } from "@/lib/newServiceConfigs";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Web Design Services Agency | Web Growth",
  description:
    "Web design services for businesses that need faster websites, stronger SEO foundations, and higher conversion.",
  keywords: [
    "web design services",
    "web design services agency",
    "business website design service",
    "website redesign service",
    "landing page design service",
    "ecommerce website design service",
    "website speed optimization service",
    "website audit service",
    "website design services",
    "small business website design",
    "conversion-focused web design",
  ],
  alternates: { canonical: absoluteUrl("/services") },
  openGraph: {
    title: "Web Design Services Agency | Web Growth",
    description:
      "Conversion-focused website services for businesses that need measurable performance.",
    url: absoluteUrl("/services"),
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/hero/Hero-Image-1.webp",
        width: 1200,
        height: 630,
        alt: "Web Growth web design services",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Design Services Agency | Web Growth",
    description:
      "Website services for businesses that need stronger conversion and faster growth execution.",
    images: ["https://webgrowth.info/images/hero/Hero-Image-1.webp"],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <ServicesClient services={NEW_SERVICES_LIST} />;
}
