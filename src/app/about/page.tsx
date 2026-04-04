import AboutClient from "@/components/AboutClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "About Web Growth",
  description:
    "Learn how Web Growth helps businesses in Lagos, Nigeria, the United Kingdom, and remote markets launch clearer, faster, more conversion-focused websites.",
  path: "/about",
  keywords: [
    "about web growth",
    "web designer nigeria",
    "web designer lagos",
    "web designer uk",
    "remote web design studio",
    "conversion-focused web design",
  ],
});

export default function AboutPage() {
  return <AboutClient />;
}
