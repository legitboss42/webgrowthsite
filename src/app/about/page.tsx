import AboutClient from "@/components/AboutClient";
import StructuredData from "@/components/StructuredData";
import { buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";

const pageDescription =
  "Web Growth is a premium Next.js agency building custom websites for clinics, service brands, and e-commerce businesses that need speed and conversion.";

export const metadata = buildPageMetadata({
  title: "About Web Growth | Premium Next.js Agency",
  description: pageDescription,
  path: "/about",
  keywords: [
    "about web growth",
    "victor chinukwue",
    "premium next.js agency",
    "next.js web design agency",
    "custom website development agency",
    "premium website development partner",
  ],
  image: "/images/about/about-hero.webp",
});

export default function AboutPage() {
  return (
    <>
      <StructuredData data={buildProfessionalServiceSchema("/about", pageDescription)} />
      <AboutClient />
    </>
  );
}
