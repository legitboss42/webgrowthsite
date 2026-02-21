import type { Metadata } from "next";
import BusinessWebsiteDesignClient from "@/components/BusinessWebsiteDesignClient";

export const metadata: Metadata = {
  title: "Business Website Design | Web Growth",
  description:
    "Professional business website design focused on clarity, trust, speed, and real results. Built to attract customers and support growth.",
  keywords: [
    "web design",
    "web design services",
    "business website design",
    "professional website design",
    "company website design",
    "web design agency",
    "conversion focused websites",
    "modern business websites",
  ],
  alternates: {
    canonical: "https://webgrowth.info/services/business-website-design",
  },
  openGraph: {
    title: "Business Website Design | Web Growth",
    description:
      "Websites designed to position your business professionally and convert visitors into enquiries.",
    url: "https://webgrowth.info/services/business-website-design",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "Business Website Design",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Website Design | Web Growth",
    description:
      "Professional web design services for businesses that want more enquiries and stronger trust.",
    images: ["https://webgrowth.info/images/placeholder.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <BusinessWebsiteDesignClient />;
}
