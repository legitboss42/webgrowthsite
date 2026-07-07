import AcademyCategoryGrid from "@/components/home/AcademyCategoryGrid";
import FeaturedProofSection from "@/components/home/FeaturedProofSection";
import FreeToolsSection from "@/components/home/FreeToolsSection";
import HomepageHeroPlatform from "@/components/home/HomepageHeroPlatform";
import LearningPathsSection from "@/components/home/LearningPathsSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import PlatformServicesCTA from "@/components/home/PlatformServicesCTA";
import { featuredPortfolioCases } from "@/lib/portfolioCases";
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
  return (
    <main className="overflow-x-clip bg-[#f7f8fc] text-slate-950">
      <HomepageHeroPlatform />
      <AcademyCategoryGrid />
      <LearningPathsSection />
      <FreeToolsSection />
      <FeaturedProofSection cases={featuredPortfolioCases} />
      <PlatformServicesCTA />
      <NewsletterSection />
    </main>
  );
}
