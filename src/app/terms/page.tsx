import type { Metadata } from "next";
import TermsClient from "@/components/TermsClient";

export const metadata: Metadata = {
  title: "Terms of Service | Web Growth",
  description:
    "Web Growth Terms of Service. Clear terms for using our website and working with us on web design and development projects.",
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
        alt: "Web Growth",
      },
    ],
    type: "website",
  },
};

export default function TermsPage() {
  return <TermsClient />;
}