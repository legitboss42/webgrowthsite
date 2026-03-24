import type { Metadata } from "next";
// If the file is actually named PerfomanceOptimisationClient.tsx (note the missing 'r'), update the import:
import PerformanceOptimisationClient from "@/components/PerformanceOptimisationClient";

export const metadata: Metadata = {
  title: "Website Speed Optimization Nigeria | Faster Pages, Better Conversions",
  description:
    "Website speed optimization in Nigeria for faster load times, better mobile experience, and stronger conversions. Fix slow websites properly.",
  keywords: [
    "web design",
    "web design services",
    "website speed optimisation",
    "website speed optimization nigeria",
    "website speed optimisation nigeria",
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
    title: "Website Speed Optimization Nigeria | Faster Pages, Better Conversions",
    description:
      "Website speed optimization in Nigeria to reduce bounce, improve mobile experience, and support better conversions.",
    url: "https://webgrowth.info/services/performance-optimisation",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/hero/Hero-Image-1.webp",
        width: 1200,
        height: 630,
        alt: "Speed & Performance Optimisation",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Speed Optimization Nigeria | Faster Pages, Better Conversions",
    description:
      "Website speed optimization in Nigeria to improve Core Web Vitals, mobile performance, and conversion quality.",
    images: ["https://webgrowth.info/images/hero/Hero-Image-1.webp"],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <PerformanceOptimisationClient />;
}


