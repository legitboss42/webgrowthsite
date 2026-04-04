import type { Metadata } from "next";
import PortfolioClient from "@/components/PortfolioClient";

export const metadata: Metadata = {
  title: "Portfolio | Real Website Projects by Web Growth",
  description:
    "Browse a small selection of real websites launched by Web Growth for interiors, aesthetics, fitness, and ecommerce brands.",
  keywords: [
    "web design",
    "web design services",
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
    title: "Portfolio | Real Website Projects by Web Growth",
    description:
      "A curated selection of real websites launched by Web Growth.",
    url: "https://webgrowth.info/portfolio",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/portfolio/tlc-interiors-desktop.jpg",
        width: 1200,
        height: 630,
        alt: "Web Growth portfolio preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio | Real Website Projects by Web Growth",
    description: "A curated selection of real websites launched by Web Growth.",
    images: ["https://webgrowth.info/images/portfolio/tlc-interiors-desktop.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}


