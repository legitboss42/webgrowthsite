import type { Metadata } from "next";
import WebsiteAuditClient from "@/components/WebsiteAuditClient";

export const metadata: Metadata = {
  title: "Website Audit & Consultation | Web Growth",
  description:
    "Website audit and consultation to diagnose what’s blocking results: clarity, UX, trust, SEO foundations, and performance - with an actionable plan.",
  keywords: [
    "web design",
    "web design services",
    "website audit",
    "website consultation",
    "website review",
    "website UX audit",
    "seo audit",
    "website performance audit",
  ],
  alternates: {
    canonical: "https://webgrowth.info/services/website-audit",
  },
  openGraph: {
    title: "Website Audit & Consultation | Web Growth",
    description:
      "A clear diagnosis of what’s wrong with your site - plus a practical plan to fix it.",
    url: "https://webgrowth.info/services/website-audit",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "Website Audit & Consultation",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Audit & Consultation | Web Growth",
    description:
      "Expert website audits covering SEO, UX, trust, and performance gaps that block growth.",
    images: ["https://webgrowth.info/images/placeholder.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <WebsiteAuditClient />;
}


