import type { Metadata } from "next";
import ServicesClient from "@/components/ServicesClient";

export const metadata: Metadata = {
  title: "Services | Web Growth",
  description:
    "Explore Web Growth services: business websites, landing pages, redesign, e-commerce, maintenance, performance optimisation, and website audits.",
  keywords: [
    "web design services",
    "business website design",
    "landing page design",
    "website redesign",
    "ecommerce website design",
    "website maintenance",
    "performance optimisation",
    "website audit",
  ],
  alternates: { canonical: "https://webgrowth.info/services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <ServicesClient />;
}
