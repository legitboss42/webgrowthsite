import type { Metadata } from "next";
import WebsiteMaintenanceClient from "@/components/WebsiteMaintenanceClient";

export const metadata: Metadata = {
  title: "Website Maintenance & Support | Web Growth",
  description:
    "Website maintenance and support to keep your site secure, updated, fast, and reliable — with monthly care that prevents surprises.",
  keywords: [
    "website maintenance",
    "website support",
    "wordpress maintenance",
    "site updates",
    "website security",
    "website backups",
  ],
  alternates: {
    canonical: "https://webgrowth.info/services/website-maintenance",
  },
  openGraph: {
    title: "Website Maintenance & Support | Web Growth",
    description:
      "Monthly website care: updates, backups, security, and small fixes — so your site stays reliable.",
    url: "https://webgrowth.info/services/website-maintenance",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "Website Maintenance & Support",
      },
    ],
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <WebsiteMaintenanceClient />;
}
