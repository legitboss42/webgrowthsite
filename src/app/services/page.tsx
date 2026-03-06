import type { Metadata } from "next";
import ServicesClient from "@/components/ServicesClient";

export const metadata: Metadata = {
  title: "Web Design Services",
  description:
    "Explore Web Growth services for website design, landing page and funnel architecture, SEO, Google Business Profile optimisation, email marketing setup, CRM and automation implementation, analytics tracking, and lead generation.",
  keywords: [
    "web design",
    "web design services",
    "website design services",
    "website design company",
    "small business website design",
    "business website design",
    "landing page design",
    "sales funnel design",
    "website redesign services",
    "ecommerce website design",
    "seo services",
    "search engine optimisation",
    "google business profile optimization",
    "email marketing services",
    "crm setup service",
    "marketing automation services",
    "google analytics setup",
    "lead magnet strategy",
  ],
  alternates: { canonical: "https://webgrowth.info/services" },
  openGraph: {
    title: "Web Design Services",
    description:
      "High-intent web growth services: websites, SEO, funnel architecture, automation, and tracking setup built to increase leads and sales.",
    url: "https://webgrowth.info/services",
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
    title: "Web Design Services",
    description:
      "Website design, landing page funnels, SEO, CRM automation, and tracking setup for business growth.",
    images: ["https://webgrowth.info/images/hero/Hero-Image-1.webp"],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <ServicesClient />;
}
