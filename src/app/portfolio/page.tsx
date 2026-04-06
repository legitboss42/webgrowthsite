import PortfolioClient from "@/components/PortfolioClient";
import StructuredData from "@/components/StructuredData";
import { buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";

const pageDescription =
  "Explore a Next.js web design portfolio featuring premium service, redesign, and e-commerce builds engineered for conversion.";

export const metadata = buildPageMetadata({
  title: "Next.js Web Design Portfolio | Web Growth",
  description: pageDescription,
  path: "/portfolio",
  keywords: [
    "next.js portfolio",
    "next.js web design portfolio",
    "web design portfolio",
    "ecommerce website portfolio",
    "custom website portfolio",
    "premium web design portfolio",
  ],
  image: "/images/portfolio/tlc-interiors-desktop.jpg",
});

export default function PortfolioPage() {
  return (
    <>
      <StructuredData data={buildProfessionalServiceSchema("/portfolio", pageDescription)} />
      <PortfolioClient />
    </>
  );
}
