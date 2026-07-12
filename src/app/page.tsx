import ApprovedHomepage from "@/components/home/ApprovedHomepage";
import { buildPageMetadata } from "@/lib/seo";

const pageDescription =
  "Web Growth helps businesses build better websites, improve search visibility, increase enquiries, and monetize with services, tools, and practical guides.";

export const metadata = buildPageMetadata({
  title: "Build, Grow, and Monetize Your Website | Web Growth",
  description: pageDescription,
  path: "/",
  keywords: [
    "website growth platform",
    "website growth academy",
    "website design services",
    "SEO resources",
    "website conversion optimization",
    "AdSense website preparation",
    "free website tools",
    "website growth strategy",
  ],
  image: "/images/hero/Hero-Image-1.webp",
});

export default function Page() {
  return <ApprovedHomepage />;
}
