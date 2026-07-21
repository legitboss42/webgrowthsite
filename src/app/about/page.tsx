import AboutClient from "@/components/AboutClient";
import StructuredData from "@/components/StructuredData";
import { buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";

const pageDescription =
  "Learn how Web Growth combines website strategy, implementation, SEO, and practical guidance to help businesses build, grow, and monetize stronger websites.";

export const metadata = buildPageMetadata({
  title: "About Web Growth | Website Growth Platform",
  description: pageDescription,
  path: "/about",
  keywords: [
    "about web growth",
    "victorious",
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
