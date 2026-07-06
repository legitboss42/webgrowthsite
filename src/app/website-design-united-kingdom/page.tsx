import SolutionPageTemplateClient from "@/components/SolutionPageTemplateClient";
import { buildPageMetadata } from "@/lib/seo";
import { SOLUTION_PAGE_CONFIGS } from "@/lib/solutionPageConfigs";

const page = SOLUTION_PAGE_CONFIGS["website-design-united-kingdom"];

export const metadata = buildPageMetadata({
  title: page.seoTitle,
  description: page.metaDescription,
  path: "/website-design-united-kingdom",
  keywords: page.keywords,
  image: page.heroImage,
});

export default function WebsiteDesignUnitedKingdomPage() {
  return <SolutionPageTemplateClient page={page} />;
}
