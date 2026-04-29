import PortfolioClient from "@/components/PortfolioClient";
import StructuredData from "@/components/StructuredData";
import { buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";

const pageDescription =
  "Explore selected Web Growth website projects featuring real responsive screenshots, redesign work, ecommerce builds, landing pages, and product-focused interfaces.";

export const metadata = buildPageMetadata({
  title: "Next.js Web Design Portfolio | Web Growth",
  description: pageDescription,
  path: "/portfolio",
  keywords: [
    "web design portfolio",
    "website project portfolio",
    "selected website projects",
    "ecommerce website portfolio",
    "website redesign portfolio",
    "responsive website portfolio",
  ],
  image: "/images/portfolio/jluxe-cover.webp",
});

export default function PortfolioPage() {
  return (
    <>
      <StructuredData data={buildProfessionalServiceSchema("/portfolio", pageDescription)} />
      <PortfolioClient />
    </>
  );
}
