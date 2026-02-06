import type { Metadata } from "next";
import PortfolioClient from "@/components/PortfolioClient";

export const metadata: Metadata = {
  title: "Portfolio | Web Growth - Case Studies & Results",
  description:
    "Explore Web Growth portfolio case studies: modern websites, landing pages, and redesigns built for clarity, trust, and real business results.",
  keywords: [
    "web design portfolio",
    "website case studies",
    "landing page case study",
    "website redesign portfolio",
    "web design results",
    "conversion focused websites",
  ],
  alternates: {
    canonical: "https://webgrowth.info/portfolio",
  },
  openGraph: {
    title: "Web Growth Portfolio",
    description:
      "Case studies and examples of premium websites built for performance and conversions.",
    url: "https://webgrowth.info/portfolio",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "Web Growth Portfolio",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Growth Portfolio",
    description: "Case studies and results from our web design work.",
    images: ["https://webgrowth.info/images/placeholder.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}


