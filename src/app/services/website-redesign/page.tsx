import type { Metadata } from "next";
import WebsiteRedesignClient from "@/components/WebsiteRedesignClient";

export const metadata: Metadata = {
  title: "Website Redesign | Web Growth",
  description:
    "Website redesign focused on clarity, trust, speed, and conversions. Upgrade an outdated site into a modern experience that performs.",
  keywords: [
    "website redesign",
    "website revamp",
    "modern website redesign",
    "professional website redesign",
    "conversion focused redesign",
  ],
  alternates: {
    canonical: "https://webgrowth.info/services/website-redesign",
  },
  openGraph: {
    title: "Website Redesign | Web Growth",
    description:
      "Transform an outdated website into a modern, fast, trust-building experience.",
    url: "https://webgrowth.info/services/website-redesign",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "Website Redesign",
      },
    ],
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <WebsiteRedesignClient />;
}
