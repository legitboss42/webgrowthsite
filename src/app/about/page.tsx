import AboutClient from "@/components/AboutClient";
import StructuredData from "@/components/StructuredData";
import { buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";

const pageDescription =
  "Web Growth is a web design agency building high-performance custom Next.js websites for Lagos service businesses and premium ecommerce brands.";

export const metadata = buildPageMetadata({
  title: "About Web Growth | Web Design Agency in Lagos",
  description: pageDescription,
  path: "/about",
  keywords: [
    "about web growth",
    "victor chinukwue",
    "web design agency in lagos",
    "next.js web design agency",
    "custom website development agency",
    "website redesign agency lagos",
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
