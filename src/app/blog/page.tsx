import BlogClient from "./BlogClient";
import { getPosts } from "../../lib/posts";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Web Design Blog",
  description:
    "Practical articles on web design, SEO, launch strategy, and conversion for businesses in Nigeria and international markets that want more enquiries.",
  path: "/blog",
  keywords: [
    "web design blog",
    "small business website tips",
    "website launch strategy",
    "seo for service businesses",
  ],
});

export default function BlogPage() {
  const posts = getPosts();
  return <BlogClient posts={posts} />;
}
