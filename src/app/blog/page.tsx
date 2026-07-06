import StructuredData from "@/components/StructuredData";
import BlogClient from "./BlogClient";
import { getPublicPosts } from "../../lib/posts";
import {
  buildBlogCollectionSchema,
  buildBreadcrumbSchema,
  buildPageMetadata,
} from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Web Growth Academy | SEO, AdSense, and Website Growth Guides",
  description:
    "Structured Academy resources on SEO, AdSense, website speed, redesign strategy, and conversions for businesses building stronger websites.",
  path: "/blog",
  keywords: [
    "website growth academy",
    "adsense academy",
    "seo academy",
    "website redesign guides",
    "website conversion guides",
    "website speed guides",
    "small business website strategy",
    "web growth academy",
  ],
});

export default function BlogPage() {
  const posts = getPublicPosts();
  return (
    <>
      <StructuredData
        data={[
          buildBlogCollectionSchema(posts),
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Academy", path: "/blog" },
          ]),
        ]}
      />
      <BlogClient posts={posts} />
    </>
  );
}
