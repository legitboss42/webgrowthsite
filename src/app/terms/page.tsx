import type { Metadata } from "next";
import TermsClient from "@/components/TermsClient";

export const metadata: Metadata = {
  title: "Terms of Service | Web Growth",
  description:
    "Web Growth Terms of Service. Clear terms for using our website and working with us on web design and development projects.",
  keywords: [
    "web design",
    "web design agency terms",
    "website terms of service",
    "web design services",
    "website development terms",
  ],
  alternates: { canonical: "https://webgrowth.info/terms" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Terms of Service | Web Growth",
    description:
      "Clear terms for using our website and working with Web Growth on projects.",
    url: "https://webgrowth.info/terms",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.png",
        width: 1200,
        height: 630,
        alt: "Web Growth terms of service",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Web Growth",
    description:
      "Terms for using Web Growth and working with us on web design projects.",
    images: ["https://webgrowth.info/images/placeholder.png"],
  },
};

export default function TermsPage() {
  return <TermsClient />;
}
