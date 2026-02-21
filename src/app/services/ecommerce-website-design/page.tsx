import type { Metadata } from "next";
import EcommerceWebsiteDesignClient from "@/components/EcommerceWebsiteDesignClient";

export const metadata: Metadata = {
  title: "E-commerce Website Design | Web Growth",
  description:
    "E-commerce website design for small to mid-sized businesses. Clean product pages, trust-focused checkout, and a structure built to sell.",
  keywords: [
    "web design",
    "web design services",
    "ecommerce website design",
    "online store design",
    "woocommerce website design",
    "shop website design",
    "conversion focused ecommerce",
  ],
  alternates: {
    canonical: "https://webgrowth.info/services/ecommerce-website-design",
  },
  openGraph: {
    title: "E-commerce Website Design | Web Growth",
    description:
      "E-commerce web design services focused on trust, usability, and checkout conversion.",
    url: "https://webgrowth.info/services/ecommerce-website-design",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "E-commerce website design service",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "E-commerce Website Design | Web Growth",
    description:
      "E-commerce websites designed to improve product discovery, trust, and sales.",
    images: ["https://webgrowth.info/images/placeholder.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <EcommerceWebsiteDesignClient />;
}
