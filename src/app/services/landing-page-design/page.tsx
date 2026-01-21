import type { Metadata } from "next";
import LandingPageDesignClient from "@/components/LandingPageDesignClient";

export const metadata: Metadata = {
  title: "Landing Page Design | Web Growth",
  description:
    "Conversion-focused landing page design for ads, campaigns, and offers. Built to load fast, communicate clearly, and turn clicks into leads.",
  keywords: [
    "landing page design",
    "conversion landing page",
    "campaign landing page",
    "lead generation landing page",
    "high converting landing page",
    "web design agency",
  ],
  alternates: {
    canonical: "https://webgrowth.info/services/landing-page-design",
  },
  openGraph: {
    title: "Landing Page Design | Web Growth",
    description:
      "Landing pages built for one job: convert visitors into leads, bookings, or sales.",
    url: "https://webgrowth.info/services/landing-page-design",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "Landing Page Design",
      },
    ],
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <LandingPageDesignClient />;
}
