import type { Metadata } from "next";
import WebsiteRedesignClient from "@/components/WebsiteRedesignClient";

export const metadata: Metadata = {
  title: "Website Redesign Lagos | Redesign Your Site for More Enquiries",
  description:
    "Website redesign in Lagos for businesses that need a faster, more credible website with clearer messaging, better mobile UX, and stronger conversion flow.",
  keywords: [
    "web design",
    "web design services",
    "website redesign",
    "website redesign lagos",
    "website redesign nigeria",
    "website revamp",
    "modern website redesign",
    "professional website redesign",
    "conversion focused redesign",
  ],
  alternates: {
    canonical: "https://webgrowth.info/services/website-redesign",
  },
  openGraph: {
    title: "Website Redesign Lagos | Redesign Your Site for More Enquiries",
    description:
      "Website redesign in Lagos for businesses that need a modern, faster, trust-building website that converts better.",
    url: "https://webgrowth.info/services/website-redesign",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/hero/Hero-Image-1.webp",
        width: 1200,
        height: 630,
        alt: "Website Redesign",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Redesign Lagos | Redesign Your Site for More Enquiries",
    description:
      "Website redesign in Lagos to improve trust, user experience, speed, and enquiries.",
    images: ["https://webgrowth.info/images/hero/Hero-Image-1.webp"],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <WebsiteRedesignClient />;
}
