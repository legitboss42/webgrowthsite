import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export const metadata: Metadata = {
  title: "Web Growth | Web Design Agency for Real Results",
  description:
    "Web Growth designs professional websites focused on real results — websites that attract customers, build trust, and support real growth.",
  keywords: [
    "web design agency",
    "website design",
    "landing pages",
    "website redesign",
    "conversion-focused web design",
    "Next.js web design",
  ],
  alternates: {
    canonical: "https://webgrowth.info/",
  },
  openGraph: {
    title: "Web Growth | Web Design Agency for Real Results",
    description:
      "Professional websites that don’t just look good — they attract customers, build trust, and support real growth.",
    url: "https://webgrowth.info/",
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
  twitter: {
    card: "summary_large_image",
    title: "Web Growth | Web Design Agency",
    description:
      "Professional websites focused on real results — clarity, usability, performance.",
    images: ["https://webgrowth.info/images/placeholder.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <HomeClient />;
}
