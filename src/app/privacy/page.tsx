import type { Metadata } from "next";
import PrivacyClient from "@/components/PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | Web Growth",
  description:
    "Web Growth Privacy Policy. Learn how we collect, use, and protect your information when you use our website and services.",
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
        alt: "Web Growth",
      },
    ],
    type: "website",
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}