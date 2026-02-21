import type { Metadata } from "next";
import ServicesClient from "@/components/ServicesClient";

export const metadata: Metadata = {
  title: "Web Design Services | Web Growth",
  description:
    "Explore Web Growth web design services: business website design, landing pages, redesign, e-commerce, maintenance, performance optimisation, and website audits.",
  keywords: [
    "web design",
    "web design services",
    "website design services",
    "business website design",
    "landing page design",
    "website redesign services",
    "ecommerce website design",
  ],
  alternates: { canonical: "https://webgrowth.info/services" },
  openGraph: {
    title: "Web Design Services | Web Growth",
    description:
      "End-to-end web design services built to improve trust, conversions, and measurable business growth.",
    url: "https://webgrowth.info/services",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "Web Growth web design services",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Design Services | Web Growth",
    description:
      "Business websites, landing pages, redesigns, audits, and performance optimisation.",
    images: ["https://webgrowth.info/images/placeholder.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <ServicesClient />;
}
