import type { Metadata } from "next";
import EcommerceWebsiteDesignClient from "@/components/EcommerceWebsiteDesignClient";

export const metadata: Metadata = {
  title: "E-commerce Website Design | Web Growth",
  description:
    "E-commerce website design for small to mid-sized businesses. Clean product pages, trust-focused checkout, and a structure built to sell.",
  keywords: [
    "ecommerce website design",
    "online store design",
    "woocommerce website design",
    "shop website design",
    "conversion focused ecommerce",
  ],
  alternates: {
    canonical: "https://webgrowth.info/services/ecommerce-website-design",
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <EcommerceWebsiteDesignClient />;
}
