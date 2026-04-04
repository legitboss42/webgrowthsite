import AboutClient from "@/components/AboutClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "About Victor Chinukwue | Web Growth",
  description:
    "Meet Victor Chinukwue, founder of Web Growth, and see how he builds conversion-focused websites for Lagos businesses and selective UK projects.",
  path: "/about",
  keywords: [
    "about web growth",
    "victor chinukwue",
    "web designer nigeria",
    "web designer lagos",
    "founder web growth",
    "conversion-focused web design",
  ],
});

export default function AboutPage() {
  return <AboutClient />;
}
