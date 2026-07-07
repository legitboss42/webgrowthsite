import EditorialPolicyClient from "@/components/EditorialPolicyClient";
import { buildPageMetadata } from "@/lib/seo";

const pageDescription =
  "See how Web Growth researches, reviews, updates, and corrects website strategy, SEO, and growth content published on this site.";

export const metadata = buildPageMetadata({
  title: "Editorial Policy and Review Standards | Web Growth",
  description: pageDescription,
  path: "/editorial-policy",
  keywords: [
    "editorial policy web growth",
    "website content standards",
    "web growth publishing policy",
  ],
});

export default function EditorialPolicyPage() {
  return <EditorialPolicyClient />;
}
