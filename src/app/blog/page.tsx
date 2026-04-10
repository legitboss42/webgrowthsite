import StructuredData from "@/components/StructuredData";
import BlogClient from "./BlogClient";
import { getPosts } from "../../lib/posts";
import {
  buildBlogCollectionSchema,
  buildBreadcrumbSchema,
  buildPageMetadata,
} from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Web Growth Blog | SEO, Conversion, and Launch Guides",
  description:
    "Practical web design, SEO, launch, and conversion guides for businesses in Nigeria and international markets.",
  path: "/blog",
  keywords: [
    "web design blog",
    "small business website tips",
    "website launch strategy",
    "seo for service businesses",
    "small business website redesign checklist",
    "small business website seo checklist",
    "website not generating leads",
    "email marketing for small business",
  ],
});

export default function BlogPage() {
  const posts = getPosts();
  return (
    <>
      <StructuredData
        data={[
          buildBlogCollectionSchema(posts),
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ]}
      />
      <BlogClient posts={posts} />
    </>
  );
}
