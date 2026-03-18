import EditorialPolicyClient from "@/components/EditorialPolicyClient";
import { buildPageMetadata } from "@/lib/seo";

const pageDescription =
  "Learn how Web Growth creates, reviews, updates, and maintains website strategy, SEO, and launch content published on this site.";

export const metadata = buildPageMetadata({
  title: "Editorial Policy | Web Growth",
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
