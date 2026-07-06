import SolutionPageTemplateClient from "@/components/SolutionPageTemplateClient";
import { buildPageMetadata } from "@/lib/seo";
import { SOLUTION_PAGE_CONFIGS } from "@/lib/solutionPageConfigs";

const page = SOLUTION_PAGE_CONFIGS["local-business"];

export const metadata = buildPageMetadata({
  title: page.seoTitle,
  description: page.metaDescription,
  path: "/local-business",
  keywords: page.keywords,
  image: page.heroImage,
});

export default function LocalBusinessPage() {
  return <SolutionPageTemplateClient page={page} />;
}
