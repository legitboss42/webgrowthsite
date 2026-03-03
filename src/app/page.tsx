import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export const metadata: Metadata = {
  title: "Web Design Services | Get a Professional Website Live in 48 Hours",
  description:
    "Web design services for small businesses: launch a professional website in 48 hours with domain guidance, hosting + SSL, and a high-converting one-page site.",
  keywords: [
    "web design",
    "website design",
    "web design services",
    "48 hour website launch",
    "one page website",
    "small business website launch",
    "small business web design",
    "fast web design service",
    "website setup service",
    "conversion-focused website",
  ],
  alternates: {
    canonical: "https://webgrowth.info/",
  },
  openGraph: {
    title: "Web Design Services | 48-Hour Website Launch",
    description:
      "Web design services with domain guidance, hosting + SSL, and a high-converting one-page website launch service.",
    url: "https://webgrowth.info/",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.webp",
        width: 1200,
        height: 630,
        alt: "48-hour website launch service",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Design Services | 48-Hour Website Launch",
    description: "Fast web design service for direct outreach traffic.",
    images: ["https://webgrowth.info/images/placeholder.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <HomeClient />;
}
