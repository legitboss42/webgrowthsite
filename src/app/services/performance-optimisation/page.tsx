import type { Metadata } from "next";
// If the file is actually named PerfomanceOptimisationClient.tsx (note the missing 'r'), update the import:
import PerformanceOptimisationClient from "@/components/PerformanceOptimisationClient";

export const metadata: Metadata = {
  title: "Speed & Performance Optimisation | Web Growth",
  description:
    "Speed and performance optimisation for faster load times, better mobile experience, and improved conversions. Fix slow websites properly.",
  keywords: [
    "web design",
    "web design services",
    "website speed optimisation",
    "performance optimisation",
    "improve website speed",
    "page speed optimisation",
    "core web vitals",
    "mobile website speed",
  ],
  alternates: {
    canonical: "https://webgrowth.info/services/performance-optimisation",
  },
  openGraph: {
    title: "Speed & Performance Optimisation | Web Growth",
    description:
      "Make your website faster and smoother - reduce bounce and improve conversions.",
    url: "https://webgrowth.info/services/performance-optimisation",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "Speed & Performance Optimisation",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Speed & Performance Optimisation | Web Growth",
    description:
      "Speed-focused web design optimisation to improve Core Web Vitals and reduce bounce.",
    images: ["https://webgrowth.info/images/placeholder.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <PerformanceOptimisationClient />;
}


