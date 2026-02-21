import type { Metadata } from "next";
import PrivacyClient from "@/components/PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | Web Growth",
  description:
    "Web Growth Privacy Policy. Learn how we collect, use, and protect your information when you use our website and services.",
  keywords: [
    "web design",
    "web design agency privacy policy",
    "website privacy policy",
    "web design services",
    "data privacy",
  ],
  alternates: { canonical: "https://webgrowth.info/privacy" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Privacy Policy | Web Growth",
    description:
      "Learn how Web Growth collects, uses, and protects your information.",
    url: "https://webgrowth.info/privacy",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.png",
        width: 1200,
        height: 630,
        alt: "Web Growth privacy policy",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Web Growth",
    description:
      "How Web Growth handles and protects data collected through our website and services.",
    images: ["https://webgrowth.info/images/placeholder.png"],
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
