import PricingClient from "@/components/PricingClient";
import StructuredData from "@/components/StructuredData";
import { buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";

const pageDescription =
  "Review Web Growth pricing guidance for premium website builds, redesigns, audits, and strategic growth support.";

export const metadata = buildPageMetadata({
  title: "Website Pricing and Project Scope | Web Growth",
  description: pageDescription,
  path: "/pricing",
  keywords: [
    "website pricing",
    "web design pricing",
    "website redesign pricing",
    "website audit pricing",
    "web growth pricing",
  ],
});

export default function PricingPage() {
  return (
    <>
      <StructuredData data={buildProfessionalServiceSchema("/pricing", pageDescription)} />
      <PricingClient />
    </>
  );
}
