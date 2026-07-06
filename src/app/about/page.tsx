import AboutClient from "@/components/AboutClient";
import StructuredData from "@/components/StructuredData";
import { buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";

const pageDescription =
  "Web Growth is a premium website growth platform that combines strategy, services, Academy resources, and practical implementation for businesses that want to build, grow, and monetize stronger websites.";

export const metadata = buildPageMetadata({
  title: "About Web Growth | Website Growth Platform",
  description: pageDescription,
  path: "/about",
  keywords: [
    "about web growth",
    "victor chinukwue",
    "website growth platform",
    "premium website strategy",
    "website growth consultant",
    "website redesign and seo support",
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
