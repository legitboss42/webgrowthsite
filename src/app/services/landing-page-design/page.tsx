import type { Metadata } from "next";
import LandingPageDesignClient from "@/components/LandingPageDesignClient";

export const metadata: Metadata = {
  title: "Landing Page Design Lagos | High-Converting Pages for Leads and Sales",
  description:
    "Landing page design in Lagos for ads, campaigns, and offers. Built to load fast, guide user flow, and convert high-intent traffic into leads and sales.",
  keywords: [
    "web design",
    "web design services",
    "landing page design",
    "landing page design lagos",
    "landing page design nigeria",
    "funnel architecture",
    "sales funnel design",
    "lead generation funnel",
    "conversion landing page",
    "campaign landing page",
    "lead generation landing page",
    "high converting landing page",
    "web design agency",
  ],
  alternates: {
    canonical: "https://webgrowth.info/services/landing-page-design",
  },
  openGraph: {
    title: "Landing Page Design Lagos | High-Converting Pages for Leads and Sales",
    description:
      "Landing page design in Lagos for businesses that need faster, clearer conversion paths from campaigns and ads.",
    url: "https://webgrowth.info/services/landing-page-design",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/hero/Hero-Image-1.webp",
        width: 1200,
        height: 630,
        alt: "Landing Page Design",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Landing Page Design Lagos | High-Converting Pages for Leads and Sales",
    description:
      "Landing page design in Lagos for campaigns, lead generation, bookings, and focused sales offers.",
    images: ["https://webgrowth.info/images/hero/Hero-Image-1.webp"],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <LandingPageDesignClient />;
}
