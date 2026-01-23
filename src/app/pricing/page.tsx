import type { Metadata } from "next";
import PricingClient from "@/components/PricingClient";

export const metadata: Metadata = {
  title: "Pricing | Web Growth — Transparent Website Packages",
  description:
    "Clear website design packages from Web Growth. Choose a package, see what’s included, and request a quote with next steps.",
  alternates: { canonical: "https://webgrowth.info/pricing" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Web Growth Pricing",
    description:
      "Transparent website packages with clear deliverables, timelines, and optional add-ons.",
    url: "https://webgrowth.info/pricing",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.png",
        width: 1200,
        height: 630,
        alt: "Web Growth Pricing",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Growth Pricing",
    description: "Transparent website packages with clear deliverables.",
    images: ["https://webgrowth.info/images/placeholder.png"],
  },
};

export default function PricingPage() {
  return <PricingClient />;
}