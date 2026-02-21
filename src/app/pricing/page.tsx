import type { Metadata } from "next";
import PricingClient from "@/components/PricingClient";

export const metadata: Metadata = {
  title: "Web Design Pricing | Web Growth - Transparent Website Packages",
  description:
    "Transparent web design pricing from Web Growth. Compare website design packages, see what’s included, and request a quote.",
  keywords: [
    "web design",
    "web design pricing",
    "website design cost",
    "website design packages",
    "web design services",
    "business website pricing",
  ],
  alternates: { canonical: "https://webgrowth.info/pricing" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Web Design Pricing | Web Growth",
    description:
      "Transparent web design packages with clear deliverables, timelines, and add-ons.",
    url: "https://webgrowth.info/pricing",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.png",
        width: 1200,
        height: 630,
        alt: "Web Growth web design pricing",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Design Pricing | Web Growth",
    description: "Transparent web design pricing and clear package deliverables.",
    images: ["https://webgrowth.info/images/placeholder.png"],
  },
};

export default function PricingPage() {
  return <PricingClient />;
}


