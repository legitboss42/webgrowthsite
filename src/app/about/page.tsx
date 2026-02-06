import type { Metadata } from "next";
import AboutClient from "@/components/AboutClient";

export const metadata: Metadata = {
  title: "About Web Growth | Modern Web Design Focused on Results",
  description:
    "Learn about Web Growth - a web design studio focused on building modern, high-performance websites that attract customers, build trust, and support real growth.",
  keywords: [
    "about web growth",
    "web design agency",
    "website design studio",
    "landing page design",
    "website redesign",
    "conversion focused design",
    "Next.js web design",
  ],
  alternates: {
    canonical: "https://webgrowth.info/about",
  },
  openGraph: {
    title: "About Web Growth",
    description:
      "Modern web design with clarity, performance, and real results - not just pretty pages.",
    url: "https://webgrowth.info/about",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "About Web Growth",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Web Growth",
    description:
      "Modern websites that attract customers, build trust, and support real growth.",
    images: ["https://webgrowth.info/images/placeholder.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return <AboutClient />;
}


