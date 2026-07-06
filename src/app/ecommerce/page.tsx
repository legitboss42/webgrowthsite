import SolutionPageTemplateClient from "@/components/SolutionPageTemplateClient";
import { buildPageMetadata } from "@/lib/seo";
import { SOLUTION_PAGE_CONFIGS } from "@/lib/solutionPageConfigs";

const page = SOLUTION_PAGE_CONFIGS.ecommerce;

export const metadata = buildPageMetadata({
  title: page.seoTitle,
  description: page.metaDescription,
  path: "/ecommerce",
  keywords: page.keywords,
  image: page.heroImage,
});

export default function EcommercePage() {
  return <SolutionPageTemplateClient page={page} />;
}
