import type { Metadata } from "next";
import ServicesClient from "@/components/ServicesClient";

export const metadata: Metadata = {
  title: "Website Services for Small Businesses",
  description:
    "Explore the core website services Web Growth uses to help small businesses launch faster, redesign weak sites, and turn more visitors into enquiries.",
  keywords: [
    "web design",
    "web design services",
    "website design services",
    "small business website design",
    "business website design",
    "landing page design",
    "website redesign services",
    "service business web design",
    "conversion focused website",
  ],
  alternates: { canonical: "https://webgrowth.info/services" },
  openGraph: {
    title: "Website Services for Small Businesses",
    description:
      "Core website services built to improve clarity, mobile trust, and enquiries.",
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
    title: "Website Services for Small Businesses",
    description:
      "New websites, landing pages, and redesigns built for clearer offers and more enquiries.",
    images: ["https://webgrowth.info/images/hero/Hero-Image-1.webp"],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <ServicesClient />;
}
